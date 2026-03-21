"""
Orchestrator — coordinates all four agents in the career engine pipeline.

Pipeline:
1. Job Scout → finds new jobs matching Greg's profile
2. Scorer → filters to high-fit jobs (score >= threshold)
3. Resume Tailor → generates tailored resume + cover letter per job
4. [Human Review Gate] → jobs queue for approval before outreach
5. Outreach Agent → finds hiring manager + drafts messages
6. Interview Prep Agent → builds full prep guide per job

The orchestrator tracks everything in SQLite via database.py.
"""
import asyncio
import json
import logging
from pathlib import Path

from agents.job_scout import run_job_scout, score_job_fit
from agents.resume_tailor import tailor_resume
from agents.outreach import generate_outreach
from agents.interview_prep import generate_interview_prep
from database import (
    init_db, save_job, get_jobs, get_job,
    update_job_status, save_application,
    save_interview_prep, save_outreach
)

logger = logging.getLogger(__name__)

MASTER_RESUME_PATH = Path(__file__).parent / "master_resume.json"
FIT_SCORE_THRESHOLD = 0.65  # Only process jobs above this score


def load_master_resume() -> dict:
    with open(MASTER_RESUME_PATH) as f:
        return json.load(f)


async def run_job_discovery(target_count: int = 10) -> list[dict]:
    """
    Stage 1: Run job scout + score all found jobs.
    Returns list of scored jobs saved to DB.
    """
    await init_db()
    master_resume = load_master_resume()

    logger.info(f"Starting job discovery (target: {target_count} jobs)...")
    raw_jobs = await run_job_scout(target_count=target_count)
    logger.info(f"Found {len(raw_jobs)} raw job postings")

    scored_jobs = []
    score_tasks = [score_job_fit(job, master_resume) for job in raw_jobs]
    scored = await asyncio.gather(*score_tasks)

    for job in scored:
        job_id = await save_job(job)
        job["id"] = job_id
        scored_jobs.append(job)
        logger.info(f"Saved job: {job.get('title')} at {job.get('company')} (fit: {job.get('fit_score', 0):.2f})")

    # Sort by fit score descending
    scored_jobs.sort(key=lambda j: j.get("fit_score", 0), reverse=True)
    return scored_jobs


async def process_job_full_pipeline(job_id: int) -> dict:
    """
    Runs the full pipeline for a single approved job:
    Resume Tailor → Outreach → Interview Prep
    Returns a complete package.
    """
    await init_db()
    master_resume = load_master_resume()

    job = await get_job(job_id)
    if not job:
        raise ValueError(f"Job {job_id} not found in database")

    logger.info(f"Processing full pipeline for: {job['title']} at {job['company']}")
    results = {}

    # Step 1: Tailor resume + cover letter
    logger.info("Tailoring resume...")
    try:
        tailored = await tailor_resume(job, master_resume)
        app_id = await save_application(
            job_id,
            tailored["resume"],
            tailored["cover_letter"]
        )
        results["application"] = {**tailored, "id": app_id}
        await update_job_status(job_id, "resume_ready")
    except Exception as e:
        logger.error(f"Resume tailor failed: {e}")
        results["application"] = {"error": str(e)}

    # Step 2: Generate outreach
    logger.info("Generating outreach...")
    try:
        outreach_data = await generate_outreach(job, master_resume)
        outreach_id = await save_outreach(job_id, outreach_data)
        results["outreach"] = {**outreach_data, "id": outreach_id}
        await update_job_status(job_id, "outreach_ready")
    except Exception as e:
        logger.error(f"Outreach agent failed: {e}")
        results["outreach"] = {"error": str(e)}

    # Step 3: Interview prep
    logger.info("Building interview prep...")
    try:
        tailored_resume_text = results.get("application", {}).get("resume", "")
        prep = await generate_interview_prep(job, master_resume, tailored_resume_text)
        prep_id = await save_interview_prep(job_id, json.dumps(prep))
        results["interview_prep"] = {**prep, "id": prep_id}
        await update_job_status(job_id, "fully_prepared")
    except Exception as e:
        logger.error(f"Interview prep agent failed: {e}")
        results["interview_prep"] = {"error": str(e)}

    results["job"] = job
    logger.info(f"Pipeline complete for job {job_id}")
    return results


async def run_quick_scout_and_prepare(target_count: int = 5) -> dict:
    """
    Convenience function: discover jobs + auto-prepare top N high-fit jobs.
    For demonstration / automated daily runs.
    """
    scored_jobs = await run_job_discovery(target_count=target_count)

    high_fit = [j for j in scored_jobs if j.get("fit_score", 0) >= FIT_SCORE_THRESHOLD]
    logger.info(f"{len(high_fit)} jobs above fit threshold {FIT_SCORE_THRESHOLD}")

    results = []
    for job in high_fit[:3]:  # Auto-prepare top 3
        if job.get("id"):
            try:
                package = await process_job_full_pipeline(job["id"])
                results.append(package)
            except Exception as e:
                logger.error(f"Pipeline failed for job {job.get('id')}: {e}")

    return {
        "total_found": len(scored_jobs),
        "high_fit_count": len(high_fit),
        "prepared_count": len(results),
        "packages": results
    }
