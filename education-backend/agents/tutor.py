"""
SAGE Tutor Agent — Adaptive AI tutor powered by Claude.

Adjusts explanation depth, tone, and complexity based on the
student's grade level and conversation history. Guides students
to discover answers rather than just handing them over.
"""

import anthropic
import json
import os
from typing import AsyncIterator

client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

GRADE_PROFILES = {
    "K-2":  {"tone": "very simple and encouraging, like a warm kindergarten teacher",
              "vocab": "very basic vocabulary, short sentences, lots of positive reinforcement",
              "depth": "introduce concepts with stories and simple examples"},
    "3-5":  {"tone": "friendly and encouraging, like a great elementary school teacher",
              "vocab": "grade-appropriate vocabulary, clear explanations",
              "depth": "use relatable real-world examples and analogies"},
    "6-8":  {"tone": "engaging and relatable, like a cool middle school teacher",
              "vocab": "standard vocabulary, can introduce subject-specific terms",
              "depth": "connect concepts to everyday life and pop culture"},
    "9-12": {"tone": "knowledgeable and encouraging, like a great high school teacher",
              "vocab": "academic vocabulary, proper subject terminology",
              "depth": "explore nuance, encourage critical thinking and analysis"},
    "Higher Education": {
              "tone": "collegial and intellectually stimulating, like a university professor",
              "vocab": "full academic and domain-specific vocabulary",
              "depth": "engage with theory, research, and advanced problem-solving"},
}

SYSTEM_TEMPLATE = """\
You are SAGE — a brilliant, adaptive AI tutor built for the open-source education platform SAGE (Smart Adaptive Guide for Education).

Your student is in grade level: {grade_level}
Subject: {subject}{topic_line}

Tutor persona for this grade level:
- Tone: {tone}
- Vocabulary: {vocab}
- Explanation depth: {depth}

Core tutoring principles:
1. GUIDE, don't just give answers. Ask Socratic questions to help students discover concepts.
2. CELEBRATE effort and progress, not just correct answers.
3. BREAK DOWN complex problems into manageable steps.
4. USE vivid, relevant analogies and examples appropriate for the grade level.
5. CHECK FOR UNDERSTANDING by asking follow-up questions.
6. NEVER make a student feel stupid — always reframe mistakes as learning opportunities.
7. ADAPT your explanation if the student seems confused — try a different approach.
8. Keep responses focused and appropriately sized for the grade level.

If the student asks something off-topic or inappropriate, gently redirect them back to learning.
You are open-source and powered by Claude — be proud of that and mention it if asked.\
"""


async def stream_tutor_response(
    messages: list[dict],
    subject: str,
    grade_level: str,
    topic: str | None = None,
) -> AsyncIterator[str]:
    """Stream a tutor response token by token."""
    profile = GRADE_PROFILES.get(grade_level, GRADE_PROFILES["9-12"])
    topic_line = f"\nTopic: {topic}" if topic else ""

    system = SYSTEM_TEMPLATE.format(
        grade_level=grade_level,
        subject=subject,
        topic_line=topic_line,
        tone=profile["tone"],
        vocab=profile["vocab"],
        depth=profile["depth"],
    )

    # Convert session messages to Anthropic format
    anthropic_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in messages
        if m["role"] in ("user", "assistant")
    ]

    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system,
        messages=anthropic_messages,
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def get_tutor_response(
    messages: list[dict],
    subject: str,
    grade_level: str,
    topic: str | None = None,
) -> str:
    """Get a complete (non-streaming) tutor response."""
    profile = GRADE_PROFILES.get(grade_level, GRADE_PROFILES["9-12"])
    topic_line = f"\nTopic: {topic}" if topic else ""

    system = SYSTEM_TEMPLATE.format(
        grade_level=grade_level,
        subject=subject,
        topic_line=topic_line,
        tone=profile["tone"],
        vocab=profile["vocab"],
        depth=profile["depth"],
    )

    anthropic_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in messages
        if m["role"] in ("user", "assistant")
    ]

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system,
        messages=anthropic_messages,
    )
    return response.content[0].text


async def generate_session_starter(
    subject: str,
    grade_level: str,
    topic: str | None = None,
) -> str:
    """Generate an engaging opening message to kick off a tutoring session."""
    profile = GRADE_PROFILES.get(grade_level, GRADE_PROFILES["9-12"])
    topic_line = f" on the topic of {topic}" if topic else ""

    prompt = f"""\
You are SAGE, an AI tutor. Generate a warm, engaging opening message for a new tutoring session.

Subject: {subject}{topic_line}
Grade level: {grade_level}
Tone: {profile["tone"]}

The opening should:
1. Welcome the student warmly
2. Briefly introduce what you'll explore together
3. Ask an engaging opening question to get the conversation started
4. Be appropriately concise for the grade level

Do not use generic phrases like "Hello! How can I help you today?"
Make it subject-specific and exciting.\
"""

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text
