"""
Outreach Agent — finds hiring managers and drafts personalized connection messages.

For a given job, this agent:
1. Searches for the hiring manager or relevant contact at the company
2. Drafts a personalized LinkedIn connection note (300 char limit)
3. Drafts a cold email for direct outreach (if email pattern known)
"""
import json
import anthropic

SYSTEM_PROMPT = """You are an expert career outreach strategist. You help senior-level
candidates (Director/VP) make warm first impressions with hiring teams.

Your outreach philosophy:
- Be specific, never generic
- Lead with a genuine connection point or shared interest
- Reference something real about their work/company
- Keep LinkedIn notes under 300 characters (strict limit)
- Cold emails: subject line + 3 short paragraphs (under 200 words total)
- Never be sycophantic or pushy
- Always give them a clear, easy next step"""


async def generate_outreach(job: dict, master_resume: dict) -> dict:
    """
    Research the hiring manager and generate outreach messages.
    Returns dict with contact info and message drafts.
    """
    client = anthropic.AsyncAnthropic()

    # Use web search to find hiring manager info
    search_result = await _find_hiring_contact(client, job)

    # Generate personalized messages
    messages = await _draft_messages(client, job, master_resume, search_result)

    return {
        "job_id": job.get("id"),
        "company": job.get("company"),
        "job_title": job.get("title"),
        "contact_name": search_result.get("name", "Hiring Team"),
        "contact_title": search_result.get("title", ""),
        "contact_profile": search_result.get("linkedin_url", ""),
        "linkedin_note": messages.get("linkedin_note", ""),
        "cold_email_subject": messages.get("email_subject", ""),
        "cold_email_body": messages.get("email_body", ""),
        "search_notes": search_result.get("notes", "")
    }


async def _find_hiring_contact(client: anthropic.AsyncAnthropic, job: dict) -> dict:
    """Search for the hiring manager or relevant contact at the company."""
    async with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=2000,
        system="You are a research assistant. Find hiring contacts at companies for job applications. Return findings as JSON.",
        tools=[{"type": "web_search_20260209", "name": "web_search"}],
        messages=[{
            "role": "user",
            "content": f"""Find the hiring manager or relevant decision-maker for this role:

Company: {job.get('company')}
Role: {job.get('title')}
Job URL: {job.get('url', 'not available')}

Search for:
1. The VP/Director/Head of the department this role would report to
2. Their LinkedIn profile
3. Any relevant HR/talent acquisition contacts

Return JSON:
{{
  "name": "...",
  "title": "...",
  "linkedin_url": "...",
  "department": "...",
  "notes": "any relevant context about them or their work"
}}

If you cannot find a specific person, return the best guess based on company structure."""
        }]
    ) as stream:
        response = await stream.get_final_message()

    import re
    for block in response.content:
        if block.type == "text":
            json_match = re.search(r'\{[\s\S]*\}', block.text)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass

    return {"name": "", "title": "", "linkedin_url": "", "notes": "Contact not found"}


async def _draft_messages(
    client: anthropic.AsyncAnthropic,
    job: dict,
    master_resume: dict,
    contact: dict
) -> dict:
    """Draft personalized outreach messages."""
    contact_name = contact.get("name", "")
    contact_title = contact.get("title", "")

    response = await client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1500,
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": f"""Draft outreach messages for Greg Lucas applying to:

ROLE: {job.get('title')} at {job.get('company')}
CONTACT: {contact_name} ({contact_title})
CONTACT NOTES: {contact.get('notes', '')}

GREG'S KEY CREDENTIALS:
- Faculty Chair & Academic Innovation Leader at GCU (15+ years)
- Led Blackboard → Halo LMS migration at GCU
- Chaired Academic Technology AI subcommittee
- Founded pAIgeBreaker (7-agent AI learning platform, LTI 1.3)
- Founded LMSBreaker / MoltALP (AI-native LMS replacement)
- SNHU COLT Team Lead of the Year 2020
- Saved GCU >$5M through strategic tech pilots

Generate two messages:

1. LINKEDIN NOTE (STRICT: under 300 characters including spaces):
[A specific, warm connection note. Reference their work or company mission.]

2. COLD EMAIL:
Subject: [specific, not generic]
Body: [3 short paragraphs, under 200 words]

Format your response as JSON:
{{
  "linkedin_note": "...",
  "email_subject": "...",
  "email_body": "..."
}}"""
        }]
    )

    import re
    for block in response.content:
        if block.type == "text":
            json_match = re.search(r'\{[\s\S]*\}', block.text)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass

    return {
        "linkedin_note": f"Hi {contact_name}, I saw the {job.get('title')} role at {job.get('company')} and believe my 15+ years leading academic technology at GCU aligns strongly. Would love to connect.",
        "email_subject": f"Re: {job.get('title')} — Academic Tech Leader with LMS & AI Background",
        "email_body": "Please generate this message."
    }
