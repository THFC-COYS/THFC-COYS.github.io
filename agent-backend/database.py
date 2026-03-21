"""SQLite database layer for job tracking and application status."""
import json
import aiosqlite
from pathlib import Path

DB_PATH = Path(__file__).parent / "career_engine.db"


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                external_id TEXT UNIQUE,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                url TEXT,
                description TEXT,
                salary_range TEXT,
                location TEXT,
                remote BOOLEAN DEFAULT FALSE,
                fit_score REAL DEFAULT 0.0,
                fit_reasoning TEXT,
                source TEXT,
                discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'new'
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER REFERENCES jobs(id),
                tailored_resume TEXT,
                cover_letter TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'draft',
                notes TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS interview_prep (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER REFERENCES jobs(id),
                questions_and_answers TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS outreach (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER REFERENCES jobs(id),
                contact_name TEXT,
                contact_title TEXT,
                contact_profile TEXT,
                message_draft TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'draft'
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER REFERENCES jobs(id),
                platform TEXT NOT NULL,
                success BOOLEAN DEFAULT FALSE,
                confirmation_id TEXT,
                message TEXT,
                ats_score INTEGER,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resume_pdf_path TEXT
            )
        """)
        await db.commit()


async def save_job(job: dict) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("""
            INSERT OR IGNORE INTO jobs
                (external_id, title, company, url, description, salary_range,
                 location, remote, fit_score, fit_reasoning, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job.get("external_id", job.get("url", "")),
            job["title"], job["company"], job.get("url", ""),
            job.get("description", ""), job.get("salary_range", ""),
            job.get("location", ""), job.get("remote", False),
            job.get("fit_score", 0.0), job.get("fit_reasoning", ""),
            job.get("source", "web")
        ))
        await db.commit()
        return cursor.lastrowid


async def get_jobs(status: str = None, limit: int = 20) -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if status:
            cursor = await db.execute(
                "SELECT * FROM jobs WHERE status = ? ORDER BY fit_score DESC, discovered_at DESC LIMIT ?",
                (status, limit)
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM jobs ORDER BY fit_score DESC, discovered_at DESC LIMIT ?",
                (limit,)
            )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def get_job(job_id: int) -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
        row = await cursor.fetchone()
        return dict(row) if row else None


async def update_job_status(job_id: int, status: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("UPDATE jobs SET status = ? WHERE id = ?", (status, job_id))
        await db.commit()


async def save_application(job_id: int, resume: str, cover_letter: str) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("""
            INSERT INTO applications (job_id, tailored_resume, cover_letter)
            VALUES (?, ?, ?)
        """, (job_id, resume, cover_letter))
        await db.commit()
        return cursor.lastrowid


async def save_interview_prep(job_id: int, qa_content: str) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("""
            INSERT INTO interview_prep (job_id, questions_and_answers)
            VALUES (?, ?)
        """, (job_id, qa_content))
        await db.commit()
        return cursor.lastrowid


async def save_outreach(job_id: int, outreach_data: dict) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("""
            INSERT INTO outreach (job_id, contact_name, contact_title, contact_profile, message_draft)
            VALUES (?, ?, ?, ?, ?)
        """, (
            job_id,
            outreach_data.get("contact_name", ""),
            outreach_data.get("contact_title", ""),
            outreach_data.get("contact_profile", ""),
            outreach_data.get("message_draft", "")
        ))
        await db.commit()
        return cursor.lastrowid


async def get_application(job_id: int) -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM applications WHERE job_id = ? ORDER BY created_at DESC LIMIT 1",
            (job_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None


async def save_submission(job_id: int, result: dict, ats_score: int = 0) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("""
            INSERT INTO submissions (job_id, platform, success, confirmation_id, message, ats_score, resume_pdf_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            job_id,
            result.get("platform", "unknown"),
            result.get("success", False),
            result.get("confirmation_id"),
            result.get("message", ""),
            ats_score,
            result.get("resume_pdf_path", "")
        ))
        await db.commit()
        return cursor.lastrowid


async def get_submissions(job_id: int = None) -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if job_id:
            cursor = await db.execute(
                "SELECT * FROM submissions WHERE job_id = ? ORDER BY submitted_at DESC",
                (job_id,)
            )
        else:
            cursor = await db.execute(
                "SELECT s.*, j.title, j.company FROM submissions s JOIN jobs j ON s.job_id = j.id ORDER BY s.submitted_at DESC"
            )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def get_interview_prep(job_id: int) -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM interview_prep WHERE job_id = ? ORDER BY created_at DESC LIMIT 1",
            (job_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
