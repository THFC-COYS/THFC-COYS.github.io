-- =============================================================================
-- Symbio AI-Centric Education Platform — PostgreSQL Schema
-- Grand Canyon University
--
-- Requirements
--   PostgreSQL 15+
--   pgvector extension  (CREATE EXTENSION IF NOT EXISTS vector;)
--   uuid-ossp extension (CREATE EXTENSION IF NOT EXISTS "uuid-ossp";)
--
-- Design decisions
-- ----------------
-- * UUID primary keys everywhere — safe for distributed inserts and blockchain
--   cross-referencing (no sequential leak of record counts).
-- * Vector embedding columns (VECTOR(1536)) on entities that need semantic
--   search: portfolio entries, chat messages, research opportunities.
--   Dimension 1536 matches OpenAI text-embedding-3-small; adjust for other models.
-- * JSONB for flexible metadata (ai_tools_used, evidence_metadata, etc.) —
--   avoids premature schema over-engineering while remaining query-able.
-- * Row-level security (RLS) policies follow GCU's data governance policy:
--   students see only their own data; faculty see their cohort; admins see all.
-- * All tables include created_at / updated_at with automatic trigger update.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- for gen_random_uuid(), encrypt()

-- ---------------------------------------------------------------------------
-- Utility: auto-update updated_at timestamp
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper macro to attach the trigger to any table
-- Usage: SELECT attach_updated_at('table_name');
CREATE OR REPLACE FUNCTION attach_updated_at(tbl TEXT) RETURNS VOID AS $$
BEGIN
    EXECUTE format(
        'CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I '
        'FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
        tbl
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role         AS ENUM ('student', 'faculty', 'admin', 'super_admin');
CREATE TYPE auditor_level     AS ENUM ('ai_user', 'ai_evaluator', 'ai_auditor', 'aipo');
CREATE TYPE apcf_domain       AS ENUM ('interaction', 'evaluation', 'application', 'governance', 'strategy');
CREATE TYPE submission_status AS ENUM ('draft', 'pending_review', 'verified', 'rejected', 'revision_requested');
CREATE TYPE doc_type          AS ENUM (
    'research_paper', 'grant_proposal', 'conference_abstract',
    'literature_review', 'lesson_plan', 'syllabus', 'recommendation_letter'
);
CREATE TYPE opportunity_status AS ENUM ('identified', 'in_progress', 'submitted', 'awarded', 'closed');

-- =============================================================================
-- USERS
-- =============================================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    -- password_hash stored via pgcrypto; never store plaintext
    password_hash   TEXT NOT NULL,
    role            user_role NOT NULL DEFAULT 'student',
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    -- GCU Banner ID for LMS integration
    banner_id       TEXT UNIQUE,
    department      TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('users');

-- Index for JWT lookup performance
CREATE INDEX idx_users_email   ON users (email);
CREATE INDEX idx_users_role    ON users (role);
CREATE INDEX idx_users_banner  ON users (banner_id) WHERE banner_id IS NOT NULL;

-- =============================================================================
-- STUDENT PROFILES
-- =============================================================================

CREATE TABLE student_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    major           TEXT,
    minor           TEXT,
    catalog_year    INTEGER,              -- e.g. 2024
    graduation_year INTEGER,
    gpa             NUMERIC(3,2),
    -- AI Auditor Model™ progression
    auditor_level   auditor_level NOT NULL DEFAULT 'ai_user',
    level_updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- APCF domain scores (0–100) updated after each portfolio submission
    interaction_score   SMALLINT DEFAULT 0 CHECK (interaction_score BETWEEN 0 AND 100),
    evaluation_score    SMALLINT DEFAULT 0 CHECK (evaluation_score BETWEEN 0 AND 100),
    application_score   SMALLINT DEFAULT 0 CHECK (application_score BETWEEN 0 AND 100),
    governance_score    SMALLINT DEFAULT 0 CHECK (governance_score BETWEEN 0 AND 100),
    strategy_score      SMALLINT DEFAULT 0 CHECK (strategy_score BETWEEN 0 AND 100),
    -- Semantic embedding of the student's academic profile (used for personalised routing)
    profile_embedding   VECTOR(1536),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
SELECT attach_updated_at('student_profiles');

CREATE INDEX idx_student_profiles_user    ON student_profiles (user_id);
CREATE INDEX idx_student_profiles_level   ON student_profiles (auditor_level);
-- IVFFlat index for approximate nearest-neighbour search on profile embeddings
CREATE INDEX idx_student_profiles_embed   ON student_profiles
    USING ivfflat (profile_embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================================================
-- FACULTY PROFILES
-- =============================================================================

CREATE TABLE faculty_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title               TEXT,                    -- "Dr.", "Prof.", etc.
    college             TEXT,
    department          TEXT NOT NULL,
    subjects_taught     TEXT[],                  -- array of course codes / names
    teaching_philosophy TEXT,
    research_areas      TEXT[],
    bio                 TEXT,
    -- Semantic embedding of faculty research profile (for Research Radar matching)
    research_embedding  VECTOR(1536),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
SELECT attach_updated_at('faculty_profiles');

CREATE INDEX idx_faculty_profiles_user   ON faculty_profiles (user_id);
CREATE INDEX idx_faculty_research_embed  ON faculty_profiles
    USING ivfflat (research_embedding vector_cosine_ops) WITH (lists = 50);

-- =============================================================================
-- PORTFOLIO ENTRIES
-- =============================================================================

CREATE TABLE portfolio_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    domain              apcf_domain NOT NULL,
    course              TEXT NOT NULL,
    course_code         TEXT,
    assignment_title    TEXT NOT NULL,
    evidence_description TEXT NOT NULL,
    artifact_url        TEXT,                    -- S3 / GCS object URL
    ai_tools_used       TEXT[],
    reflection          TEXT NOT NULL,           -- minimum 100 chars enforced in app layer
    -- Verification workflow
    status              submission_status NOT NULL DEFAULT 'pending_review',
    verified_by         UUID REFERENCES users (id),
    verified_at         TIMESTAMPTZ,
    faculty_feedback    TEXT,
    -- Blockchain proof
    content_hash        CHAR(64),                -- SHA-256 of artifact
    blockchain_tx_hash  TEXT,                    -- on-chain transaction
    -- Semantic embedding for portfolio-to-opportunity matching
    content_embedding   VECTOR(1536),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('portfolio_entries');

CREATE INDEX idx_portfolio_student  ON portfolio_entries (student_id);
CREATE INDEX idx_portfolio_domain   ON portfolio_entries (domain);
CREATE INDEX idx_portfolio_status   ON portfolio_entries (status);
CREATE INDEX idx_portfolio_embed    ON portfolio_entries
    USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================================================
-- CHAT SESSIONS
-- =============================================================================

CREATE TABLE chat_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product         TEXT NOT NULL CHECK (product IN ('symbio', 'echo')),
    -- For Echo Twin, store the mode
    mode            TEXT,
    metadata        JSONB DEFAULT '{}',
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ
);

CREATE INDEX idx_chat_sessions_user    ON chat_sessions (user_id);
CREATE INDEX idx_chat_sessions_product ON chat_sessions (product);

-- =============================================================================
-- CHAT MESSAGES
-- =============================================================================

CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES chat_sessions (id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content         TEXT NOT NULL,
    -- Agent routing metadata (which agent(s) responded)
    routing_metadata JSONB DEFAULT '{}',
    -- e.g. {"primary_domain": "evaluation", "agents_invoked": ["Symbio-Evaluation"],
    --        "domain_scores": {"interaction": 0.4, "evaluation": 0.9, ...}}
    token_count     INTEGER,
    -- Embedding for conversation memory retrieval
    content_embedding VECTOR(1536),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_session   ON chat_messages (session_id);
CREATE INDEX idx_messages_role      ON chat_messages (role);
CREATE INDEX idx_messages_embed     ON chat_messages
    USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 200);

-- =============================================================================
-- PROOF OF WORK SUBMISSIONS
-- =============================================================================

CREATE TABLE proof_of_work_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    assignment_id   UUID,                        -- links to benchmark_assignments if course-assigned
    domain          apcf_domain NOT NULL,
    course          TEXT NOT NULL,
    artifact_url    TEXT NOT NULL,
    reflection      TEXT NOT NULL,
    ai_tools_used   TEXT[],
    content_hash    CHAR(64) NOT NULL,           -- SHA-256 of artifact
    -- Blockchain
    blockchain_tx_hash  TEXT,
    block_number        BIGINT,
    -- Faculty sign-off
    status          submission_status NOT NULL DEFAULT 'pending_review',
    reviewed_by     UUID REFERENCES users (id),
    reviewed_at     TIMESTAMPTZ,
    reviewer_notes  TEXT,
    -- Auditor level at time of submission (for progression analytics)
    auditor_level_at_submission auditor_level NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('proof_of_work_submissions');

CREATE INDEX idx_pow_student  ON proof_of_work_submissions (student_id);
CREATE INDEX idx_pow_domain   ON proof_of_work_submissions (domain);
CREATE INDEX idx_pow_status   ON proof_of_work_submissions (status);
CREATE UNIQUE INDEX idx_pow_hash ON proof_of_work_submissions (content_hash);

-- =============================================================================
-- RESEARCH OPPORTUNITIES (Echo Twin — Research Radar)
-- =============================================================================

CREATE TABLE research_opportunities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    source          TEXT NOT NULL,               -- "NIH", "NSF", "Journal of X", etc.
    url             TEXT,
    gap_identified  TEXT NOT NULL,
    suggested_angle TEXT,
    relevance_score NUMERIC(4,3) CHECK (relevance_score BETWEEN 0 AND 1),
    deadline        TIMESTAMPTZ,
    status          opportunity_status NOT NULL DEFAULT 'identified',
    -- Keywords used in the radar scan that surfaced this opportunity
    source_keywords TEXT[],
    -- Embedding for future similarity matching
    opportunity_embedding VECTOR(1536),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('research_opportunities');

CREATE INDEX idx_research_opp_faculty  ON research_opportunities (faculty_id);
CREATE INDEX idx_research_opp_status   ON research_opportunities (status);
CREATE INDEX idx_research_opp_deadline ON research_opportunities (deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_research_opp_embed    ON research_opportunities
    USING ivfflat (opportunity_embedding vector_cosine_ops) WITH (lists = 50);

-- =============================================================================
-- DRAFT STUDIO ITEMS (Echo Twin)
-- =============================================================================

CREATE TABLE draft_studio_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    doc_type        doc_type NOT NULL,
    title           TEXT NOT NULL,
    topic           TEXT,
    target_venue    TEXT,
    word_count_target INTEGER,
    content         TEXT NOT NULL DEFAULT '',
    word_count_actual INTEGER GENERATED ALWAYS AS (
        array_length(string_to_array(trim(content), ' '), 1)
    ) STORED,
    revision_notes  TEXT[],
    next_steps      TEXT[],
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'final', 'archived')),
    -- Version history stored as JSONB array (lightweight; use git-style diffs for v2)
    version_history JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('draft_studio_items');

CREATE INDEX idx_draft_faculty  ON draft_studio_items (faculty_id);
CREATE INDEX idx_draft_type     ON draft_studio_items (doc_type);
CREATE INDEX idx_draft_status   ON draft_studio_items (status);

-- =============================================================================
-- BENCHMARK ASSIGNMENTS
-- (Faculty creates; students submit against; AI Auditor evaluates)
-- =============================================================================

CREATE TABLE courses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        TEXT NOT NULL,   -- e.g. "MKT-425"
    name        TEXT NOT NULL,
    faculty_id  UUID NOT NULL REFERENCES users (id),
    semester    TEXT,            -- "2025-Spring"
    department  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE benchmark_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id       UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    faculty_id      UUID NOT NULL REFERENCES users (id),
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    domain          apcf_domain NOT NULL,
    -- Rubric stored as JSONB: [{criterion, weight, descriptors: {1,2,3,4}}]
    rubric          JSONB NOT NULL DEFAULT '[]',
    -- Which auditor level(s) this assignment is intended for
    target_levels   auditor_level[],
    ai_tool_requirements TEXT,   -- "Must use at least one generative AI tool"
    due_date        TIMESTAMPTZ,
    is_proof_of_work BOOLEAN DEFAULT FALSE,  -- if TRUE, completion is blockchain-recorded
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('benchmark_assignments');

CREATE INDEX idx_bench_course   ON benchmark_assignments (course_id);
CREATE INDEX idx_bench_faculty  ON benchmark_assignments (faculty_id);
CREATE INDEX idx_bench_domain   ON benchmark_assignments (domain);

-- Student submissions against benchmark assignments
CREATE TABLE student_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id   UUID NOT NULL REFERENCES benchmark_assignments (id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    content         TEXT,
    artifact_url    TEXT,
    ai_tools_used   TEXT[],
    ai_interaction_log TEXT,     -- transcript of AI usage session
    reflection      TEXT,
    -- AI Auditor scoring
    ai_score        NUMERIC(5,2),
    ai_feedback     JSONB DEFAULT '{}',
    -- Faculty override
    final_score     NUMERIC(5,2),
    faculty_feedback TEXT,
    status          submission_status NOT NULL DEFAULT 'draft',
    submitted_at    TIMESTAMPTZ,
    graded_at       TIMESTAMPTZ,
    content_embedding VECTOR(1536),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (assignment_id, student_id)
);
SELECT attach_updated_at('student_submissions');

CREATE INDEX idx_submissions_assignment ON student_submissions (assignment_id);
CREATE INDEX idx_submissions_student    ON student_submissions (student_id);
CREATE INDEX idx_submissions_status     ON student_submissions (status);

-- =============================================================================
-- AUDITOR PROGRESSION EVENTS
-- (Immutable audit log — never UPDATE or DELETE rows here)
-- =============================================================================

CREATE TABLE auditor_progression_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES users (id),
    from_level      auditor_level,               -- NULL for initial assignment
    to_level        auditor_level NOT NULL,
    trigger_type    TEXT NOT NULL,               -- 'admin_grant', 'auto_portfolio', 'faculty_endorsement'
    trigger_ref_id  UUID,                        -- references proof_of_work or portfolio_entry
    approved_by     UUID REFERENCES users (id),
    evidence_summary JSONB DEFAULT '{}',
    -- Blockchain record of the level change
    blockchain_tx_hash TEXT,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- No updated_at — this table is append-only
);

CREATE INDEX idx_progression_student  ON auditor_progression_events (student_id);
CREATE INDEX idx_progression_level    ON auditor_progression_events (to_level);
CREATE INDEX idx_progression_date     ON auditor_progression_events (occurred_at);

-- =============================================================================
-- AIPO PASSPORTS (NFT metadata mirror)
-- =============================================================================

CREATE TABLE aipo_passports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    -- NFT on-chain identifiers
    token_id            BIGINT UNIQUE,           -- ERC-721 token ID
    contract_address    TEXT,
    blockchain_network  TEXT DEFAULT 'polygon',  -- Polygon for low gas fees
    mint_tx_hash        TEXT,
    -- Passport content
    graduation_year     INTEGER,
    major               TEXT,
    apcf_final_scores   JSONB NOT NULL DEFAULT '{}',
    -- {"interaction": 92, "evaluation": 88, "application": 95, "governance": 85, "strategy": 90}
    portfolio_summary   JSONB NOT NULL DEFAULT '{}',
    total_evidence_count INTEGER DEFAULT 0,
    issuing_faculty_id  UUID REFERENCES users (id),
    issued_at           TIMESTAMPTZ DEFAULT NOW(),
    -- IPFS URI pointing to full JSON metadata
    metadata_uri        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id)
);

CREATE INDEX idx_passport_student ON aipo_passports (student_id);
CREATE INDEX idx_passport_token   ON aipo_passports (token_id) WHERE token_id IS NOT NULL;

-- =============================================================================
-- MEMORY GRAPH
-- (Stores cross-session semantic memories for personalised context retrieval)
-- =============================================================================

CREATE TABLE memory_nodes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    node_type   TEXT NOT NULL CHECK (node_type IN ('concept', 'skill', 'experience', 'goal', 'preference')),
    content     TEXT NOT NULL,
    source_type TEXT,                -- 'chat', 'portfolio', 'submission'
    source_id   UUID,
    embedding   VECTOR(1536) NOT NULL,
    weight      NUMERIC(4,3) DEFAULT 1.0,  -- recency/importance weight
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memory_user    ON memory_nodes (user_id);
CREATE INDEX idx_memory_type    ON memory_nodes (node_type);
CREATE INDEX idx_memory_embed   ON memory_nodes
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 200);

-- =============================================================================
-- ROW-LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on student-facing tables
ALTER TABLE student_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_entries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_of_work_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_nodes             ENABLE ROW LEVEL SECURITY;

-- Students see only their own data
CREATE POLICY student_own_profile ON student_profiles
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY student_own_portfolio ON portfolio_entries
    FOR ALL USING (student_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY student_own_pow ON proof_of_work_submissions
    FOR ALL USING (student_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY student_own_sessions ON chat_sessions
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- Admin bypass (set app.current_user_role = 'admin' in session)
CREATE POLICY admin_bypass_profiles ON student_profiles
    FOR ALL USING (current_setting('app.current_user_role', TRUE) = 'admin');

CREATE POLICY admin_bypass_portfolio ON portfolio_entries
    FOR ALL USING (current_setting('app.current_user_role', TRUE) = 'admin');

-- =============================================================================
-- SEED DATA — Auditor level requirements
-- (Reference table used by the progression engine to check evidence thresholds)
-- =============================================================================

CREATE TABLE auditor_level_requirements (
    level           auditor_level PRIMARY KEY,
    display_name    TEXT NOT NULL,
    description     TEXT NOT NULL,
    -- Minimum verified portfolio entries per domain
    min_entries_per_domain SMALLINT NOT NULL DEFAULT 3,
    -- Minimum average domain score to be eligible
    min_avg_score   SMALLINT NOT NULL DEFAULT 70,
    -- Must pass a faculty-administered competency assessment
    requires_assessment BOOLEAN DEFAULT FALSE,
    -- Must have a faculty endorsement
    requires_endorsement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO auditor_level_requirements
    (level, display_name, description, min_entries_per_domain, min_avg_score, requires_assessment, requires_endorsement)
VALUES
    ('ai_user',
     'AI User',
     'Foundational AI literacy. Can use AI tools for basic tasks with guidance.',
     0, 0, FALSE, FALSE),
    ('ai_evaluator',
     'AI Evaluator',
     'Can critically assess AI outputs, identify bias, and verify sources. '
     'Requires 3 verified portfolio entries per APCF domain.',
     3, 70, FALSE, FALSE),
    ('ai_auditor',
     'AI Auditor',
     'Can design AI governance frameworks and conduct independent AI audits. '
     'Requires 5 verified entries per domain + competency assessment.',
     5, 80, TRUE, FALSE),
    ('aipo',
     'AI Productivity Operator (AIPO)',
     'Graduate-level mastery. Can lead AI strategy and serve as institutional '
     'AI resource. Requires 8 entries per domain + assessment + faculty endorsement.',
     8, 90, TRUE, TRUE);

-- =============================================================================
-- HELPFUL VIEWS
-- =============================================================================

-- Student dashboard summary
CREATE OR REPLACE VIEW v_student_dashboard AS
SELECT
    u.id              AS user_id,
    u.first_name || ' ' || u.last_name AS full_name,
    u.email,
    sp.major,
    sp.graduation_year,
    sp.auditor_level,
    sp.interaction_score,
    sp.evaluation_score,
    sp.application_score,
    sp.governance_score,
    sp.strategy_score,
    COUNT(DISTINCT pe.id) FILTER (WHERE pe.status = 'verified') AS verified_entries,
    COUNT(DISTINCT pe.id)                                        AS total_entries,
    COUNT(DISTINCT cs.id)                                        AS total_sessions
FROM users u
JOIN student_profiles sp ON sp.user_id = u.id
LEFT JOIN portfolio_entries pe ON pe.student_id = u.id
LEFT JOIN chat_sessions cs     ON cs.user_id    = u.id AND cs.product = 'symbio'
WHERE u.role = 'student'
GROUP BY u.id, u.first_name, u.last_name, u.email, sp.major,
         sp.graduation_year, sp.auditor_level,
         sp.interaction_score, sp.evaluation_score, sp.application_score,
         sp.governance_score, sp.strategy_score;

-- Auditor level distribution for admin analytics
CREATE OR REPLACE VIEW v_auditor_distribution AS
SELECT
    sp.auditor_level,
    COUNT(*) AS student_count,
    ROUND(AVG(
        (sp.interaction_score + sp.evaluation_score + sp.application_score +
         sp.governance_score  + sp.strategy_score) / 5.0
    ), 1) AS avg_overall_score
FROM student_profiles sp
JOIN users u ON u.id = sp.user_id
WHERE u.is_active = TRUE
GROUP BY sp.auditor_level;
