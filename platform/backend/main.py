"""
Symbio AI-Centric Education Platform — Backend API
Grand Canyon University (GCU)

FastAPI application serving both:
  - Symbio Companion  : Student AI companion backed by a 5-agent APCF swarm
  - Echo Twin         : Faculty digital twin (research radar, draft studio, admin)

Architecture decisions
----------------------
* FastAPI chosen for async-first design, automatic OpenAPI docs, and Pydantic v2
  integration — all critical for a platform that will have concurrent agent calls.
* JWT auth via python-jose; tokens carry role + auditor_level so every route can
  gate content without an extra DB round-trip.
* All agent calls are async; heavy LangGraph orchestration lives in agents/swarm.py.
* Pydantic v2 models are used throughout (model_config replaces class Config).
* pgvector columns in the DB enable semantic search for portfolio matching.
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Optional

import jwt  # PyJWT
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field, field_validator

# ---------------------------------------------------------------------------
# App initialisation
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Symbio AI-Centric Education Platform",
    description=(
        "Backend API for GCU's Symbio Companion (student AI swarm) "
        "and Echo Twin (faculty digital twin)."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ---------------------------------------------------------------------------
# CORS — allow the Vercel-hosted frontend and local dev
# ---------------------------------------------------------------------------

ALLOWED_ORIGINS: list[str] = os.getenv(
    "ALLOWED_ORIGINS",
    "https://symbio.gcu.edu,https://symbio-staging.vercel.app,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

JWT_SECRET: str = os.environ.get("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM: str = "HS256"
JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))  # 24 h

security = HTTPBearer()


def create_access_token(data: dict[str, Any]) -> str:
    """Mint a signed JWT that embeds role, user_id, and auditor_level."""
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    """FastAPI dependency — validates JWT and returns decoded payload."""
    return decode_token(credentials.credentials)


def require_role(*roles: str):
    """Higher-order dependency factory for role-based access control."""

    def _checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return _checker


# ---------------------------------------------------------------------------
# Shared Pydantic models
# ---------------------------------------------------------------------------

APCFDomain = Literal["interaction", "evaluation", "application", "governance", "strategy"]
AuditorLevel = Literal["ai_user", "ai_evaluator", "ai_auditor", "aipo"]
UserRole = Literal["student", "faculty", "admin"]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    auditor_level: Optional[AuditorLevel] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


# ---------------------------------------------------------------------------
# Student — Symbio Companion models
# ---------------------------------------------------------------------------


class SymbioChatRequest(BaseModel):
    """
    A student message routed through the APCF swarm.
    `preferred_domain` is optional — the orchestrator will auto-route if absent.
    """

    model_config = {"json_schema_extra": {"example": {"message": "Help me understand how to evaluate an AI tool for my marketing class.", "preferred_domain": "evaluation", "session_id": "abc-123"}}}

    message: str = Field(min_length=1, max_length=4000)
    preferred_domain: Optional[APCFDomain] = None
    session_id: Optional[str] = None  # client-generated for continuity
    context_files: list[str] = Field(default_factory=list)  # base64 or S3 URLs


class AgentResponse(BaseModel):
    agent_name: str
    domain: APCFDomain
    content: str
    confidence: float = Field(ge=0.0, le=1.0)
    follow_up_questions: list[str] = Field(default_factory=list)


class SymbioChatResponse(BaseModel):
    session_id: str
    primary_response: AgentResponse
    supporting_agents: list[AgentResponse] = Field(default_factory=list)
    auditor_level_hint: Optional[str] = None  # nudge toward next level
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PortfolioEntry(BaseModel):
    id: Optional[str] = None
    domain: APCFDomain
    course: str
    assignment_title: str
    evidence_description: str
    artifact_url: Optional[str] = None
    ai_tools_used: list[str] = Field(default_factory=list)
    reflection: str = Field(min_length=50)
    verified: bool = False
    submitted_at: Optional[datetime] = None


class PortfolioResponse(BaseModel):
    student_id: str
    entries: list[PortfolioEntry]
    domain_coverage: dict[APCFDomain, int]  # count per domain
    auditor_level: AuditorLevel
    completion_pct: float


class AuditorLevelResponse(BaseModel):
    current_level: AuditorLevel
    next_level: Optional[AuditorLevel]
    evidence_completed: dict[APCFDomain, int]
    evidence_required: dict[APCFDomain, int]
    promotion_eligible: bool
    promotion_requirements_summary: str


class ProofOfWorkSubmission(BaseModel):
    """
    A student submits proof-of-work for a specific APCF domain assignment.
    The hash is stored on-chain via the ProofOfWork.sol contract.
    """

    assignment_id: str
    domain: APCFDomain
    course: str
    artifact_url: str
    reflection: str = Field(min_length=100)
    ai_tools_used: list[str]
    content_hash: str  # SHA-256 of the artifact — written to blockchain

    @field_validator("content_hash")
    @classmethod
    def validate_hash(cls, v: str) -> str:
        if len(v) != 64:
            raise ValueError("content_hash must be a 64-character SHA-256 hex string")
        return v.lower()


class ProofOfWorkResponse(BaseModel):
    submission_id: str
    tx_hash: Optional[str] = None  # blockchain transaction hash
    status: Literal["pending", "verified", "rejected"]
    auditor_level_change: Optional[str] = None
    message: str


# ---------------------------------------------------------------------------
# Faculty — Echo Twin models
# ---------------------------------------------------------------------------


class EchoChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    mode: Literal["research", "drafting", "admin", "general"] = "general"
    session_id: Optional[str] = None
    document_context: Optional[str] = None  # pasted doc content for drafting


class EchoChatResponse(BaseModel):
    session_id: str
    response: str
    mode: str
    suggested_actions: list[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ResearchRadarRequest(BaseModel):
    faculty_id: Optional[str] = None  # resolved from JWT if not provided
    keywords: list[str] = Field(min_length=1)
    disciplines: list[str] = Field(default_factory=list)
    time_window_days: int = Field(default=90, ge=7, le=365)


class ResearchOpportunity(BaseModel):
    title: str
    source: str  # journal, grant body, conference
    url: Optional[str] = None
    relevance_score: float = Field(ge=0.0, le=1.0)
    gap_description: str
    suggested_angle: str
    deadline: Optional[datetime] = None


class ResearchRadarResponse(BaseModel):
    faculty_id: str
    query_keywords: list[str]
    opportunities: list[ResearchOpportunity]
    literature_gaps: list[str]
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DraftStudioRequest(BaseModel):
    """
    Faculty requests a draft or outline.
    `doc_type` drives which prompt template is used (see prompts/library.py).
    """

    doc_type: Literal[
        "research_paper",
        "grant_proposal",
        "conference_abstract",
        "literature_review",
        "lesson_plan",
        "syllabus",
        "recommendation_letter",
    ]
    title: str
    topic: str
    target_journal_or_venue: Optional[str] = None
    word_count_target: int = Field(default=1000, ge=100, le=15000)
    key_points: list[str] = Field(default_factory=list)
    existing_draft: Optional[str] = None  # for revision mode


class DraftStudioResponse(BaseModel):
    draft_id: str
    doc_type: str
    title: str
    content: str
    word_count: int
    revision_notes: list[str] = Field(default_factory=list)
    next_steps: list[str] = Field(default_factory=list)


class LessonPlanRequest(BaseModel):
    course_name: str
    topic: str
    learning_objectives: list[str]
    duration_minutes: int = Field(default=75, ge=15, le=180)
    student_level: Literal["freshman", "sophomore", "junior", "senior", "graduate"]
    ai_integration_points: list[str] = Field(default_factory=list)


class LessonPlanResponse(BaseModel):
    plan_id: str
    course_name: str
    topic: str
    duration_minutes: int
    objectives_addressed: list[str]
    lesson_outline: str
    ai_tools_suggested: list[str]
    assessment_strategy: str


# ---------------------------------------------------------------------------
# Admin models
# ---------------------------------------------------------------------------


class AnalyticsResponse(BaseModel):
    total_students: int
    total_faculty: int
    active_sessions_today: int
    portfolio_entries_this_month: int
    proof_of_work_submissions_this_month: int
    top_domains_by_activity: dict[str, int]
    auditor_level_distribution: dict[str, int]


class SkillGrowthRequest(BaseModel):
    cohort: Optional[str] = None  # e.g. "2025-freshman"
    domain: Optional[APCFDomain] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None


class SkillGrowthDataPoint(BaseModel):
    period: str  # "2025-W03"
    domain: APCFDomain
    avg_score: float
    student_count: int


class SkillGrowthResponse(BaseModel):
    cohort: Optional[str]
    domain_filter: Optional[str]
    data_points: list[SkillGrowthDataPoint]


class AuditorDistributionResponse(BaseModel):
    as_of: datetime
    distribution: dict[AuditorLevel, int]
    progression_rate_30d: float  # pct of students who levelled up in 30 days
    avg_days_to_next_level: dict[AuditorLevel, float]


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------


@app.post("/api/auth/login", response_model=TokenResponse, tags=["Auth"])
async def login(body: LoginRequest):
    """
    Authenticate a user and return a JWT.
    In production this checks against the users table; here we illustrate the shape.
    """
    # TODO: replace with actual DB lookup + bcrypt verification
    # Simulated lookup result:
    simulated_user = {
        "user_id": str(uuid.uuid4()),
        "email": body.email,
        "role": "student",
        "auditor_level": "ai_user",
    }
    token = create_access_token(simulated_user)
    return TokenResponse(
        access_token=token,
        role=simulated_user["role"],
        auditor_level=simulated_user["auditor_level"],
    )


@app.post("/api/auth/refresh", response_model=TokenResponse, tags=["Auth"])
async def refresh_token(user: dict = Depends(get_current_user)):
    """Issue a fresh token for an already-authenticated user."""
    token = create_access_token(
        {
            "user_id": user["user_id"],
            "email": user["email"],
            "role": user["role"],
            "auditor_level": user.get("auditor_level"),
        }
    )
    return TokenResponse(
        access_token=token,
        role=user["role"],
        auditor_level=user.get("auditor_level"),
    )


# ---------------------------------------------------------------------------
# Student routes — Symbio Companion
# ---------------------------------------------------------------------------


@app.post("/api/symbio/chat", response_model=SymbioChatResponse, tags=["Symbio Companion"])
async def symbio_chat(
    body: SymbioChatRequest,
    user: dict = Depends(require_role("student", "admin")),
):
    """
    Route a student message through the APCF swarm orchestrator.
    The orchestrator selects the best domain agent(s) and returns a
    structured, level-aware response.
    """
    from agents.swarm import SymbioSwarmOrchestrator  # lazy import avoids circular deps

    orchestrator = SymbioSwarmOrchestrator(
        user_id=user["user_id"],
        auditor_level=user.get("auditor_level", "ai_user"),
    )
    session_id = body.session_id or str(uuid.uuid4())
    result = await orchestrator.run(
        message=body.message,
        preferred_domain=body.preferred_domain,
        session_id=session_id,
    )
    return result


@app.get("/api/symbio/portfolio", response_model=PortfolioResponse, tags=["Symbio Companion"])
async def get_portfolio(user: dict = Depends(require_role("student", "admin"))):
    """Return the student's full APCF portfolio with domain coverage stats."""
    # TODO: query portfolio_entries table for user["user_id"]
    return PortfolioResponse(
        student_id=user["user_id"],
        entries=[],
        domain_coverage={d: 0 for d in ["interaction", "evaluation", "application", "governance", "strategy"]},
        auditor_level=user.get("auditor_level", "ai_user"),
        completion_pct=0.0,
    )


@app.post("/api/symbio/portfolio", response_model=PortfolioEntry, tags=["Symbio Companion"])
async def add_portfolio_entry(
    entry: PortfolioEntry,
    user: dict = Depends(require_role("student")),
):
    """Add a new portfolio entry for a specific APCF domain."""
    entry.id = str(uuid.uuid4())
    entry.submitted_at = datetime.now(timezone.utc)
    # TODO: INSERT into portfolio_entries; trigger vector embedding generation
    return entry


@app.get("/api/symbio/auditor-level", response_model=AuditorLevelResponse, tags=["Symbio Companion"])
async def get_auditor_level(user: dict = Depends(require_role("student", "admin"))):
    """
    Return the student's current AI Auditor Model™ level and what evidence
    is still required to advance.
    """
    level_map: dict[str, str] = {
        "ai_user": "ai_evaluator",
        "ai_evaluator": "ai_auditor",
        "ai_auditor": "aipo",
        "aipo": None,
    }
    current = user.get("auditor_level", "ai_user")
    nxt = level_map.get(current)

    # TODO: replace with real DB query for evidence counts
    return AuditorLevelResponse(
        current_level=current,
        next_level=nxt,
        evidence_completed={d: 0 for d in ["interaction", "evaluation", "application", "governance", "strategy"]},
        evidence_required={d: 3 for d in ["interaction", "evaluation", "application", "governance", "strategy"]},
        promotion_eligible=False,
        promotion_requirements_summary=(
            f"To advance from {current} to {nxt}, complete at least 3 verified "
            "portfolio entries in each APCF domain and pass the domain assessments."
        ),
    )


@app.post("/api/symbio/proof-of-work", response_model=ProofOfWorkResponse, tags=["Symbio Companion"])
async def submit_proof_of_work(
    submission: ProofOfWorkSubmission,
    user: dict = Depends(require_role("student")),
):
    """
    Student submits proof-of-work for an APCF assignment.
    The content_hash is recorded on-chain via the ProofOfWork smart contract.
    Faculty verification triggers auditor-level promotion checks.
    """
    submission_id = str(uuid.uuid4())
    # TODO:
    #   1. INSERT into proof_of_work_submissions
    #   2. Call blockchain adapter → ProofOfWork.sol submitWork(student, hash, domain)
    #   3. Notify assigned faculty for verification
    return ProofOfWorkResponse(
        submission_id=submission_id,
        tx_hash=None,  # populated once blockchain call resolves
        status="pending",
        message="Submission received. Awaiting faculty verification.",
    )


# ---------------------------------------------------------------------------
# Faculty routes — Echo Twin
# ---------------------------------------------------------------------------


@app.post("/api/echo/chat", response_model=EchoChatResponse, tags=["Echo Twin"])
async def echo_chat(
    body: EchoChatRequest,
    user: dict = Depends(require_role("faculty", "admin")),
):
    """General conversational endpoint for the Echo Twin faculty assistant."""
    from agents.echo_agent import EchoTwinAgent  # lazy import

    agent = EchoTwinAgent(faculty_id=user["user_id"])
    session_id = body.session_id or str(uuid.uuid4())
    response_text, actions = await agent.respond(
        message=body.message,
        mode=body.mode,
        document_context=body.document_context,
        session_id=session_id,
    )
    return EchoChatResponse(
        session_id=session_id,
        response=response_text,
        mode=body.mode,
        suggested_actions=actions,
    )


@app.post("/api/echo/research-radar", response_model=ResearchRadarResponse, tags=["Echo Twin"])
async def research_radar(
    body: ResearchRadarRequest,
    user: dict = Depends(require_role("faculty", "admin")),
):
    """
    Scan recent literature, grant databases, and conference calendars for
    research opportunities aligned to the faculty member's profile.
    Uses semantic search over the pgvector-indexed research corpus.
    """
    faculty_id = body.faculty_id or user["user_id"]
    # TODO: invoke ResearchRadarAgent from agents/swarm.py
    return ResearchRadarResponse(
        faculty_id=faculty_id,
        query_keywords=body.keywords,
        opportunities=[],
        literature_gaps=[],
    )


@app.post("/api/echo/draft-studio", response_model=DraftStudioResponse, tags=["Echo Twin"])
async def draft_studio(
    body: DraftStudioRequest,
    user: dict = Depends(require_role("faculty", "admin")),
):
    """
    Generate or refine an academic document draft.
    Supports research papers, grant proposals, conference abstracts,
    literature reviews, lesson plans, syllabi, and recommendation letters.
    """
    from agents.echo_agent import DraftStudioAgent  # lazy import

    agent = DraftStudioAgent(faculty_id=user["user_id"])
    draft_id = str(uuid.uuid4())
    content, revision_notes, next_steps = await agent.generate_draft(
        doc_type=body.doc_type,
        title=body.title,
        topic=body.topic,
        target_venue=body.target_journal_or_venue,
        word_count=body.word_count_target,
        key_points=body.key_points,
        existing_draft=body.existing_draft,
    )
    return DraftStudioResponse(
        draft_id=draft_id,
        doc_type=body.doc_type,
        title=body.title,
        content=content,
        word_count=len(content.split()),
        revision_notes=revision_notes,
        next_steps=next_steps,
    )


@app.post("/api/echo/lesson-plan", response_model=LessonPlanResponse, tags=["Echo Twin"])
async def generate_lesson_plan(
    body: LessonPlanRequest,
    user: dict = Depends(require_role("faculty", "admin")),
):
    """Generate an AI-integrated lesson plan aligned to GCU learning outcomes."""
    plan_id = str(uuid.uuid4())
    # TODO: invoke lesson plan generation via prompts/library.py + LLM call
    return LessonPlanResponse(
        plan_id=plan_id,
        course_name=body.course_name,
        topic=body.topic,
        duration_minutes=body.duration_minutes,
        objectives_addressed=body.learning_objectives,
        lesson_outline="[AI-generated lesson outline — LLM call pending]",
        ai_tools_suggested=["ChatGPT", "Perplexity", "Grammarly"],
        assessment_strategy="[AI-generated assessment — LLM call pending]",
    )


# ---------------------------------------------------------------------------
# Admin routes
# ---------------------------------------------------------------------------


@app.get("/api/admin/analytics", response_model=AnalyticsResponse, tags=["Admin"])
async def platform_analytics(_user: dict = Depends(require_role("admin"))):
    """Platform-wide analytics dashboard data."""
    # TODO: aggregate queries against all tables
    return AnalyticsResponse(
        total_students=0,
        total_faculty=0,
        active_sessions_today=0,
        portfolio_entries_this_month=0,
        proof_of_work_submissions_this_month=0,
        top_domains_by_activity={},
        auditor_level_distribution={},
    )


@app.post("/api/admin/skill-growth", response_model=SkillGrowthResponse, tags=["Admin"])
async def skill_growth(
    body: SkillGrowthRequest,
    _user: dict = Depends(require_role("admin")),
):
    """Time-series skill growth data per APCF domain and cohort."""
    # TODO: query auditor_progression_events + portfolio_entries for trend data
    return SkillGrowthResponse(
        cohort=body.cohort,
        domain_filter=body.domain,
        data_points=[],
    )


@app.get("/api/admin/auditor-distribution", response_model=AuditorDistributionResponse, tags=["Admin"])
async def auditor_distribution(_user: dict = Depends(require_role("admin"))):
    """Distribution of students across AI Auditor Model™ levels."""
    return AuditorDistributionResponse(
        as_of=datetime.now(timezone.utc),
        distribution={"ai_user": 0, "ai_evaluator": 0, "ai_auditor": 0, "aipo": 0},
        progression_rate_30d=0.0,
        avg_days_to_next_level={
            "ai_user": 0.0,
            "ai_evaluator": 0.0,
            "ai_auditor": 0.0,
            "aipo": 0.0,
        },
    )


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/api/health", tags=["System"])
async def health_check():
    """Liveness probe for Railway / Render deployment."""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


# ---------------------------------------------------------------------------
# Entry point (for local development)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
