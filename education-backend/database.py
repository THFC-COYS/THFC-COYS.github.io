"""
SAGE Education Platform — Database Layer
SQLite with aiosqlite for async access.
"""

import aiosqlite
import json
from datetime import datetime
from pathlib import Path
import os

DB_PATH = os.getenv("DATABASE_URL", "sage_edu.db")


CREATE_TABLES = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    grade_level TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    subjects TEXT NOT NULL DEFAULT '[]',
    xp INTEGER NOT NULL DEFAULT 0,
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_active TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT,
    grade_level TEXT NOT NULL,
    messages TEXT NOT NULL DEFAULT '[]',
    agent_type TEXT NOT NULL DEFAULT 'tutor',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    questions TEXT NOT NULL DEFAULT '[]',
    answers TEXT,
    score REAL,
    total_questions INTEGER NOT NULL DEFAULT 0,
    time_taken_seconds INTEGER,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    mastery_level REAL NOT NULL DEFAULT 0.0,
    sessions_count INTEGER NOT NULL DEFAULT 0,
    quizzes_count INTEGER NOT NULL DEFAULT 0,
    avg_quiz_score REAL,
    last_practiced TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS curricula (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    duration_weeks INTEGER NOT NULL,
    objectives TEXT NOT NULL DEFAULT '[]',
    weeks TEXT NOT NULL DEFAULT '[]',
    is_public INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);
"""


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        for stmt in CREATE_TABLES.strip().split(";"):
            stmt = stmt.strip()
            if stmt:
                await db.execute(stmt)
        await db.commit()


# ── Users ──────────────────────────────────────────────────────────────────

async def create_user(user: dict) -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO users (id, name, email, grade_level, role, subjects, xp, streak_days, last_active, created_at)
               VALUES (:id, :name, :email, :grade_level, :role, :subjects, :xp, :streak_days, :last_active, :created_at)""",
            {**user, "subjects": json.dumps(user.get("subjects", [])),
             "xp": 0, "streak_days": 0,
             "last_active": datetime.utcnow().isoformat(),
             "created_at": datetime.utcnow().isoformat()},
        )
        await db.commit()
    return await get_user(user["id"])


async def get_user(user_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM users WHERE id = ?", (user_id,)) as cur:
            row = await cur.fetchone()
            if row:
                d = dict(row)
                d["subjects"] = json.loads(d["subjects"])
                return d
    return None


async def update_user_xp(user_id: str, xp_gain: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE users SET xp = xp + ?, last_active = ? WHERE id = ?",
            (xp_gain, datetime.utcnow().isoformat(), user_id),
        )
        await db.commit()


# ── Sessions ───────────────────────────────────────────────────────────────

async def create_session(session: dict) -> dict:
    now = datetime.utcnow().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO sessions (id, user_id, subject, topic, grade_level, messages, agent_type, created_at, updated_at)
               VALUES (:id, :user_id, :subject, :topic, :grade_level, :messages, :agent_type, :created_at, :updated_at)""",
            {**session, "messages": json.dumps([]), "created_at": now, "updated_at": now},
        )
        await db.commit()
    return await get_session(session["id"])


async def get_session(session_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)) as cur:
            row = await cur.fetchone()
            if row:
                d = dict(row)
                d["messages"] = json.loads(d["messages"])
                return d
    return None


async def append_message(session_id: str, message: dict):
    session = await get_session(session_id)
    if not session:
        return
    messages = session["messages"]
    messages.append(message)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE sessions SET messages = ?, updated_at = ? WHERE id = ?",
            (json.dumps(messages), datetime.utcnow().isoformat(), session_id),
        )
        await db.commit()


async def get_user_sessions(user_id: str) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20",
            (user_id,),
        ) as cur:
            rows = await cur.fetchall()
            result = []
            for row in rows:
                d = dict(row)
                d["messages"] = json.loads(d["messages"])
                result.append(d)
            return result


# ── Quizzes ────────────────────────────────────────────────────────────────

async def save_quiz(quiz: dict) -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO quizzes (id, user_id, subject, topic, grade_level, questions, total_questions, created_at)
               VALUES (:id, :user_id, :subject, :topic, :grade_level, :questions, :total_questions, :created_at)""",
            {**quiz, "questions": json.dumps(quiz.get("questions", [])),
             "total_questions": len(quiz.get("questions", [])),
             "created_at": datetime.utcnow().isoformat()},
        )
        await db.commit()
    return await get_quiz(quiz["id"])


async def get_quiz(quiz_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM quizzes WHERE id = ?", (quiz_id,)) as cur:
            row = await cur.fetchone()
            if row:
                d = dict(row)
                d["questions"] = json.loads(d["questions"])
                if d["answers"]:
                    d["answers"] = json.loads(d["answers"])
                return d
    return None


async def submit_quiz_result(quiz_id: str, answers: list, score: float, time_taken: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """UPDATE quizzes SET answers = ?, score = ?, time_taken_seconds = ?, completed_at = ?
               WHERE id = ?""",
            (json.dumps(answers), score, time_taken, datetime.utcnow().isoformat(), quiz_id),
        )
        await db.commit()


# ── Progress ───────────────────────────────────────────────────────────────

async def upsert_progress(user_id: str, subject: str, topic: str, quiz_score: float | None = None):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM progress WHERE user_id = ? AND subject = ? AND topic = ?",
            (user_id, subject, topic),
        ) as cur:
            row = await cur.fetchone()

        now = datetime.utcnow().isoformat()
        if row:
            existing = dict(row)
            sessions = existing["sessions_count"] + 1
            quizzes = existing["quizzes_count"] + (1 if quiz_score is not None else 0)
            avg = existing.get("avg_quiz_score")
            if quiz_score is not None:
                avg = quiz_score if avg is None else (avg * (quizzes - 1) + quiz_score) / quizzes
            mastery = min(1.0, sessions * 0.05 + (avg or 0) * 0.5)
            await db.execute(
                """UPDATE progress SET sessions_count=?, quizzes_count=?, avg_quiz_score=?,
                   mastery_level=?, last_practiced=? WHERE id=?""",
                (sessions, quizzes, avg, mastery, now, existing["id"]),
            )
        else:
            import uuid
            mastery = 0.05 + (quiz_score or 0) * 0.5 if quiz_score else 0.05
            await db.execute(
                """INSERT INTO progress (id, user_id, subject, topic, mastery_level, sessions_count,
                   quizzes_count, avg_quiz_score, last_practiced)
                   VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)""",
                (str(uuid.uuid4()), user_id, subject, topic, mastery,
                 1 if quiz_score is not None else 0, quiz_score, now),
            )
        await db.commit()


async def get_user_progress(user_id: str) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM progress WHERE user_id = ? ORDER BY last_practiced DESC",
            (user_id,),
        ) as cur:
            return [dict(r) for r in await cur.fetchall()]


# ── Curricula ──────────────────────────────────────────────────────────────

async def save_curriculum(curriculum: dict) -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO curricula (id, creator_id, title, subject, grade_level, duration_weeks,
               objectives, weeks, is_public, created_at)
               VALUES (:id, :creator_id, :title, :subject, :grade_level, :duration_weeks,
               :objectives, :weeks, :is_public, :created_at)""",
            {**curriculum,
             "objectives": json.dumps(curriculum.get("objectives", [])),
             "weeks": json.dumps(curriculum.get("weeks", [])),
             "is_public": 1 if curriculum.get("is_public") else 0,
             "created_at": datetime.utcnow().isoformat()},
        )
        await db.commit()
    return await get_curriculum(curriculum["id"])


async def get_curriculum(curriculum_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM curricula WHERE id = ?", (curriculum_id,)) as cur:
            row = await cur.fetchone()
            if row:
                d = dict(row)
                d["objectives"] = json.loads(d["objectives"])
                d["weeks"] = json.loads(d["weeks"])
                d["is_public"] = bool(d["is_public"])
                return d
    return None


async def list_public_curricula(subject: str | None = None, grade_level: str | None = None) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        query = "SELECT * FROM curricula WHERE is_public = 1"
        params = []
        if subject:
            query += " AND subject = ?"
            params.append(subject)
        if grade_level:
            query += " AND grade_level = ?"
            params.append(grade_level)
        query += " ORDER BY created_at DESC LIMIT 50"
        async with db.execute(query, params) as cur:
            rows = await cur.fetchall()
            result = []
            for row in rows:
                d = dict(row)
                d["objectives"] = json.loads(d["objectives"])
                d["weeks"] = json.loads(d["weeks"])
                d["is_public"] = bool(d["is_public"])
                result.append(d)
            return result
