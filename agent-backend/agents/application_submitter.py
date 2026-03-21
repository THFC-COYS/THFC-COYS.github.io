"""
Application Submitter Agent — auto-submits job applications via browser automation.

Auto-submits when fit_score >= AUTO_SUBMIT_THRESHOLD (default 0.85).
Supports: LinkedIn Easy Apply, Greenhouse, Lever, Workday.

Flow:
1. Receive job + tailored resume from orchestrator
2. Detect platform from job URL
3. Route to correct platform handler
4. Answer any custom questions using Claude
5. Upload tailored resume PDF + cover letter
6. Submit and record confirmation
"""
import asyncio
import json
import logging
import os
from pathlib import Path

import anthropic

logger = logging.getLogger(__name__)

AUTO_SUBMIT_THRESHOLD = float(os.getenv("AUTO_SUBMIT_THRESHOLD", "0.85"))
RESUME_PDF_DIR = Path(__file__).parent.parent / "generated_resumes"


async def submit_application(
    job: dict,
    resume_text: str,
    cover_letter_text: str,
    master_resume: dict
) -> dict:
    """
    Main entry point. Detects platform, converts resume to PDF, submits.

    Returns:
        {
          'success': bool,
          'platform': str,
          'message': str,
          'confirmation_id': str or None,
          'auto_submitted': bool
        }
    """
    fit_score = job.get("fit_score", 0.0)
    job_url = job.get("url", "")

    if fit_score < AUTO_SUBMIT_THRESHOLD:
        return {
            "success": False,
            "platform": "none",
            "message": f"Fit score {fit_score:.2f} below auto-submit threshold {AUTO_SUBMIT_THRESHOLD}",
            "confirmation_id": None,
            "auto_submitted": False
        }

    if not job_url:
        return {
            "success": False,
            "platform": "none",
            "message": "No job URL provided",
            "confirmation_id": None,
            "auto_submitted": False
        }

    # Generate tailored resume PDF
    resume_pdf_path = await _generate_resume_pdf(job, resume_text)

    # Detect platform
    platform = _detect_platform(job_url)
    logger.info(f"Auto-submitting to {platform}: {job.get('title')} at {job.get('company')}")

    # Build the answer agent (Claude answers custom form questions)
    answer_agent = _build_answer_agent(master_resume, job)

    # Route to platform handler
    try:
        if platform == "linkedin":
            from platform_handlers.linkedin import apply
        elif platform in ("greenhouse", "lever"):
            from platform_handlers.greenhouse_lever import apply
        elif platform == "workday":
            from platform_handlers.workday import apply
        else:
            return {
                "success": False,
                "platform": platform,
                "message": f"Unsupported platform: {platform}. Manual application required.",
                "confirmation_id": None,
                "auto_submitted": False
            }

        result = await apply(job, str(resume_pdf_path), cover_letter_text, answer_agent)
        result["platform"] = platform
        result["auto_submitted"] = True
        return result

    except Exception as e:
        logger.error(f"Application submission failed: {e}")
        return {
            "success": False,
            "platform": platform,
            "message": str(e),
            "confirmation_id": None,
            "auto_submitted": True
        }


def _detect_platform(url: str) -> str:
    """Detect ATS platform from job URL."""
    url_lower = url.lower()
    if "linkedin.com/jobs" in url_lower:
        return "linkedin"
    if "greenhouse.io" in url_lower:
        return "greenhouse"
    if "jobs.lever.co" in url_lower:
        return "lever"
    if "myworkdayjobs.com" in url_lower or "/wday/" in url_lower or "wd1.myworkday" in url_lower:
        return "workday"
    if "icims.com" in url_lower:
        return "icims"
    if "taleo.net" in url_lower:
        return "taleo"
    return "unknown"


async def _generate_resume_pdf(job: dict, resume_text: str) -> Path:
    """
    Convert resume text to a formatted PDF.
    Saves to generated_resumes/<company>_<title>.pdf
    """
    RESUME_PDF_DIR.mkdir(parents=True, exist_ok=True)

    safe_name = f"{job.get('company', 'company')}_{job.get('title', 'role')}".replace(" ", "_").replace("/", "-")[:60]
    pdf_path = RESUME_PDF_DIR / f"{safe_name}.pdf"

    try:
        # Try reportlab first (best formatting)
        pdf_path = await _generate_pdf_reportlab(resume_text, pdf_path)
    except ImportError:
        try:
            # Fallback: fpdf2
            pdf_path = await _generate_pdf_fpdf(resume_text, pdf_path)
        except ImportError:
            logger.warning("Neither reportlab nor fpdf2 installed. Resume PDF generation skipped.")
            logger.warning("Install with: pip install reportlab")
            return pdf_path  # Return path even if file doesn't exist; handlers will skip upload

    return pdf_path


async def _generate_pdf_reportlab(resume_text: str, output_path: Path) -> Path:
    """Generate PDF using reportlab."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib import colors

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch
    )

    styles = getSampleStyleSheet()
    header_style = ParagraphStyle(
        "Header", parent=styles["Heading1"],
        fontSize=14, spaceAfter=4, textColor=colors.HexColor("#1a1a2e")
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=10, spaceAfter=3, leading=14
    )

    story = []
    for line in resume_text.split("\n"):
        line = line.strip()
        if not line:
            story.append(Spacer(1, 4))
            continue
        # All-caps lines or lines ending with role separators are headers
        if line.isupper() or (len(line) < 60 and line == line.upper()):
            story.append(Paragraph(line, header_style))
        else:
            # Escape HTML chars for reportlab
            safe_line = line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            story.append(Paragraph(safe_line, body_style))

    doc.build(story)
    logger.info(f"Resume PDF generated: {output_path}")
    return output_path


async def _generate_pdf_fpdf(resume_text: str, output_path: Path) -> Path:
    """Fallback PDF generation using fpdf2."""
    from fpdf import FPDF

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", size=10)

    for line in resume_text.split("\n"):
        line = line.strip()
        if not line:
            pdf.ln(3)
            continue
        if line.isupper() and len(line) < 80:
            pdf.set_font("Helvetica", "B", 11)
            pdf.multi_cell(0, 5, line)
            pdf.set_font("Helvetica", size=10)
        else:
            pdf.multi_cell(0, 5, line)

    pdf.output(str(output_path))
    logger.info(f"Resume PDF generated (fpdf): {output_path}")
    return output_path


def _build_answer_agent(master_resume: dict, job: dict):
    """
    Returns an async callable that uses Claude to answer custom form questions.
    Signature: answer_agent(question: str, job: dict) -> str
    """
    client = anthropic.Anthropic()

    personal = master_resume.get("personal", {})
    context_block = f"""You are answering job application form questions on behalf of Greg Lucas.

GREG'S PROFILE:
- Name: {personal.get('name')}
- Email: {personal.get('email')}
- Phone: {personal.get('phone')}
- Location: {personal.get('location')}
- LinkedIn: {personal.get('linkedin')}
- Portfolio: {personal.get('portfolio')} and {personal.get('secondary_site', '')}
- Current role: Faculty Chair & Academic Innovation Leader at Grand Canyon University (15+ years)
- Also: Founder of pAIgeBreaker (AI learning platform) and LMSBreaker (AI-native LMS)
- Education: Master's & Bachelor's in Business/Technology

JOB: {job.get('title')} at {job.get('company')}

Rules:
- Give SHORT, direct answers (1 sentence for short fields, 3 sentences max)
- For "years of experience" questions: answer truthfully (15 years for tech/education)
- For salary questions: respond "Negotiable" or use the job's posted range
- For "why do you want to work here" questions: give a specific, genuine answer
- For yes/no questions: answer honestly (e.g., "Are you authorized to work in the US?" → "Yes")
- For "how did you hear about this position": respond "Online job board"
- Never make up false information
- For dropdown options, return EXACTLY the option text as it would appear in the dropdown"""

    async def answer_agent(question: str, ctx_job: dict) -> str:
        try:
            response = client.messages.create(
                model="claude-opus-4-6",
                max_tokens=150,
                system=context_block,
                messages=[{
                    "role": "user",
                    "content": f"Answer this application field: {question}"
                }]
            )
            answer = response.content[0].text.strip()
            # Clean up common AI padding
            for prefix in ["Answer:", "Response:", "My answer:", "I would say:"]:
                if answer.startswith(prefix):
                    answer = answer[len(prefix):].strip()
            return answer
        except Exception as e:
            logger.warning(f"Answer agent error for '{question}': {e}")
            return ""

    return answer_agent
