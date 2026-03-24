"""
SAGE Progress Analyzer Agent — Understands how a student is doing
and generates personalized learning recommendations.
"""

import anthropic
import json
import os

client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


async def analyze_progress(
    user_name: str,
    grade_level: str,
    progress_data: list[dict],
    recent_quiz_scores: list[dict],
) -> dict:
    """
    Analyze student progress and return personalized insights + recommendations.

    Returns:
    {
      "summary": str,
      "strengths": list[str],
      "growth_areas": list[str],
      "recommended_topics": list[{subject, topic, reason}],
      "weekly_goal": str,
      "encouragement": str
    }
    """
    if not progress_data:
        return {
            "summary": f"Welcome to SAGE, {user_name}! Start a tutoring session or take a quiz to see your progress here.",
            "strengths": [],
            "growth_areas": [],
            "recommended_topics": [],
            "weekly_goal": "Complete your first tutoring session!",
            "encouragement": "Every expert was once a beginner. Let's start your learning journey!",
        }

    prompt = f"""\
Analyze this student's learning progress and provide personalized insights.

Student: {user_name}
Grade Level: {grade_level}

Progress by topic (mastery 0.0-1.0):
{json.dumps(progress_data, indent=2)}

Recent quiz scores:
{json.dumps(recent_quiz_scores, indent=2)}

Provide a warm, encouraging analysis. Return ONLY valid JSON:
{{
  "summary": "2-3 sentence overview of their progress",
  "strengths": ["Topic/skill they're doing well in", "..."],
  "growth_areas": ["Area needing more practice", "..."],
  "recommended_topics": [
    {{"subject": "...", "topic": "...", "reason": "why this is recommended"}}
  ],
  "weekly_goal": "One specific, achievable goal for this week",
  "encouragement": "Personalized, specific encouragement message"
}}
\
"""

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())
