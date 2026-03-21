"""
Interview Prep Agent — generates role-specific Q&A, behavioral stories, and mock scenarios.

For a given job + tailored resume, this agent produces:
1. Top 10 likely interview questions for this specific role/company
2. STAR-method answers using Greg's real experience
3. Questions Greg should ask the interviewer
4. Company research brief
"""
import json
import anthropic

SYSTEM_PROMPT = """You are an executive interview coach specializing in higher education
technology and EdTech leadership roles. You help Director/VP candidates land offers.

Your prep philosophy:
- Every answer should use the STAR method (Situation, Task, Action, Result)
- Results must be quantified whenever possible
- Answers should be 90-120 seconds when spoken (roughly 200-250 words)
- Tailor answers to THIS specific company's pain points and goals
- Behavioral questions should draw on Greg's most impressive achievements
- Technical questions should demonstrate both depth and strategic thinking
- Never make up achievements — only use what's documented in the resume"""


async def generate_interview_prep(job: dict, master_resume: dict, tailored_resume: str = "") -> dict:
    """
    Generate comprehensive interview prep for a specific role.
    Returns structured prep guide with questions, answers, and research.
    """
    client = anthropic.AsyncAnthropic()

    # Run company research and question generation in parallel
    company_research_task = _research_company(client, job)
    questions_task = _generate_questions_and_answers(client, job, master_resume)

    # Await both
    company_brief, qa_content = await _gather(company_research_task, questions_task)

    # Generate questions to ask
    questions_to_ask = await _generate_questions_to_ask(client, job, company_brief)

    return {
        "job_id": job.get("id"),
        "role": job.get("title"),
        "company": job.get("company"),
        "company_research": company_brief,
        "interview_qa": qa_content,
        "questions_to_ask": questions_to_ask,
        "prep_summary": _build_prep_summary(job, qa_content)
    }


async def _gather(*coros):
    """Await multiple coroutines."""
    import asyncio
    return await asyncio.gather(*coros)


async def _research_company(client: anthropic.AsyncAnthropic, job: dict) -> str:
    """Research the company for interview context."""
    async with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=2000,
        system="You are a business research analyst. Provide concise, accurate company intelligence for interview preparation.",
        tools=[{"type": "web_search_20260209", "name": "web_search"}],
        messages=[{
            "role": "user",
            "content": f"""Research {job.get('company')} for an interview for the role of {job.get('title')}.

Provide a concise brief covering:
1. What the company does (2-3 sentences)
2. Recent news, initiatives, or AI/EdTech announcements (last 12 months)
3. Their LMS/learning technology stack if known
4. Key challenges or pain points their technology team likely faces
5. Company culture signals (values, leadership philosophy)
6. Why a candidate would be excited to join them (genuine reasons)

Format as a readable brief, not JSON. Keep it under 400 words."""
        }]
    ) as stream:
        response = await stream.get_final_message()

    for block in response.content:
        if block.type == "text":
            return block.text

    return f"Company research for {job.get('company')} — please research manually."


async def _generate_questions_and_answers(
    client: anthropic.AsyncAnthropic,
    job: dict,
    master_resume: dict
) -> list[dict]:
    """Generate top interview questions with STAR answers."""
    resume_highlights = f"""
Greg Lucas — Key Achievements for Interview Stories:
- Led Blackboard → Halo LMS migration at GCU (100k+ student institution)
- Chaired Academic Technology AI subcommittee, launched NIO initiative
- Saved GCU >$5M annually through strategic tech pilots
- Directed cross-college faculty teams of 30-50 members
- Founded pAIgeBreaker: 7-agent AI platform with LTI 1.3, 70% cost reduction vs legacy models
- Founded LMSBreaker/MoltALP: AI-native LMS replacement with agentic modules
- SNHU COLT Team Lead of the Year 2020
- 15+ years in higher-ed technology leadership
- Deep LTI 1.3 integration experience
- Vendor collaboration (LMS roadmaps, third-party integrations)"""

    response = await client.messages.create(
        model="claude-opus-4-6",
        max_tokens=6000,
        thinking={"type": "adaptive"},
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": f"""Generate the top 10 interview questions for Greg Lucas applying to:

ROLE: {job.get('title')} at {job.get('company')}
JOB DESCRIPTION: {job.get('description', '')}
KEY REQUIREMENTS: {json.dumps(job.get('key_requirements', []))}

{resume_highlights}

For each question, provide:
1. The question (as the interviewer would ask it)
2. Why this question will likely be asked for THIS specific role
3. Greg's STAR answer using his real experience (200-250 words)
4. A power phrase (one memorable sentence that summarizes the answer)

Mix of question types:
- 3 behavioral (Tell me about a time...)
- 2 strategic (How would you approach...)
- 2 technical (LMS/AI/EdTech specific)
- 2 leadership (Team management, stakeholder alignment)
- 1 vision (Where do you see AI in education heading?)

Return as a JSON array:
[{{
  "question": "...",
  "why_asked": "...",
  "star_answer": "...",
  "power_phrase": "..."
}}]"""
        }]
    )

    import re
    for block in response.content:
        if block.type == "text":
            json_match = re.search(r'\[[\s\S]*\]', block.text)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass

    return []


async def _generate_questions_to_ask(
    client: anthropic.AsyncAnthropic,
    job: dict,
    company_brief: str
) -> list[str]:
    """Generate smart questions Greg should ask the interviewer."""
    response = await client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1000,
        messages=[{
            "role": "user",
            "content": f"""Generate 8 smart questions Greg Lucas should ask at the end of his interview for:

ROLE: {job.get('title')} at {job.get('company')}

COMPANY CONTEXT:
{company_brief}

Questions should:
- Demonstrate strategic thinking and domain expertise
- Show genuine curiosity about the role/company
- Help Greg assess if this is the right fit for him
- Cover: team structure, tech stack, success metrics, AI roadmap, challenges

Return as a JSON array of strings (just the questions, no labels):
["...", "...", ...]"""
        }]
    )

    import re
    for block in response.content:
        if block.type == "text":
            json_match = re.search(r'\[[\s\S]*\]', block.text)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass

    return [
        "What does success look like in the first 90 days for this role?",
        "What's the current state of your LMS strategy and where do you want it to go?",
        "How is the organization thinking about AI integration in learning experiences?",
        "What are the biggest technology challenges your academic/learning team faces right now?",
        "How does this role collaborate with faculty, curriculum, and IT teams?",
        "What does your vendor evaluation and management process look like?",
        "How is the team structured, and what's the decision-making process for major tech initiatives?",
        "What would make you say, 'Wow, we made the right hire' 12 months from now?"
    ]


def _build_prep_summary(job: dict, qa: list) -> str:
    """Build a quick prep summary card."""
    return f"""INTERVIEW PREP SUMMARY
======================
Role: {job.get('title')}
Company: {job.get('company')}
Total Questions Prepared: {len(qa)}

TOP 3 STORIES TO LEAD WITH:
1. Blackboard → Halo LMS migration at GCU (scale, complexity, adoption)
2. pAIgeBreaker: 7-agent AI learning platform (innovation, technical depth)
3. >$5M savings through strategic tech pilots (business impact, ROI thinking)

KEY THEMES TO WEAVE THROUGHOUT:
- "I've led this at scale" (30-50 person teams, 100k+ student institutions)
- "I build, I don't just advise" (pAIgeBreaker, LMSBreaker as proof)
- "I bridge technical and institutional" (vendor roadmaps + faculty adoption)
"""
