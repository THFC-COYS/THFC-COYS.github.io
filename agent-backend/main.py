"""
Career Engine API — FastAPI backend for the AI agent interview team.

Endpoints:
  POST /api/jobs/discover     - Run job scout agent
  GET  /api/jobs              - List all tracked jobs
  GET  /api/jobs/{id}         - Get single job
  POST /api/jobs/{id}/prepare - Run full pipeline on a job
  GET  /api/jobs/{id}/resume  - Get tailored resume
  GET  /api/jobs/{id}/prep    - Get interview prep
  GET  /api/jobs/{id}/outreach - Get outreach messages
  POST /api/jobs/{id}/status  - Update job status
  GET  /api/health            - Health check
"""
import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from database import (
    init_db, get_jobs, get_job, update_job_status,
    get_application, get_interview_prep
)
from orchestrator import (
    run_job_discovery, process_job_full_pipeline,
    run_quick_scout_and_prepare
)

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("Career Engine API started — database initialized")
    yield


app = FastAPI(
    title="Career Engine API",
    description="AI agent team for job hunting and interview landing",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — allow the portfolio site and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
        "https://thfc-coys.github.io",
        "http://localhost:8080",
        "http://127.0.0.1:5500",  # VS Code Live Server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request/Response Models ---

class DiscoverRequest(BaseModel):
    target_count: int = 10


class StatusUpdate(BaseModel):
    status: str  # new | reviewed | applied | interviewing | rejected | offer


class PipelineRequest(BaseModel):
    run_outreach: bool = True
    run_interview_prep: bool = True


# --- Endpoints ---

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "Career Engine API"}


@app.post("/api/jobs/discover")
async def discover_jobs(request: DiscoverRequest, background_tasks: BackgroundTasks):
    """
    Trigger job scout agent. Runs in background and returns immediately.
    Poll GET /api/jobs to see results as they come in.
    """
    background_tasks.add_task(_run_discovery_task, request.target_count)
    return {
        "message": f"Job discovery started (target: {request.target_count} jobs)",
        "status": "running"
    }


@app.post("/api/jobs/discover/sync")
async def discover_jobs_sync(request: DiscoverRequest):
    """Synchronous version — waits for discovery to complete. Use for demos."""
    try:
        jobs = await run_job_discovery(target_count=request.target_count)
        return {
            "found": len(jobs),
            "jobs": jobs,
            "high_fit": [j for j in jobs if j.get("fit_score", 0) >= 0.65]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/jobs")
async def list_jobs(status: str = None, limit: int = 20):
    """Get all tracked jobs, optionally filtered by status."""
    jobs = await get_jobs(status=status, limit=limit)
    return {"jobs": jobs, "count": len(jobs)}


@app.get("/api/jobs/{job_id}")
async def get_job_detail(job_id: int):
    """Get a single job with all associated data."""
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Attach application and prep if available
    application = await get_application(job_id)
    prep_row = await get_interview_prep(job_id)

    return {
        "job": job,
        "has_resume": application is not None,
        "has_interview_prep": prep_row is not None,
    }


@app.post("/api/jobs/{job_id}/prepare")
async def prepare_job(job_id: int, request: PipelineRequest, background_tasks: BackgroundTasks):
    """
    Run the full preparation pipeline for a job:
    Resume Tailor → Outreach → Interview Prep
    """
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    background_tasks.add_task(_run_pipeline_task, job_id)
    return {
        "message": f"Preparation pipeline started for job {job_id}",
        "job": f"{job['title']} at {job['company']}",
        "status": "running"
    }


@app.post("/api/jobs/{job_id}/prepare/sync")
async def prepare_job_sync(job_id: int):
    """Synchronous pipeline — waits for all agents to finish."""
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    try:
        package = await process_job_full_pipeline(job_id)
        return package
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/jobs/{job_id}/resume")
async def get_resume(job_id: int):
    """Get the tailored resume and cover letter for a job."""
    application = await get_application(job_id)
    if not application:
        raise HTTPException(status_code=404, detail="No resume generated for this job yet")
    return {
        "resume": application["tailored_resume"],
        "cover_letter": application["cover_letter"],
        "created_at": application["created_at"],
        "status": application["status"]
    }


@app.get("/api/jobs/{job_id}/prep")
async def get_prep(job_id: int):
    """Get the interview prep guide for a job."""
    prep_row = await get_interview_prep(job_id)
    if not prep_row:
        raise HTTPException(status_code=404, detail="No interview prep generated for this job yet")
    try:
        prep_data = json.loads(prep_row["questions_and_answers"])
    except (json.JSONDecodeError, KeyError):
        prep_data = {"raw": prep_row.get("questions_and_answers", "")}
    return {
        "prep": prep_data,
        "created_at": prep_row["created_at"]
    }


@app.post("/api/jobs/{job_id}/status")
async def update_status(job_id: int, update: StatusUpdate):
    """Update the application status of a job."""
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await update_job_status(job_id, update.status)
    return {"job_id": job_id, "status": update.status}


@app.post("/api/run-full-pipeline")
async def run_full_pipeline(background_tasks: BackgroundTasks):
    """
    One-shot: discover jobs + prepare top 3 high-fit jobs automatically.
    Designed for daily automated runs.
    """
    background_tasks.add_task(_run_full_pipeline_task)
    return {"message": "Full pipeline started: discovery + preparation for top 3 high-fit jobs"}


# --- Background Task Runners ---

async def _run_discovery_task(target_count: int):
    try:
        jobs = await run_job_discovery(target_count=target_count)
        logger.info(f"Discovery complete: {len(jobs)} jobs found and saved")
    except Exception as e:
        logger.error(f"Discovery task failed: {e}")


async def _run_pipeline_task(job_id: int):
    try:
        package = await process_job_full_pipeline(job_id)
        logger.info(f"Pipeline complete for job {job_id}")
    except Exception as e:
        logger.error(f"Pipeline task failed for job {job_id}: {e}")


async def _run_full_pipeline_task():
    try:
        result = await run_quick_scout_and_prepare()
        logger.info(
            f"Full pipeline complete: {result['total_found']} found, "
            f"{result['high_fit_count']} high-fit, "
            f"{result['prepared_count']} fully prepared"
        )
    except Exception as e:
        logger.error(f"Full pipeline task failed: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
