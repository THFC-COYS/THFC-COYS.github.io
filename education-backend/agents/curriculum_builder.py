"""
SAGE Curriculum Builder Agent — For educators.

Generates week-by-week curriculum plans aligned to learning objectives,
grade level standards, and evidence-based pedagogical practices.
"""

import anthropic
import json
import os

client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

CURRICULUM_SYSTEM = """\
You are SAGE's Curriculum Architect — an expert instructional designer with deep
knowledge of K-12 and higher education standards, evidence-based pedagogy, and
AI-enhanced learning design.

You create practical, engaging, standards-aligned curriculum plans that:
- Follow Understanding by Design (UbD) / backward design principles
- Incorporate diverse learning modalities
- Include formative and summative assessments
- Suggest AI-enhanced activities where appropriate
- Are realistic for real classroom implementation

Always return valid JSON matching the exact schema requested.\
"""


async def build_curriculum(
    subject: str,
    grade_level: str,
    title: str,
    duration_weeks: int,
    objectives: list[str],
    context: str | None = None,
) -> dict:
    """
    Generate a complete curriculum plan.

    Returns:
    {
      "title": str,
      "subject": str,
      "grade_level": str,
      "duration_weeks": int,
      "overview": str,
      "essential_questions": list[str],
      "objectives": list[str],
      "standards_alignment": str,
      "weeks": [
        {
          "week": int,
          "theme": str,
          "learning_goals": list[str],
          "daily_activities": [
            {"day": int, "title": str, "description": str, "activity_type": str, "duration_minutes": int}
          ],
          "assessment": {"type": str, "description": str},
          "ai_enhancement": str,
          "resources": list[str]
        }
      ],
      "final_assessment": {"type": str, "description": str},
      "differentiation_strategies": list[str]
    }
    """
    context_line = f"\nAdditional context: {context}" if context else ""
    objectives_str = "\n".join(f"- {o}" for o in objectives)

    prompt = f"""\
Design a {duration_weeks}-week curriculum plan:

Title: {title}
Subject: {subject}
Grade Level: {grade_level}
Learning Objectives:
{objectives_str}{context_line}

Create a comprehensive, week-by-week curriculum. Include:
- An engaging overview and essential questions
- Weekly themes that build progressively
- 5 daily activities per week (Mon-Fri), each 45-60 minutes
- Weekly formative assessments
- AI-enhanced activity suggestions (using tools like SAGE AI tutor)
- Recommended resources (types, not specific URLs)
- Final summative assessment
- Differentiation strategies for diverse learners

Return ONLY valid JSON (no markdown) matching this schema:
{{
  "title": "...",
  "subject": "...",
  "grade_level": "...",
  "duration_weeks": {duration_weeks},
  "overview": "...",
  "essential_questions": ["..."],
  "objectives": ["..."],
  "standards_alignment": "Brief note on relevant standards (CCSS, NGSS, etc.)",
  "weeks": [
    {{
      "week": 1,
      "theme": "...",
      "learning_goals": ["..."],
      "daily_activities": [
        {{
          "day": 1,
          "title": "...",
          "description": "...",
          "activity_type": "direct_instruction|discussion|lab|project|review|assessment",
          "duration_minutes": 50
        }}
      ],
      "assessment": {{"type": "exit_ticket|quiz|discussion|project", "description": "..."}},
      "ai_enhancement": "How SAGE AI can support this week's learning",
      "resources": ["Resource type 1", "Resource type 2"]
    }}
  ],
  "final_assessment": {{"type": "...", "description": "..."}},
  "differentiation_strategies": ["..."]
}}
\
"""

    response = await client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4096,
        system=CURRICULUM_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


async def suggest_ai_activities(
    subject: str,
    grade_level: str,
    topic: str,
    learning_goal: str,
) -> list[dict]:
    """Suggest specific SAGE AI-enhanced learning activities for a topic."""
    prompt = f"""\
Suggest 5 creative, practical AI-enhanced learning activities for:

Subject: {subject}
Grade Level: {grade_level}
Topic: {topic}
Learning Goal: {learning_goal}

These activities use SAGE's AI agents: tutor chat, quiz generator, and progress tracking.

Return ONLY a JSON array:
[
  {{
    "title": "...",
    "description": "...",
    "ai_agent_used": "tutor|quiz|both",
    "duration_minutes": 20,
    "student_outcome": "...",
    "instructions": ["Step 1", "Step 2", "..."]
  }}
]\
"""

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())
