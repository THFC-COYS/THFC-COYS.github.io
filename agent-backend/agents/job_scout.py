"""
Job Scout Agent — searches the web for AI + Education roles matching Greg's profile.

Uses Claude with web_search tool to find fresh job postings, then scores each role
against the master resume. Returns structured job objects ready for the resume tailor.
"""
import json
import anthropic

SYSTEM_PROMPT = """You are a specialized job scout agent for Greg Lucas, a technology leader
with 15+ years of experience at the intersection of AI, innovation, and education.

Your role:
1. Search for job openings that match his background
2. Cast a WIDE net — include any of these role types:
   - AI product, strategy, or platform roles (Director/VP of AI, Head of AI Products)
   - Innovation leadership (Chief Innovation Officer, Director of Innovation, VP of R&D)
   - EdTech and learning technology leadership
   - Academic technology and LMS strategy
   - Corporate L&D technology leadership
   - AI company roles focused on education, training, or workforce development
   - Instructional design platform or learning experience platform (LXP) leadership
3. Target seniority: Director, VP, Head of, Senior Manager, Chief, or Founder-level
4. Prioritize roles at: AI companies, EdTech companies, universities, LMS vendors,
   OPM providers, corporate L&D, workforce tech companies, HR tech companies
5. Look for postings from the last 60 days
6. Extract: title, company, URL, location, salary (if listed), key requirements

Search queries to use:
- "Director of AI" OR "VP of AI" OR "Head of AI" job opening 2025 2026
- "Chief Innovation Officer" OR "Director of Innovation" hiring 2025 2026
- "VP of Learning Technology" OR "Director of Learning Technology" job
- "Head of EdTech" OR "Director of EdTech" company hiring
- "AI in Education" director OR VP OR lead role site:linkedin.com OR site:greenhouse.io
- "Director of Learning Experience" OR "Head of Learning Products" job posting
- "VP of Product" AI education OR learning platform hiring
- site:greenhouse.io OR site:lever.co "artificial intelligence" director learning OR education

IMPORTANT: Return results as a JSON array — this is required. For each job include:
{
  "title": "...",
  "company": "...",
  "url": "...",
  "location": "...",
  "remote": true/false,
  "salary_range": "... or null",
  "description": "3-5 sentence summary of role and requirements",
  "key_requirements": ["..."],
  "source": "linkedin|indeed|greenhouse|lever|other"
}

You MUST return a JSON array even if some fields are incomplete. Do not return prose."""


async def run_job_scout(target_count: int = 10) -> list[dict]:
    """
    Run the Job Scout agent to find new job openings.
    Returns a list of job dicts with fit scores applied.
    """
    client = anthropic.AsyncAnthropic()

    found_jobs = []

    async with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=8000,
        system=SYSTEM_PROMPT,
        tools=[{"type": "web_search_20260209", "name": "web_search"}],
        messages=[{
            "role": "user",
            "content": f"""Search for {target_count} current job openings that match Greg Lucas's profile.

Greg's background:
- 15+ years in technology leadership across AI, education, and innovation
- Faculty Chair & Academic Innovation Leader at GCU (Grand Canyon University)
- Led LMS migration from Blackboard to Halo LMS
- Chaired Academic Technology AI subcommittee
- Founded pAIgeBreaker (AI-native learning platform with 7-agent pipeline, LTI 1.3)
- Founded LMSBreaker / MoltALP (AI-native LMS replacement)
- SNHU COLT Team Lead of the Year (2020)
- Deep expertise: AI product strategy, LMS optimization, AI integration, CBE, LTI, vendor roadmaps

Search broadly — include AI leadership roles, innovation director roles, EdTech roles,
and learning technology roles. Look for postings from the last 60 days.

IMPORTANT: You MUST return your findings as a valid JSON array of job objects.
Start your final response with [ and end with ]. Include {target_count} jobs."""
        }]
    ) as stream:
        response = await stream.get_final_message()

    # Extract text content from response
    raw_text = ""
    for block in response.content:
        if block.type == "text":
            raw_text += block.text

    # Parse JSON from the response
    jobs = _extract_jobs_from_text(raw_text)
    return jobs


def _extract_jobs_from_text(text: str) -> list[dict]:
    """Extract job list from Claude's response text."""
    import re

    # Try to find a JSON array in the text
    json_match = re.search(r'\[[\s\S]*\]', text)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    # Fall back to returning empty list if parsing fails
    return []


async def score_job_fit(job: dict, master_resume: dict) -> dict:
    """
    Score a single job against the master resume using Claude.
    Returns the job dict with fit_score (0.0-1.0) and fit_reasoning added.
    """
    client = anthropic.AsyncAnthropic()

    prompt = f"""Score this job posting against Greg Lucas's profile on a scale of 0.0 to 1.0.

JOB:
Title: {job.get('title')}
Company: {job.get('company')}
Description: {job.get('description', '')}
Key Requirements: {json.dumps(job.get('key_requirements', []))}

GREG'S PROFILE SUMMARY:
- 15+ years higher-ed tech leadership
- Faculty Chair at GCU, SNHU COLT Team Lead
- Expertise: LMS (Blackboard→Halo migration), LTI 1.3, AI integration, CBE, vendor roadmaps
- Founded AI-native EdTech platforms (pAIgeBreaker, LMSBreaker)
- Led 30-50 person faculty teams
- Saved GCU >$5M annually through tech pilots
- Core competencies: {', '.join(master_resume.get('core_competencies', [])[:6])}

Respond with JSON only:
{{
  "fit_score": 0.0-1.0,
  "fit_reasoning": "2-3 sentence explanation",
  "missing_qualifications": ["..."] or [],
  "strong_matches": ["..."]
}}"""

    response = await client.messages.create(
        model="claude-opus-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}]
    )

    try:
        import re
        text = response.content[0].text
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            scoring = json.loads(json_match.group())
            job["fit_score"] = scoring.get("fit_score", 0.5)
            job["fit_reasoning"] = scoring.get("fit_reasoning", "")
            job["strong_matches"] = scoring.get("strong_matches", [])
            job["missing_qualifications"] = scoring.get("missing_qualifications", [])
    except Exception:
        job["fit_score"] = 0.5
        job["fit_reasoning"] = "Could not score automatically"

    return job
