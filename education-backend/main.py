"""
SAGE — Smart Adaptive Guide for Education
Open-source AI education platform backend.

FastAPI app exposing REST + WebSocket endpoints for the SAGE
iOS app and web application.
"""

import asyncio
import json
import os
import uuid
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

import database as db
from agents.tutor import get_tutor_response, generate_session_starter, stream_tutor_response
from agents.quiz_generator import generate_quiz, grade_objective_answers, grade_short_answers
from agents.curriculum_builder import build_curriculum, suggest_ai_activities
from agents.progress_analyzer import analyze_progress


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init_db()
    yield


app = FastAPI(
    title="SAGE Education API",
    description="Open-source AI education platform — Smart Adaptive Guide for Education",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
        "http://localhost:19006",   # Expo web dev
        "http://localhost:8081",    # Expo Metro
        "exp://localhost:8081",
        "*",  # Open source — allow all origins
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Models ────────────────────────────────────────────────────────

class CreateUserRequest(BaseModel):
    name: str
    email: str
    grade_level: str
    role: str = "student"
    subjects: list[str] = []


class StartSessionRequest(BaseModel):
    user_id: str
    subject: str
    topic: Optional[str] = None
    grade_level: str


class SendMessageRequest(BaseModel):
    content: str
    user_id: str


class GenerateQuizRequest(BaseModel):
    user_id: str
    subject: str
    topic: str
    grade_level: str
    num_questions: int = 5
    question_types: Optional[list[str]] = None


class SubmitQuizRequest(BaseModel):
    user_id: str
    answers: list[str]
    time_taken_seconds: int


class BuildCurriculumRequest(BaseModel):
    creator_id: str
    title: str
    subject: str
    grade_level: str
    duration_weeks: int
    objectives: list[str]
    context: Optional[str] = None
    is_public: bool = False


# ── Health ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "SAGE Education API", "version": "1.0.0"}


# ── Users ──────────────────────────────────────────────────────────────────

@app.post("/api/users", status_code=201)
async def create_user(body: CreateUserRequest):
    user_id = str(uuid.uuid4())
    user = await db.create_user({
        "id": user_id,
        "name": body.name,
        "email": body.email,
        "grade_level": body.grade_level,
        "role": body.role,
        "subjects": body.subjects,
    })
    return user


@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    user = await db.get_user(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user


# ── Tutoring Sessions ──────────────────────────────────────────────────────

@app.post("/api/sessions", status_code=201)
async def start_session(body: StartSessionRequest):
    session_id = str(uuid.uuid4())
    starter = await generate_session_starter(body.subject, body.grade_level, body.topic)

    session = await db.create_session({
        "id": session_id,
        "user_id": body.user_id,
        "subject": body.subject,
        "topic": body.topic,
        "grade_level": body.grade_level,
        "agent_type": "tutor",
    })

    # Save the opening message
    opening_msg = {"role": "assistant", "content": starter}
    await db.append_message(session_id, opening_msg)
    await db.upsert_progress(body.user_id, body.subject, body.topic or body.subject)

    session["messages"] = [opening_msg]
    return session


@app.post("/api/sessions/{session_id}/message")
async def send_message(session_id: str, body: SendMessageRequest):
    session = await db.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    # Persist user message
    user_msg = {"role": "user", "content": body.content}
    await db.append_message(session_id, user_msg)

    # Build updated message list for context
    all_messages = session["messages"] + [user_msg]

    # Get tutor response
    reply = await get_tutor_response(
        messages=all_messages,
        subject=session["subject"],
        grade_level=session["grade_level"],
        topic=session.get("topic"),
    )

    assistant_msg = {"role": "assistant", "content": reply}
    await db.append_message(session_id, assistant_msg)
    await db.update_user_xp(body.user_id, 5)

    return {"message": assistant_msg, "xp_earned": 5}


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    session = await db.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return session


@app.get("/api/users/{user_id}/sessions")
async def list_user_sessions(user_id: str):
    return await db.get_user_sessions(user_id)


# ── WebSocket Streaming Tutor ──────────────────────────────────────────────

@app.websocket("/ws/tutor/{session_id}")
async def tutor_websocket(websocket: WebSocket, session_id: str):
    """
    Real-time streaming tutor via WebSocket.

    Client sends: {"content": "student message", "user_id": "..."}
    Server streams back: {"type": "token", "content": "..."} chunks
    then: {"type": "done", "xp_earned": 5}
    """
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()
            user_content = data.get("content", "")
            user_id = data.get("user_id", "")

            session = await db.get_session(session_id)
            if not session:
                await websocket.send_json({"type": "error", "content": "Session not found"})
                continue

            user_msg = {"role": "user", "content": user_content}
            await db.append_message(session_id, user_msg)

            all_messages = session["messages"] + [user_msg]
            full_response = ""

            async for token in stream_tutor_response(
                messages=all_messages,
                subject=session["subject"],
                grade_level=session["grade_level"],
                topic=session.get("topic"),
            ):
                full_response += token
                await websocket.send_json({"type": "token", "content": token})

            await db.append_message(session_id, {"role": "assistant", "content": full_response})
            if user_id:
                await db.update_user_xp(user_id, 5)

            await websocket.send_json({"type": "done", "xp_earned": 5})

    except WebSocketDisconnect:
        pass


# ── Quizzes ────────────────────────────────────────────────────────────────

@app.post("/api/quizzes", status_code=201)
async def create_quiz(body: GenerateQuizRequest):
    questions = await generate_quiz(
        subject=body.subject,
        topic=body.topic,
        grade_level=body.grade_level,
        num_questions=body.num_questions,
        question_types=body.question_types,
    )

    quiz_id = str(uuid.uuid4())
    quiz = await db.save_quiz({
        "id": quiz_id,
        "user_id": body.user_id,
        "subject": body.subject,
        "topic": body.topic,
        "grade_level": body.grade_level,
        "questions": questions,
    })
    return quiz


@app.get("/api/quizzes/{quiz_id}")
async def get_quiz(quiz_id: str):
    quiz = await db.get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    # Strip correct answers before sending to client
    sanitized = []
    for q in quiz["questions"]:
        sq = {k: v for k, v in q.items() if k not in ("correct_answer", "explanation")}
        sanitized.append(sq)
    quiz["questions"] = sanitized
    return quiz


@app.post("/api/quizzes/{quiz_id}/submit")
async def submit_quiz(quiz_id: str, body: SubmitQuizRequest):
    quiz = await db.get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(404, "Quiz not found")

    questions = quiz["questions"]
    answers = body.answers

    # Grade objective questions locally
    objective_results = grade_objective_answers(questions, answers)

    # Grade short answer questions with AI
    short_answer_results = await grade_short_answers(questions, answers, quiz["grade_level"])

    # Combine results and compute total score
    all_results = {r["question_id"]: r for r in objective_results}
    for r in short_answer_results:
        all_results[r["question_id"]] = r

    total_score = sum(r.get("score", 0) for r in all_results.values())
    total_possible = sum(q.get("points", 10) for q in questions)
    percentage = round((total_score / total_possible * 100) if total_possible > 0 else 0, 1)

    await db.submit_quiz_result(quiz_id, answers, percentage, body.time_taken_seconds)
    await db.upsert_progress(body.user_id, quiz["subject"], quiz["topic"], percentage / 100)
    xp_earned = int(percentage / 10) * 5
    await db.update_user_xp(body.user_id, xp_earned)

    return {
        "quiz_id": quiz_id,
        "score_percentage": percentage,
        "total_score": total_score,
        "total_possible": total_possible,
        "results": list(all_results.values()),
        "xp_earned": xp_earned,
    }


# ── Progress ───────────────────────────────────────────────────────────────

@app.get("/api/users/{user_id}/progress")
async def get_progress(user_id: str):
    user = await db.get_user(user_id)
    if not user:
        raise HTTPException(404, "User not found")

    progress_data = await db.get_user_progress(user_id)
    return {
        "user": user,
        "progress": progress_data,
        "total_subjects": len({p["subject"] for p in progress_data}),
        "avg_mastery": round(
            sum(p["mastery_level"] for p in progress_data) / len(progress_data), 3
        ) if progress_data else 0,
    }


@app.get("/api/users/{user_id}/insights")
async def get_insights(user_id: str):
    user = await db.get_user(user_id)
    if not user:
        raise HTTPException(404, "User not found")

    progress_data = await db.get_user_progress(user_id)
    insights = await analyze_progress(
        user_name=user["name"],
        grade_level=user["grade_level"],
        progress_data=progress_data,
        recent_quiz_scores=[],
    )
    return insights


# ── Curriculum ─────────────────────────────────────────────────────────────

@app.post("/api/curricula", status_code=201)
async def create_curriculum(body: BuildCurriculumRequest):
    plan = await build_curriculum(
        subject=body.subject,
        grade_level=body.grade_level,
        title=body.title,
        duration_weeks=body.duration_weeks,
        objectives=body.objectives,
        context=body.context,
    )

    curriculum_id = str(uuid.uuid4())
    curriculum = await db.save_curriculum({
        "id": curriculum_id,
        "creator_id": body.creator_id,
        "title": body.title,
        "subject": body.subject,
        "grade_level": body.grade_level,
        "duration_weeks": body.duration_weeks,
        "objectives": body.objectives,
        "weeks": plan.get("weeks", []),
        "is_public": body.is_public,
    })

    return {**curriculum, "full_plan": plan}


@app.get("/api/curricula/{curriculum_id}")
async def get_curriculum(curriculum_id: str):
    curriculum = await db.get_curriculum(curriculum_id)
    if not curriculum:
        raise HTTPException(404, "Curriculum not found")
    return curriculum


@app.get("/api/curricula")
async def list_curricula(subject: Optional[str] = None, grade_level: Optional[str] = None):
    return await db.list_public_curricula(subject, grade_level)


@app.get("/api/ai-activities")
async def get_ai_activities(subject: str, grade_level: str, topic: str, learning_goal: str):
    activities = await suggest_ai_activities(subject, grade_level, topic, learning_goal)
    return {"activities": activities}


# ── Entry Point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True,
    )
