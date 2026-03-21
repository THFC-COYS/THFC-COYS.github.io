"""
Workday ATS handler.

Workday is the most complex to automate — it's a heavy SPA with:
- Dynamic routing per company (myworkdayjobs.com/<company>)
- Multi-step wizard (Contact Info → Work Experience → Education → Questions → Review)
- CAPTCHA on some instances
- Session-based auth per company

Strategy:
1. Create a Workday account per company (or reuse if already have one)
2. Step through the wizard, filling each section from the master resume
3. Handle custom questions with the answer agent
4. Upload tailored resume PDF
5. Submit and capture confirmation number
"""
import asyncio
import logging
import os
from pathlib import Path

from playwright.async_api import Page

logger = logging.getLogger(__name__)


async def apply(job: dict, resume_pdf_path: str, cover_letter_text: str, answer_agent) -> dict:
    """
    Apply to a Workday job.
    """
    from playwright.async_api import async_playwright
    from credentials import get_credentials

    job_url = job.get("url", "")
    if "myworkdayjobs.com" not in job_url and "wd" not in job_url:
        return {"success": False, "message": "Not a Workday URL", "confirmation_id": None}

    # Extract company key from URL for per-company credentials
    company_key = _extract_workday_company(job_url)
    creds = get_credentials(f"workday_{company_key}") or get_credentials("workday_default")
    personal = get_credentials("personal_info") or {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=os.getenv("BROWSER_HEADLESS", "true").lower() == "true",
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
            slow_mo=100  # Workday is SPA-heavy; slight delay helps stability
        )
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        )
        page = await context.new_page()

        try:
            logger.info(f"Navigating to Workday job: {job_url}")
            await page.goto(job_url, wait_until="networkidle", timeout=45000)
            await asyncio.sleep(2)

            # Click "Apply" button
            applied = await _click_apply(page)
            if not applied:
                return {"success": False, "message": "Could not find Apply button on Workday page", "confirmation_id": None}

            # Handle login or create account
            if creds:
                await _workday_login(page, creds)
            else:
                await _workday_autofill_guest(page, personal)

            # Step through the wizard
            result = await _navigate_wizard(page, job, personal, resume_pdf_path, cover_letter_text, answer_agent)
            return result

        except Exception as e:
            logger.error(f"Workday apply error: {e}")
            return {"success": False, "message": str(e), "confirmation_id": None}
        finally:
            await browser.close()


def _extract_workday_company(url: str) -> str:
    """Extract company identifier from Workday URL."""
    import re
    match = re.search(r'myworkdayjobs\.com/([^/]+)', url)
    if match:
        return match.group(1).lower()
    return "unknown"


async def _click_apply(page: Page) -> bool:
    """Find and click the main Apply button."""
    selectors = [
        "a[data-automation-id='applyNowButton']",
        "button[data-automation-id='applyNowButton']",
        "a:has-text('Apply Now')",
        "button:has-text('Apply Now')",
        "a:has-text('Apply')",
    ]
    for sel in selectors:
        try:
            btn = page.locator(sel).first
            if await btn.count() > 0 and await btn.is_visible():
                await btn.click()
                await asyncio.sleep(2)
                return True
        except Exception:
            pass
    return False


async def _workday_login(page: Page, creds: dict):
    """Log into Workday with stored credentials."""
    try:
        await _safe_fill(page, "input[type='email'], #username", creds.get("username", ""))
        await _safe_fill(page, "input[type='password'], #password", creds.get("password", ""))
        sign_in = page.locator("button:has-text('Sign In'), button[type='submit']").first
        if await sign_in.count() > 0:
            await sign_in.click()
            await asyncio.sleep(2)
    except Exception as e:
        logger.warning(f"Workday login failed: {e}")


async def _workday_autofill_guest(page: Page, personal: dict):
    """Fill basic contact info for guest application."""
    await asyncio.sleep(1)
    await _safe_fill(page, "[data-automation-id='legalNameSection_firstName']", personal.get("first_name", "Greg"))
    await _safe_fill(page, "[data-automation-id='legalNameSection_lastName']", personal.get("last_name", "Lucas"))
    await _safe_fill(page, "[data-automation-id='email']", personal.get("email", ""))
    await _safe_fill(page, "[data-automation-id='phone-number']", personal.get("phone", ""))


async def _navigate_wizard(
    page: Page,
    job: dict,
    personal: dict,
    resume_path: str,
    cover_letter: str,
    answer_agent
) -> dict:
    """Navigate the Workday multi-step wizard."""
    max_steps = 15
    step = 0

    while step < max_steps:
        step += 1
        await asyncio.sleep(1500 / 1000)

        current_section = await _get_current_section(page)
        logger.info(f"Workday wizard step {step}: {current_section}")

        # Check for success
        if await _is_workday_success(page):
            confirmation = await _get_workday_confirmation(page)
            return {"success": True, "message": "Workday application submitted", "confirmation_id": confirmation}

        # Handle each section type
        if "resume" in current_section.lower() or "document" in current_section.lower():
            await _handle_resume_section(page, resume_path)

        elif "contact" in current_section.lower() or "personal" in current_section.lower():
            await _handle_contact_section(page, personal)

        elif "experience" in current_section.lower() or "work" in current_section.lower():
            await _handle_experience_section(page, personal)

        elif "education" in current_section.lower():
            await _handle_education_section(page, personal)

        elif "question" in current_section.lower() or "additional" in current_section.lower():
            await _handle_questions_section(page, job, cover_letter, answer_agent)

        elif "review" in current_section.lower() or "submit" in current_section.lower():
            await _handle_review_and_submit(page)
            await asyncio.sleep(3)
            if await _is_workday_success(page):
                confirmation = await _get_workday_confirmation(page)
                return {"success": True, "message": "Workday application submitted", "confirmation_id": confirmation}
            break
        else:
            # Generic: answer any visible questions then advance
            await _answer_visible_questions(page, job, answer_agent)

        # Advance to next step
        await _workday_next(page)

    return {"success": False, "message": "Workday wizard did not reach submission", "confirmation_id": None}


async def _get_current_section(page: Page) -> str:
    """Try to determine current wizard section name."""
    selectors = [
        "[data-automation-id='step-header']",
        ".wd-popup-content h2",
        "h2.css-1l3zxp3",
        "[aria-label*='step']",
    ]
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if await el.count() > 0:
                text = await el.text_content()
                if text:
                    return text.strip()
        except Exception:
            pass
    return "unknown"


async def _handle_resume_section(page: Page, resume_path: str):
    """Handle resume/document upload section."""
    if not resume_path or not Path(resume_path).exists():
        logger.warning(f"Resume PDF not found at: {resume_path}")
        return
    try:
        upload = page.locator("input[type='file']").first
        if await upload.count() > 0:
            await upload.set_input_files(resume_path)
            await asyncio.sleep(2)
            logger.info("Resume uploaded to Workday")
    except Exception as e:
        logger.warning(f"Workday resume upload failed: {e}")


async def _handle_contact_section(page: Page, personal: dict):
    """Fill contact information fields."""
    mappings = {
        "[data-automation-id='legalNameSection_firstName'], input[aria-label*='First Name']": personal.get("first_name", "Greg"),
        "[data-automation-id='legalNameSection_lastName'], input[aria-label*='Last Name']": personal.get("last_name", "Lucas"),
        "[data-automation-id='email'], input[type='email']": personal.get("email", ""),
        "input[aria-label*='Phone'], [data-automation-id='phone-number']": personal.get("phone", ""),
        "input[aria-label*='City']": personal.get("city", "San Tan Valley"),
        "input[aria-label*='State']": personal.get("state", "AZ"),
        "input[aria-label*='Zip'], input[aria-label*='Postal']": personal.get("zip", ""),
    }
    for selector, value in mappings.items():
        if value:
            for sel in selector.split(", "):
                try:
                    el = page.locator(sel.strip()).first
                    if await el.count() > 0 and await el.is_visible():
                        current = await el.input_value()
                        if not current:
                            await el.fill(value)
                        break
                except Exception:
                    pass


async def _handle_experience_section(page: Page, personal: dict):
    """Work experience section — Workday often auto-parses from uploaded resume."""
    # If resume was parsed, fields may already be filled
    # Check if there's a "How did you hear about us?" type field
    try:
        source_field = page.locator("select[aria-label*='hear'], select[aria-label*='source']").first
        if await source_field.count() > 0:
            await source_field.select_option(index=1)
    except Exception:
        pass


async def _handle_education_section(page: Page, personal: dict):
    """Education section — often auto-filled from parsed resume."""
    pass  # Workday usually parses this from the uploaded resume


async def _handle_questions_section(page: Page, job: dict, cover_letter: str, answer_agent):
    """Answer additional questions and cover letter."""
    await _answer_visible_questions(page, job, answer_agent)

    # Cover letter text area
    try:
        cover_field = page.locator(
            "textarea[aria-label*='cover'], textarea[aria-label*='Cover'], "
            "[data-automation-id*='coverLetter'] textarea"
        ).first
        if await cover_field.count() > 0:
            current = await cover_field.input_value()
            if not current:
                await cover_field.fill(cover_letter[:5000])
    except Exception:
        pass


async def _handle_review_and_submit(page: Page):
    """Find and click the final Submit button."""
    submit_selectors = [
        "button[data-automation-id='bottom-navigation-next-button']:has-text('Submit')",
        "button:has-text('Submit')",
        "button[aria-label*='Submit']",
    ]
    for sel in submit_selectors:
        try:
            btn = page.locator(sel).last
            if await btn.count() > 0 and await btn.is_enabled():
                await btn.click()
                logger.info("Workday application submitted")
                return
        except Exception:
            pass


async def _answer_visible_questions(page: Page, job: dict, answer_agent):
    """Answer visible text and select questions on any Workday step."""
    try:
        text_inputs = await page.locator("input[type='text']:visible, textarea:visible").all()
        for inp in text_inputs:
            try:
                current = await inp.input_value()
                if current:
                    continue
                label = await _get_workday_label(inp)
                if label:
                    answer = await answer_agent(label, job)
                    if answer:
                        await inp.fill(str(answer))
            except Exception:
                pass
    except Exception:
        pass


async def _get_workday_label(element) -> str:
    """Get label for a Workday form field."""
    try:
        aria_label = await element.get_attribute("aria-label")
        if aria_label:
            return aria_label.strip()
        placeholder = await element.get_attribute("placeholder")
        if placeholder:
            return placeholder.strip()
    except Exception:
        pass
    return ""


async def _workday_next(page: Page):
    """Click the Next button to advance the wizard."""
    selectors = [
        "button[data-automation-id='bottom-navigation-next-button']",
        "button:has-text('Next')",
        "button:has-text('Save and Continue')",
        "button[aria-label='Next']",
    ]
    for sel in selectors:
        try:
            btn = page.locator(sel).last
            if await btn.count() > 0 and await btn.is_enabled():
                await btn.click()
                await asyncio.sleep(1500 / 1000)
                return
        except Exception:
            pass


async def _is_workday_success(page: Page) -> bool:
    indicators = [
        "text=Thank you for applying",
        "text=Application Submitted",
        "text=Your application has been submitted",
        "[data-automation-id='confirmationPage']",
    ]
    for sel in indicators:
        try:
            if await page.locator(sel).count() > 0:
                return True
        except Exception:
            pass
    return False


async def _get_workday_confirmation(page: Page) -> str:
    try:
        el = page.locator("[data-automation-id='confirmationNumber'], text=/\d{6,}/").first
        if await el.count() > 0:
            return (await el.text_content() or "submitted").strip()
    except Exception:
        pass
    return "submitted"


async def _safe_fill(page: Page, selector: str, value: str):
    if not value:
        return
    for sel in selector.split(", "):
        try:
            el = page.locator(sel.strip()).first
            if await el.count() > 0 and await el.is_visible():
                current = await el.input_value()
                if not current:
                    await el.fill(value)
                return
        except Exception:
            pass
