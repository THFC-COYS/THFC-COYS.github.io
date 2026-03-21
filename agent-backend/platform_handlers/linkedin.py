"""
LinkedIn Easy Apply handler.

Handles the full LinkedIn Easy Apply flow:
1. Log in (or reuse existing session)
2. Navigate to the job posting
3. Click "Easy Apply"
4. Fill multi-step form (contact info, resume upload, screening questions)
5. Answer any AI-generated screening questions
6. Submit and capture confirmation
"""
import asyncio
import logging
import os
from pathlib import Path

from playwright.async_api import async_playwright, Page, Browser, BrowserContext

logger = logging.getLogger(__name__)

SESSION_PATH = Path(__file__).parent.parent / ".sessions" / "linkedin"


async def apply(job: dict, resume_pdf_path: str, cover_letter_text: str, answer_agent) -> dict:
    """
    Apply to a LinkedIn job via Easy Apply.

    Args:
        job: Job dict with at least 'url', 'title', 'company'
        resume_pdf_path: Path to the tailored resume PDF
        cover_letter_text: Cover letter text for text fields
        answer_agent: Callable(question, context) -> str for answering custom questions

    Returns:
        {'success': bool, 'message': str, 'confirmation_id': str or None}
    """
    from credentials import get_credentials

    creds = get_credentials("linkedin")
    if not creds:
        return {
            "success": False,
            "message": "No LinkedIn credentials stored. Run: python credentials.py save linkedin <email> <password>",
            "confirmation_id": None
        }

    SESSION_PATH.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=os.getenv("BROWSER_HEADLESS", "true").lower() == "true",
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"]
        )

        # Reuse saved session if available
        context = await _get_or_create_context(browser, creds)

        try:
            page = await context.new_page()
            await page.set_extra_http_headers({
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            })

            # Navigate to the job
            job_url = job.get("url", "")
            if "linkedin.com" not in job_url:
                return {"success": False, "message": "Not a LinkedIn URL", "confirmation_id": None}

            logger.info(f"Navigating to LinkedIn job: {job_url}")
            await page.goto(job_url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(2)

            # Check if still logged in
            if "login" in page.url or "authwall" in page.url:
                logger.info("Session expired, logging in again...")
                await _login(page, creds)
                await page.goto(job_url, wait_until="domcontentloaded", timeout=30000)
                await asyncio.sleep(2)

            # Click Easy Apply button
            easy_apply_btn = await _find_easy_apply_button(page)
            if not easy_apply_btn:
                return {
                    "success": False,
                    "message": "No Easy Apply button found — this job may require applying on the company site",
                    "confirmation_id": None
                }

            await easy_apply_btn.click()
            await asyncio.sleep(1500 / 1000)

            # Fill the multi-step form
            result = await _fill_application_form(
                page, resume_pdf_path, cover_letter_text, job, answer_agent
            )

            # Save updated session state
            await context.storage_state(path=str(SESSION_PATH / "state.json"))
            return result

        except Exception as e:
            logger.error(f"LinkedIn apply error: {e}")
            return {"success": False, "message": str(e), "confirmation_id": None}
        finally:
            await browser.close()


async def _get_or_create_context(browser: Browser, creds: dict) -> BrowserContext:
    """Return context with saved session state, or fresh context."""
    state_file = SESSION_PATH / "state.json"
    if state_file.exists():
        context = await browser.new_context(storage_state=str(state_file))
        logger.info("Reusing LinkedIn session")
    else:
        context = await browser.new_context()
        logger.info("Starting fresh LinkedIn session")
    return context


async def _login(page: Page, creds: dict):
    """Log into LinkedIn."""
    await page.goto("https://www.linkedin.com/login", wait_until="domcontentloaded")
    await page.fill("#username", creds["username"])
    await page.fill("#password", creds["password"])
    await page.click('[type="submit"]')
    await page.wait_for_load_state("networkidle", timeout=15000)
    await asyncio.sleep(2)

    # Handle 2FA if prompted
    if "checkpoint" in page.url or "challenge" in page.url:
        logger.warning("LinkedIn 2FA / security check required — manual intervention needed")
        # Wait up to 60s for user to complete 2FA
        try:
            await page.wait_for_url("**/feed**", timeout=60000)
        except Exception:
            raise RuntimeError("LinkedIn 2FA required but timed out waiting. Please log in manually first.")


async def _find_easy_apply_button(page: Page):
    """Find the Easy Apply button on the job page."""
    selectors = [
        "button.jobs-apply-button",
        "button[aria-label*='Easy Apply']",
        ".jobs-s-apply button",
        "button:has-text('Easy Apply')",
    ]
    for sel in selectors:
        try:
            btn = await page.wait_for_selector(sel, timeout=5000)
            if btn:
                return btn
        except Exception:
            continue
    return None


async def _fill_application_form(
    page: Page,
    resume_pdf_path: str,
    cover_letter_text: str,
    job: dict,
    answer_agent
) -> dict:
    """Navigate through the Easy Apply multi-step form."""
    max_steps = 10
    step = 0

    while step < max_steps:
        step += 1
        await asyncio.sleep(1)

        # Check if we're on a confirmation/success page
        if await _is_success_page(page):
            confirmation = await _extract_confirmation(page)
            logger.info(f"Application submitted! Confirmation: {confirmation}")
            return {"success": True, "message": "Application submitted successfully", "confirmation_id": confirmation}

        # Handle resume upload step
        if await _has_resume_upload(page):
            await _upload_resume(page, resume_pdf_path)

        # Handle cover letter field
        if await _has_cover_letter_field(page):
            await _fill_cover_letter(page, cover_letter_text)

        # Answer any visible questions
        await _answer_form_questions(page, job, answer_agent)

        # Try to advance to next step
        advanced = await _click_next_or_review(page)
        if not advanced:
            break

    return {"success": False, "message": "Form navigation did not reach submission", "confirmation_id": None}


async def _is_success_page(page: Page) -> bool:
    indicators = [
        "text=Application submitted",
        "text=Your application was sent",
        "[aria-label='Your application has been submitted']",
    ]
    for sel in indicators:
        try:
            el = page.locator(sel)
            if await el.count() > 0:
                return True
        except Exception:
            pass
    return False


async def _extract_confirmation(page: Page) -> str:
    try:
        el = page.locator(".artdeco-inline-feedback__message")
        if await el.count() > 0:
            return await el.first.text_content()
    except Exception:
        pass
    return "submitted"


async def _has_resume_upload(page: Page) -> bool:
    try:
        upload = page.locator("input[type='file']")
        return await upload.count() > 0
    except Exception:
        return False


async def _upload_resume(page: Page, resume_pdf_path: str):
    if not resume_pdf_path or not Path(resume_pdf_path).exists():
        logger.warning(f"Resume PDF not found: {resume_pdf_path}")
        return
    try:
        upload = page.locator("input[type='file']").first
        await upload.set_input_files(resume_pdf_path)
        await asyncio.sleep(2)
        logger.info("Resume uploaded")
    except Exception as e:
        logger.warning(f"Resume upload failed: {e}")


async def _has_cover_letter_field(page: Page) -> bool:
    selectors = [
        "textarea[id*='cover']",
        "textarea[placeholder*='cover letter']",
        "textarea[aria-label*='cover letter']",
    ]
    for sel in selectors:
        try:
            el = page.locator(sel)
            if await el.count() > 0:
                return True
        except Exception:
            pass
    return False


async def _fill_cover_letter(page: Page, cover_letter_text: str):
    selectors = [
        "textarea[id*='cover']",
        "textarea[placeholder*='cover letter']",
    ]
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if await el.count() > 0:
                await el.fill(cover_letter_text[:3000])  # Most fields cap at 3000 chars
                return
        except Exception:
            pass


async def _answer_form_questions(page: Page, job: dict, answer_agent):
    """Find and answer text/select questions on the current step."""
    # Text inputs that look like questions (not name/email/phone)
    skip_fields = {"name", "email", "phone", "address", "city", "zip", "postal"}

    try:
        inputs = await page.locator("input[type='text']:visible, textarea:visible").all()
        for inp in inputs:
            label_text = await _get_field_label(page, inp)
            if not label_text:
                continue
            if any(skip in label_text.lower() for skip in skip_fields):
                continue

            current_val = await inp.input_value()
            if current_val:
                continue  # Already filled

            answer = await answer_agent(label_text, job)
            if answer:
                await inp.fill(str(answer))
    except Exception as e:
        logger.debug(f"Question answering error: {e}")

    # Select dropdowns
    try:
        selects = await page.locator("select:visible").all()
        for sel_el in selects:
            label_text = await _get_field_label(page, sel_el)
            if not label_text:
                continue
            answer = await answer_agent(label_text, job)
            if answer:
                try:
                    await sel_el.select_option(label=answer)
                except Exception:
                    pass
    except Exception as e:
        logger.debug(f"Dropdown answering error: {e}")


async def _get_field_label(page: Page, element) -> str:
    """Try to get the label text for a form field."""
    try:
        field_id = await element.get_attribute("id")
        if field_id:
            label = page.locator(f"label[for='{field_id}']")
            if await label.count() > 0:
                return (await label.first.text_content() or "").strip()
        # Try aria-label
        aria = await element.get_attribute("aria-label")
        if aria:
            return aria.strip()
        # Try placeholder
        placeholder = await element.get_attribute("placeholder")
        if placeholder:
            return placeholder.strip()
    except Exception:
        pass
    return ""


async def _click_next_or_review(page: Page) -> bool:
    """Click Next, Review, or Submit button. Returns True if clicked."""
    button_texts = ["Next", "Review", "Submit application", "Continue"]
    for text in button_texts:
        try:
            btn = page.locator(f"button:has-text('{text}'):visible").last
            if await btn.count() > 0 and await btn.is_enabled():
                await btn.click()
                await asyncio.sleep(1)
                return True
        except Exception:
            pass
    return False
