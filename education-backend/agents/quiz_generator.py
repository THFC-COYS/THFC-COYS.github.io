"""
SAGE Quiz Generator Agent — Generates calibrated, engaging quizzes.

Produces multiple-choice, true/false, and short-answer questions
adapted to grade level and Bloom's taxonomy levels.
"""

import anthropic
import json
import os

client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

QUIZ_SYSTEM = """\
You are SAGE's Quiz Generator — an expert educational assessment designer.
You create engaging, fair, and pedagogically sound quizzes calibrated to
the student's grade level and Bloom's taxonomy.

Always return valid JSON matching the exact schema requested.\
"""


async def generate_quiz(
    subject: str,
    topic: str,
    grade_level: str,
    num_questions: int = 5,
    question_types: list[str] | None = None,
) -> list[dict]:
    """
    Generate a quiz and return structured question objects.

    Returns a list of question dicts:
      {
        "id": str,
        "type": "multiple_choice" | "true_false" | "short_answer",
        "question": str,
        "options": list[str] | None,       # only for multiple_choice
        "correct_answer": str,
        "explanation": str,
        "bloom_level": str,
        "points": int,
      }
    """
    if question_types is None:
        question_types = ["multiple_choice", "true_false", "short_answer"]

    types_str = ", ".join(question_types)

    prompt = f"""\
Create a {num_questions}-question quiz for the following:

Subject: {subject}
Topic: {topic}
Grade Level: {grade_level}
Question types to use (mix them): {types_str}

Grade-level guidance:
- K-2: Very simple language, basic recall and recognition
- 3-5: Simple comprehension and basic application
- 6-8: Comprehension, application, and some analysis
- 9-12: Application, analysis, and evaluation
- Higher Education: Analysis, evaluation, and synthesis

Return ONLY a JSON array (no markdown, no code fences) with exactly {num_questions} questions.
Each question must follow this schema:
{{
  "id": "q1",
  "type": "multiple_choice" | "true_false" | "short_answer",
  "question": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],  // only for multiple_choice; null otherwise
  "correct_answer": "...",  // for MC use "A", "B", "C", or "D"; for T/F use "True" or "False"
  "explanation": "Brief explanation of why this is correct",
  "bloom_level": "remember|understand|apply|analyze|evaluate|create",
  "points": 10
}}

Make questions engaging, fair, and educational. Avoid trick questions.\
"""

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        system=QUIZ_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    questions = json.loads(raw)
    return questions


async def grade_short_answers(
    questions: list[dict],
    student_answers: list[str],
    grade_level: str,
) -> list[dict]:
    """
    Use Claude to grade short-answer questions and provide feedback.
    Returns list of {question_id, student_answer, score, feedback, correct_answer}.
    """
    short_answer_pairs = []
    for i, (q, a) in enumerate(zip(questions, student_answers)):
        if q.get("type") == "short_answer":
            short_answer_pairs.append({
                "question_id": q["id"],
                "question": q["question"],
                "correct_answer": q["correct_answer"],
                "student_answer": a,
                "points": q.get("points", 10),
            })

    if not short_answer_pairs:
        return []

    prompt = f"""\
Grade these short-answer responses for a {grade_level} student.
Be encouraging and constructive. Give partial credit where appropriate.

Questions and answers to grade:
{json.dumps(short_answer_pairs, indent=2)}

Return ONLY a JSON array with one object per question:
{{
  "question_id": "...",
  "student_answer": "...",
  "score": <number 0 to points_available>,
  "max_score": <points_available>,
  "feedback": "Encouraging, specific feedback",
  "correct_answer": "..."
}}
\
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


def grade_objective_answers(questions: list[dict], student_answers: list[str]) -> list[dict]:
    """Grade multiple-choice and true/false questions locally (no AI needed)."""
    results = []
    for q, answer in zip(questions, student_answers):
        if q.get("type") in ("multiple_choice", "true_false"):
            correct = q["correct_answer"].strip().upper()
            given = (answer or "").strip().upper()
            is_correct = correct == given
            results.append({
                "question_id": q["id"],
                "student_answer": answer,
                "correct_answer": q["correct_answer"],
                "is_correct": is_correct,
                "score": q.get("points", 10) if is_correct else 0,
                "max_score": q.get("points", 10),
                "explanation": q.get("explanation", ""),
            })
    return results
