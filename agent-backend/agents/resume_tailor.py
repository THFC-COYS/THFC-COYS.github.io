"""
Resume Tailor Agent — crafts a targeted resume and cover letter for a specific job.

Takes the master resume + job posting and produces:
1. A tailored resume (ATS-optimized, mirrors job language, highlights relevant experience)
2. A tailored cover letter (specific, compelling, ~300 words)
"""
import asyncio
import json
import logging
import anthropic

logger = logging.getLogger(__name__)


async def _with_retry(coro_fn, max_retries=4):
    """Retry an async API call on 429 with exponential backoff (2s, 4s, 8s, 16s)."""
    delay = 2
    for attempt in range(max_retries + 1):
        try:
            return await coro_fn()
        except anthropic.RateLimitError:
            if attempt == max_retries:
                raise
            logger.warning(f"Rate limited (429). Retrying in {delay}s... (attempt {attempt + 1}/{max_retries})")
            await asyncio.sleep(delay)
            delay *= 2

ATS_TARGET_SCORE = 96  # Minimum ATS score target (0-100)

SYSTEM_PROMPT = f"""Expert resume writer for higher-ed technology/EdTech leadership. Target: {ATS_TARGET_SCORE}%+ ATS score.

ATS RULES: Use EXACT job-description phrasing (not synonyms). Pack keywords into executive profile, competencies, and bullets. Include acronym + spelled-out (e.g. "LMS (Learning Management System)"). Top keywords in first 1/3. Repeat top 10 keywords 2-3x naturally.

CONTENT RULES: Never invent experience. Quantify everything. 2 pages max. Active voice. No markdown symbols.

After resume output:
ATS_SCORE: [0-100]
ATS_KEYWORDS_MATCHED: [comma list]
ATS_KEYWORDS_MISSING: [comma list or none]
ATS_SCORE_REASONING: [1 sentence]

If draft scores below {ATS_TARGET_SCORE}, revise before outputting."""

COVER_LETTER_PROMPT = """Write a targeted cover letter for Greg Lucas. 3 paragraphs, ~300 words. Opening: specific hook tied to company mission. Middle: 2-3 quantified achievements relevant to the role. Closing: confident call to action. No generic openers. Reference specific role/company details."""


async def tailor_resume(job: dict, master_resume: dict) -> dict:
    """
    Generate a tailored resume and cover letter for a specific job.
    Returns dict with 'resume', 'cover_letter', and 'ats_keywords'.
    """
    client = anthropic.AsyncAnthropic()

    # Truncate description to keep prompt size manageable
    description = (job.get('description', '') or '')[:1500]

    job_context = f"""ROLE: {job.get('title')} at {job.get('company')} | {job.get('location', '')}{'  (Remote)' if job.get('remote') else ''} | {job.get('salary_range', '')}

DESCRIPTION:
{description}

REQUIREMENTS: {'; '.join(job.get('key_requirements', []))}
STRONG MATCHES: {', '.join(job.get('strong_matches', []))}
GAPS: {', '.join(job.get('missing_qualifications', []))}"""

    job_stub = f"{job.get('title')} at {job.get('company')} — {'; '.join(job.get('key_requirements', [])[:5])}"

    resume_text = _format_master_resume(master_resume)

    # Step 1: Extract all keywords from job description
    kw_extraction = await _with_retry(lambda: client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=800,
        messages=[{
            "role": "user",
            "content": f"""Extract ALL keywords, required skills, and exact phrases from this job posting that an ATS would scan for.
Include: technical skills, soft skills, certifications, tools, industry terms, action verbs, and role-specific phrases.

JOB POSTING:
{job_context}

Return as a flat comma-separated list, most important first. Include both acronyms and spelled-out versions."""
        }]
    ))
    extracted_keywords = kw_extraction.content[0].text.strip()

    # Step 2: Generate tailored resume targeting 96%+ ATS
    resume_result = ""
    resume_user_msg = f"""Tailor Greg's resume for this specific role. TARGET: {ATS_TARGET_SCORE}%+ ATS score.

{job_context}

EXTRACTED ATS KEYWORDS (use ALL of these naturally throughout the resume):
{extracted_keywords}

GREG'S MASTER RESUME:
{resume_text}

Output a complete tailored resume using this structure:
[HEADER: Greg Lucas | phone | email | paigebreaker.com | lmsbreaker.com | thfc-coys.github.io | linkedin]
[EXECUTIVE PROFILE: 5-6 sentences using exact job-description language. Pack the top keywords here.]
[CORE COMPETENCIES: 12-14 items. Lead with exact phrases from the job posting.]
[PROFESSIONAL EXPERIENCE: Each bullet mirrors job language. Quantify everything.]
[INNOVATION & PLATFORMS: pAIgeBreaker (with LTI 1.3, 7-agent pipeline, 70% cost reduction), LMSBreaker/MoltALP, Flourish AI]
[EDUCATION]
[ATS SCORING BLOCK as specified]"""

    async def _run_resume_stream():
        async with client.messages.stream(
            model="claude-opus-4-6",
            max_tokens=5000,
            thinking={"type": "adaptive"},
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": resume_user_msg}]
        ) as stream:
            return await stream.get_final_message()

    response = await _with_retry(_run_resume_stream)
    for block in response.content:
        if block.type == "text":
            resume_result += block.text

    # Step 3: Self-review — if ATS score < target, do one revision pass
    ats_score = _extract_ats_score(resume_result)
    if ats_score < ATS_TARGET_SCORE:
        missing = _extract_missing_keywords(resume_result)
        if missing:
            current_resume = resume_result.split('ATS_SCORE:')[0].strip()
            revision = await _with_retry(lambda: client.messages.create(
                model="claude-opus-4-6",
                max_tokens=5000,
                system=SYSTEM_PROMPT,
                messages=[{
                    "role": "user",
                    "content": f"Resume scored {ats_score}% (target {ATS_TARGET_SCORE}%). Missing: {missing}\n\nRevise to add missing keywords naturally into executive profile, competencies, and bullets. Output full revised resume + ATS scoring block.\n\n{current_resume}"
                }]
            ))
            revised_text = revision.content[0].text.strip()
            if revised_text:
                resume_result = revised_text

    # Generate cover letter (uses compact stub — full description already processed above)
    cover_letter = ""
    cover_letter_user_msg = f"""Cover letter for Greg Lucas: {job_stub}

Highlight (pick most relevant 2-3): Blackboard→Halo LMS migration (100k+ students) | AI subcommittee chair + NIO initiative | >$5M annual savings via tech pilots | pAIgeBreaker 7-agent AI platform (LTI 1.3) | SNHU Team Lead of Year 2020 | 15+ yrs higher-ed tech leadership"""

    async def _run_cover_letter_stream():
        async with client.messages.stream(
            model="claude-opus-4-6",
            max_tokens=1000,
            system=COVER_LETTER_PROMPT,
            messages=[{"role": "user", "content": cover_letter_user_msg}]
        ) as stream:
            return await stream.get_final_message()

    response = await _with_retry(_run_cover_letter_stream)
    for block in response.content:
        if block.type == "text":
            cover_letter += block.text

    # Extract ATS scoring block from resume
    ats_score = _extract_ats_score(resume_result)
    ats_keywords_matched = _extract_ats_keywords_matched(resume_result)
    ats_keywords_missing = _extract_missing_keywords(resume_result)
    # Clean scoring block from the display resume
    resume_clean = resume_result.split("ATS_SCORE:")[0].strip()

    return {
        "resume": resume_clean,
        "cover_letter": cover_letter,
        "ats_score": ats_score,
        "ats_keywords_matched": ats_keywords_matched,
        "ats_keywords_missing": ats_keywords_missing,
        "ats_target": ATS_TARGET_SCORE,
        "ats_passed": ats_score >= ATS_TARGET_SCORE,
        "job_title": job.get("title"),
        "company": job.get("company")
    }


def _extract_ats_score(text: str) -> int:
    """Extract the ATS score from the scoring block."""
    import re
    match = re.search(r'ATS_SCORE:\s*(\d+)', text)
    return int(match.group(1)) if match else 0


def _extract_ats_keywords_matched(text: str) -> list[str]:
    """Extract matched keywords from scoring block."""
    import re
    match = re.search(r'ATS_KEYWORDS_MATCHED:\s*(.+)', text)
    if match:
        return [k.strip() for k in match.group(1).split(",") if k.strip()]
    return []


def _extract_missing_keywords(text: str) -> list[str]:
    """Extract missing keywords from scoring block."""
    import re
    match = re.search(r'ATS_KEYWORDS_MISSING:\s*(.+)', text)
    if match:
        val = match.group(1).strip()
        if val.lower() in ("none", "n/a", ""):
            return []
        return [k.strip() for k in val.split(",") if k.strip()]
    return []


def _format_master_resume(resume: dict) -> str:
    """Format master resume dict as readable text for prompting."""
    lines = []

    p = resume.get("personal", {})
    lines.append(f"NAME: {p.get('name')}")
    lines.append(f"TITLE: {p.get('title')}")
    lines.append(f"CONTACT: {p.get('phone')} | {p.get('email')} | {p.get('portfolio')} | {p.get('secondary_site', '')} | {p.get('github', '')} | {p.get('linkedin', '')}")
    lines.append(f"\nSUMMARY:\n{p.get('summary', '')}")

    lines.append("\nCORE COMPETENCIES:")
    for c in resume.get("core_competencies", []):
        lines.append(f"- {c}")

    lines.append("\nEXPERIENCE:")
    for exp in resume.get("experience", []):
        lines.append(f"\n{exp['title']} | {exp['company']} | {exp['start']}-{exp['end']}")
        for bullet in exp.get("highlights", []):
            lines.append(f"  • {bullet}")

    lines.append("\nINNOVATION PROJECTS:")
    for proj in resume.get("innovation_projects", []):
        lines.append(f"\n{proj['name']} ({proj.get('url', '')})")
        lines.append(f"  {proj['description']}")

    lines.append("\nEDUCATION:")
    for edu in resume.get("education", []):
        lines.append(f"- {edu['degree']}, {edu.get('field', '')} — {edu.get('institution', '')}")

    lines.append("\nAWARDS & RECOGNITION:")
    for award in resume.get("awards_recognition", []):
        lines.append(f"- {award}")

    return "\n".join(lines)
