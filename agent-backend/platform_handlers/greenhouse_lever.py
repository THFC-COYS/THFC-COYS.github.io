"""
Greenhouse and Lever ATS handler.

Both platforms use clean, predictable form structures:
- Greenhouse: boards.greenhouse.io/<company>/jobs/<id>
- Lever: jobs.lever.co/<company>/<job-id>

Handles: resume upload, cover letter, contact info, custom questions.
"""
import asyncio
import logging
from pathlib import Path

from playwright.async_api import Page

logger = logging.getLogger(__name__)


async def apply(job: dict, resume_pdf_path: str, cover_letter_text: str, answer_agent) -> dict:
    """
    Apply to a Greenhouse or Lever job.
    No login required — these are public apply forms.
    """
    from playwright.async_api import async_playwright
    from credentials import get_credentials

    creds = get_credentials("personal_info")
    if not creds:
        return {
            "success": False,
            "message": "No personal_info credentials stored. Run: python credentials.py save personal_info <email> <phone>",
            "confirmation_id": None
        }

    job_url = job.get("url", "")
    platform = "greenhouse" if "greenhouse.io" in job_url else "lever"

    import os
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=os.getenv("BROWSER_HEADLESS", "true").lower() == "true",
            args=["--no-sandbox"]
        )
        context = await browser.new_context()
        page = await context.new_page()

        try:
            logger.info(f"Navigating to {platform} application: {job_url}")
            await page.goto(job_url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(2)

            if platform == "greenhouse":
                result = await _fill_greenhouse(page, job, creds, resume_pdf_path, cover_letter_text, answer_agent)
            else:
                result = await _fill_lever(page, job, creds, resume_pdf_path, cover_letter_text, answer_agent)

            return result

        except Exception as e:
            logger.error(f"{platform} apply error: {e}")
            return {"success": False, "message": str(e), "confirmation_id": None}
        finally:
            await browser.close()


async def _fill_greenhouse(page: Page, job: dict, creds: dict, resume_path: str, cover_letter: str, answer_agent) -> dict:
    """Fill a Greenhouse application form."""
    try:
        # Basic contact fields
        await _safe_fill(page, "#first_name", creds.get("first_name", "Greg"))
        await _safe_fill(page, "#last_name", creds.get("last_name", "Lucas"))
        await _safe_fill(page, "#email", creds.get("email", ""))
        await _safe_fill(page, "#phone", creds.get("phone", ""))

        # Resume upload
        if resume_path and Path(resume_path).exists():
            resume_input = page.locator("input[type='file']").first
            if await resume_input.count() > 0:
                await resume_input.set_input_files(resume_path)
                await asyncio.sleep(2)
                logger.info("Resume uploaded to Greenhouse")

        # Cover letter (text field or upload)
        cover_textarea = page.locator("textarea[id*='cover'], textarea[name*='cover']").first
        if await cover_textarea.count() > 0:
            await cover_textarea.fill(cover_letter[:5000])
        else:
            # Some Greenhouse forms have a cover letter upload
            cover_upload = page.locator("input[type='file'][accept*='.pdf']").nth(1)
            if await cover_upload.count() > 0:
                logger.info("Cover letter upload field found — PDF required")

        # Custom demographic / screening questions
        await _answer_greenhouse_custom_questions(page, job, answer_agent)

        # LinkedIn URL field (common on Greenhouse)
        await _safe_fill(page, "input[id*='linkedin'], input[placeholder*='LinkedIn']", creds.get("linkedin", ""))

        # Website / portfolio
        await _safe_fill(page, "input[id*='website'], input[id*='portfolio']", creds.get("portfolio", ""))

        # Submit
        submit_btn = page.locator("input[type='submit'], button[type='submit']").last
        if await submit_btn.count() > 0:
            await submit_btn.click()
            await asyncio.sleep(3)

            if await _greenhouse_success(page):
                return {"success": True, "message": "Greenhouse application submitted", "confirmation_id": "greenhouse_submitted"}

        return {"success": False, "message": "Could not confirm Greenhouse submission", "confirmation_id": None}

    except Exception as e:
        return {"success": False, "message": f"Greenhouse form error: {e}", "confirmation_id": None}


async def _fill_lever(page: Page, job: dict, creds: dict, resume_path: str, cover_letter: str, answer_agent) -> dict:
    """Fill a Lever application form."""
    try:
        # Lever standard fields
        await _safe_fill(page, "input[name='name']", f"{creds.get('first_name', 'Greg')} {creds.get('last_name', 'Lucas')}")
        await _safe_fill(page, "input[name='email']", creds.get("email", ""))
        await _safe_fill(page, "input[name='phone']", creds.get("phone", ""))
        await _safe_fill(page, "input[name='org']", creds.get("current_company", "Grand Canyon University"))
        await _safe_fill(page, "input[name='urls[LinkedIn]']", creds.get("linkedin", ""))
        await _safe_fill(page, "input[name='urls[Portfolio]']", creds.get("portfolio", ""))

        # Resume upload
        if resume_path and Path(resume_path).exists():
            resume_input = page.locator("input[type='file']").first
            if await resume_input.count() > 0:
                await resume_input.set_input_files(resume_path)
                await asyncio.sleep(2)
                logger.info("Resume uploaded to Lever")

        # Cover letter (Lever uses a textarea for additional info)
        cover_field = page.locator("textarea[name='comments'], textarea[id*='additional']").first
        if await cover_field.count() > 0:
            await cover_field.fill(cover_letter[:5000])

        # Custom questions
        await _answer_lever_custom_questions(page, job, answer_agent)

        # Submit
        submit_btn = page.locator("button[type='submit'], input[type='submit']").last
        if await submit_btn.count() > 0:
            await submit_btn.click()
            await asyncio.sleep(3)

            if await _lever_success(page):
                return {"success": True, "message": "Lever application submitted", "confirmation_id": "lever_submitted"}

        return {"success": False, "message": "Could not confirm Lever submission", "confirmation_id": None}

    except Exception as e:
        return {"success": False, "message": f"Lever form error: {e}", "confirmation_id": None}


async def _answer_greenhouse_custom_questions(page: Page, job: dict, answer_agent):
    """Answer Greenhouse custom question fields."""
    try:
        question_blocks = await page.locator(".field:visible, .custom_field:visible").all()
        for block in question_blocks:
            label_el = block.locator("label").first
            if await label_el.count() == 0:
                continue
            question_text = (await label_el.text_content() or "").strip()
            if not question_text:
                continue

            # Text input
            text_inp = block.locator("input[type='text'], textarea").first
            if await text_inp.count() > 0:
                current = await text_inp.input_value()
                if not current:
                    answer = await answer_agent(question_text, job)
                    if answer:
                        await text_inp.fill(str(answer))
                continue

            # Select
            select_el = block.locator("select").first
            if await select_el.count() > 0:
                answer = await answer_agent(question_text, job)
                if answer:
                    try:
                        await select_el.select_option(label=answer)
                    except Exception:
                        pass
    except Exception as e:
        logger.debug(f"Greenhouse custom questions error: {e}")


async def _answer_lever_custom_questions(page: Page, job: dict, answer_agent):
    """Answer Lever custom question fields."""
    try:
        question_blocks = await page.locator(".application-question:visible").all()
        for block in question_blocks:
            label_el = block.locator("label").first
            if await label_el.count() == 0:
                continue
            question_text = (await label_el.text_content() or "").strip()
            if not question_text:
                continue

            text_inp = block.locator("input[type='text'], textarea").first
            if await text_inp.count() > 0:
                current = await text_inp.input_value()
                if not current:
                    answer = await answer_agent(question_text, job)
                    if answer:
                        await text_inp.fill(str(answer))
    except Exception as e:
        logger.debug(f"Lever custom questions error: {e}")


async def _greenhouse_success(page: Page) -> bool:
    indicators = ["text=Thank you", "text=Application submitted", "text=We've received your application"]
    for sel in indicators:
        try:
            if await page.locator(sel).count() > 0:
                return True
        except Exception:
            pass
    return False


async def _lever_success(page: Page) -> bool:
    indicators = ["text=Thank you", "text=Application received", ".success-page"]
    for sel in indicators:
        try:
            if await page.locator(sel).count() > 0:
                return True
        except Exception:
            pass
    return False


async def _safe_fill(page: Page, selector: str, value: str):
    """Fill a field if it exists and value is non-empty."""
    if not value:
        return
    try:
        el = page.locator(selector).first
        if await el.count() > 0 and await el.is_visible():
            await el.fill(value)
    except Exception:
        pass
