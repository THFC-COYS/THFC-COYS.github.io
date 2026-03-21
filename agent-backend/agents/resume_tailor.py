"""
Resume Tailor Agent — crafts a targeted resume and cover letter for a specific job.

Takes the master resume + job posting and produces:
1. A tailored resume (ATS-optimized, mirrors job language, highlights relevant experience)
2. A tailored cover letter (specific, compelling, ~300 words)
"""
import json
import anthropic

SYSTEM_PROMPT = """You are an expert resume writer and career coach specializing in
higher education technology and EdTech leadership roles. You have deep knowledge of:
- ATS (Applicant Tracking Systems) and keyword optimization
- Executive resume formatting for Director/VP/C-suite roles
- Higher education hiring practices
- EdTech industry expectations
- How to position AI/LMS expertise compellingly

Your job is to tailor Greg Lucas's master resume to a specific job posting. Rules:
1. NEVER invent experience, credentials, or accomplishments — only use what's in the master resume
2. Mirror the job description's exact language and keywords throughout
3. Reorder and reframe bullets to lead with what's most relevant to THIS role
4. Quantify impact wherever possible (use numbers from the master resume)
4. Keep the resume to 1-2 pages of content (output clean text, no markdown symbols)
5. Write in active voice, past tense for past roles, present tense for current
6. Include an ATS keyword density score estimate at the end"""

COVER_LETTER_PROMPT = """You are writing a targeted cover letter for Greg Lucas.
Rules:
1. 3 paragraphs, ~300 words total
2. Opening: specific hook connecting Greg's background to THIS company's mission
3. Middle: 2-3 concrete achievements most relevant to the role with measurable impact
4. Closing: confident call to action
5. Never use generic phrases like 'I am writing to express my interest'
6. Reference specific things about the company/role to show research"""


async def tailor_resume(job: dict, master_resume: dict) -> dict:
    """
    Generate a tailored resume and cover letter for a specific job.
    Returns dict with 'resume', 'cover_letter', and 'ats_keywords'.
    """
    client = anthropic.AsyncAnthropic()

    job_context = f"""
JOB TITLE: {job.get('title')}
COMPANY: {job.get('company')}
LOCATION: {job.get('location', 'Not specified')} {'(Remote)' if job.get('remote') else ''}
SALARY: {job.get('salary_range', 'Not specified')}

JOB DESCRIPTION:
{job.get('description', '')}

KEY REQUIREMENTS:
{json.dumps(job.get('key_requirements', []), indent=2)}

FIT ANALYSIS:
Strong matches: {json.dumps(job.get('strong_matches', []))}
Potential gaps: {json.dumps(job.get('missing_qualifications', []))}
"""

    resume_text = _format_master_resume(master_resume)

    # Generate tailored resume
    resume_result = ""
    async with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=4000,
        thinking={"type": "adaptive"},
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": f"""Tailor Greg's resume for this specific role.

{job_context}

GREG'S MASTER RESUME:
{resume_text}

Output a complete tailored resume. Use this exact structure:
[HEADER: Name, contact info, websites]
[EXECUTIVE PROFILE: 4-5 sentences, heavily mirroring the job's language]
[CORE COMPETENCIES: 10-12 bullet points, prioritized for this role]
[PROFESSIONAL EXPERIENCE: Reordered/reframed bullets leading with most relevant]
[INNOVATION & PLATFORMS: pAIgeBreaker, LMSBreaker, Flourish AI]
[EDUCATION]

At the end, on a separate line, add:
ATS_KEYWORDS: [comma-separated list of keywords from the job description that appear in this resume]"""
        }]
    ) as stream:
        response = await stream.get_final_message()

    for block in response.content:
        if block.type == "text":
            resume_result += block.text

    # Generate cover letter
    cover_letter = ""
    async with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=1000,
        system=COVER_LETTER_PROMPT,
        messages=[{
            "role": "user",
            "content": f"""Write a targeted cover letter for Greg Lucas applying to:

{job_context}

Key achievements to potentially highlight:
- Led Blackboard → Halo LMS migration at GCU (institution of 100k+ students)
- Chaired AI subcommittee, launched NIO initiative
- Saved GCU >$5M annually through tech pilot programs
- Built pAIgeBreaker: 7-agent AI platform with LTI 1.3
- SNHU Team Lead of the Year 2020
- 15+ years higher-ed tech leadership

Write the cover letter now:"""
        }]
    ) as stream:
        response = await stream.get_final_message()

    for block in response.content:
        if block.type == "text":
            cover_letter += block.text

    # Extract ATS keywords
    ats_keywords = []
    if "ATS_KEYWORDS:" in resume_result:
        kw_line = resume_result.split("ATS_KEYWORDS:")[-1].strip().split("\n")[0]
        ats_keywords = [k.strip() for k in kw_line.split(",") if k.strip()]
        # Clean the resume text
        resume_result = resume_result.split("ATS_KEYWORDS:")[0].strip()

    return {
        "resume": resume_result,
        "cover_letter": cover_letter,
        "ats_keywords": ats_keywords,
        "job_title": job.get("title"),
        "company": job.get("company")
    }


def _format_master_resume(resume: dict) -> str:
    """Format master resume dict as readable text for prompting."""
    lines = []

    p = resume.get("personal", {})
    lines.append(f"NAME: {p.get('name')}")
    lines.append(f"TITLE: {p.get('title')}")
    lines.append(f"CONTACT: {p.get('phone')} | {p.get('email')} | {p.get('portfolio')} | {p.get('secondary_site', '')}")
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
