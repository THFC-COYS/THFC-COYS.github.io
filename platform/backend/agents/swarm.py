"""
Symbio APCF Multi-Agent Swarm — LangGraph-style Orchestration
Grand Canyon University — Symbio AI-Centric Education Platform

Architecture overview
---------------------
The swarm follows the "supervisor + specialist" pattern popularised by LangGraph:

  SymbioSwarmOrchestrator
    ├── InteractionAgent   (APCF: Interaction domain)
    ├── EvaluationAgent    (APCF: Evaluation domain)
    ├── ApplicationAgent   (APCF: Application domain)
    ├── GovernanceAgent    (APCF: Governance domain)
    └── StrategyAgent      (APCF: Strategy domain)

Each domain agent:
  1. Receives the student's message + conversation history.
  2. Applies a domain-specific system prompt (from prompts/library.py).
  3. Has access to a curated set of tools (described below).
  4. Returns a structured AgentOutput with confidence + follow-ups.

The orchestrator:
  1. Embeds the student's message with a lightweight router LLM call.
  2. Scores relevance against each domain.
  3. Calls the primary agent (highest score) and optionally 1–2 supporting agents.
  4. Merges outputs and returns the SymbioChatResponse.

Why this pattern?
-----------------
* Modular — each domain can evolve its prompts/tools independently.
* Level-aware — auditor_level is threaded through every prompt, so a
  freshman (AI User) gets guided scaffolding while a senior (AIPO)
  gets peer-level challenge.
* Observable — every node logs its state to the state graph for replay
  and audit (required by GCU's AI governance policy).
"""

from __future__ import annotations

import asyncio
import json
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Literal, Optional

# ---------------------------------------------------------------------------
# Domain + level type aliases (mirrors main.py — kept local to avoid circular)
# ---------------------------------------------------------------------------

APCFDomain = Literal["interaction", "evaluation", "application", "governance", "strategy"]
AuditorLevel = Literal["ai_user", "ai_evaluator", "ai_auditor", "aipo"]

# ---------------------------------------------------------------------------
# Tool registry
# Each tool is an async callable; real implementations call external APIs,
# DB queries, or vector search — stubs shown for clarity.
# ---------------------------------------------------------------------------


async def tool_search_gcu_library(query: str) -> dict:
    """Semantic search over GCU's licensed academic databases."""
    # Production: POST to pgvector similarity search endpoint
    return {"results": [], "query": query, "source": "gcu_library"}


async def tool_evaluate_ai_output(content: str, rubric: str) -> dict:
    """Apply a faculty-designed rubric to an AI-generated artefact."""
    return {"score": 0.0, "feedback": [], "rubric": rubric}


async def tool_check_governance_policy(topic: str) -> dict:
    """Look up GCU + institutional AI use policies relevant to a topic."""
    return {"policies": [], "topic": topic, "last_updated": "2025-01-01"}


async def tool_retrieve_portfolio(user_id: str, domain: str) -> dict:
    """Fetch existing portfolio entries for a domain to provide continuity."""
    # Production: SELECT from portfolio_entries WHERE user_id=... AND domain=...
    return {"entries": [], "user_id": user_id, "domain": domain}


async def tool_generate_practice_prompt(domain: str, level: str) -> dict:
    """Generate a practice scenario appropriate to the student's auditor level."""
    return {"scenario": "[practice scenario]", "domain": domain, "level": level}


async def tool_cite_sources(claim: str) -> dict:
    """Return APA citations for a factual claim using GCU's research databases."""
    return {"citations": [], "claim": claim}


async def tool_analyse_ai_tool(tool_name: str) -> dict:
    """Return capability summary, limitations, and ethical flags for an AI tool."""
    return {"tool": tool_name, "capabilities": [], "limitations": [], "ethical_flags": []}


async def tool_build_strategic_roadmap(goal: str, timeline: str) -> dict:
    """Scaffold a multi-step AI integration roadmap for a personal or professional goal."""
    return {"roadmap": [], "goal": goal, "timeline": timeline}


# ---------------------------------------------------------------------------
# State graph node — shared data structure threaded through the swarm
# ---------------------------------------------------------------------------


@dataclass
class SwarmState:
    """
    Immutable-ish state bag that flows through the agent graph.
    Each agent appends to `agent_outputs`; orchestrator reads them all.
    """

    session_id: str
    user_id: str
    auditor_level: AuditorLevel
    message: str
    preferred_domain: Optional[APCFDomain]
    conversation_history: list[dict[str, str]] = field(default_factory=list)
    domain_scores: dict[str, float] = field(default_factory=dict)
    agent_outputs: list[dict[str, Any]] = field(default_factory=list)
    primary_domain: Optional[APCFDomain] = None
    final_response: Optional[dict] = None
    metadata: dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Base agent class
# ---------------------------------------------------------------------------


class BaseAPCFAgent:
    """
    Abstract base for all five APCF domain agents.
    Concrete agents override `domain`, `system_prompt_fn`, and `tools`.
    """

    domain: APCFDomain = NotImplemented
    agent_name: str = NotImplemented

    def __init__(self):
        from prompts.library import PromptLibrary  # lazy — avoids circular at module load

        self.prompt_library = PromptLibrary()
        self.tools: dict[str, Callable] = {}  # populated by subclass

    def get_system_prompt(self, auditor_level: AuditorLevel) -> str:
        """Retrieve the level-aware system prompt for this domain."""
        return self.prompt_library.get_domain_agent_prompt(
            domain=self.domain, level=auditor_level
        )

    async def call_llm(
        self,
        system_prompt: str,
        user_message: str,
        history: list[dict],
        tools: Optional[list] = None,
    ) -> tuple[str, float]:
        """
        In production this calls the configured LLM provider (OpenAI, Anthropic, etc.)
        with tool-use enabled. Returns (response_text, confidence_score).

        Pattern:
          messages = [{"role": "system", "content": system_prompt}]
                   + history[-10:]   # rolling 10-turn window
                   + [{"role": "user", "content": user_message}]
          response = await openai.chat.completions.create(
              model="gpt-4o",
              messages=messages,
              tools=tools or [],
              tool_choice="auto",
          )

        Stub returns placeholder text for architecture illustration.
        """
        # TODO: replace stub with real LLM call
        placeholder = (
            f"[{self.agent_name} | level={system_prompt[:20]}...] "
            f"Responding to: {user_message[:80]}"
        )
        confidence = 0.85
        return placeholder, confidence

    async def generate_follow_ups(
        self, response: str, auditor_level: AuditorLevel
    ) -> list[str]:
        """
        Produce 2–3 Socratic follow-up questions calibrated to the student's level.
        Higher levels get deeper, more critical questions.
        """
        level_depth = {
            "ai_user": "basic comprehension",
            "ai_evaluator": "comparative analysis",
            "ai_auditor": "critical evaluation and ethical implications",
            "aipo": "strategic synthesis and original contribution",
        }
        depth = level_depth.get(auditor_level, "basic comprehension")
        # TODO: replace with LLM call asking for follow-ups at `depth`
        return [
            f"How does this connect to your current coursework? ({depth})",
            f"What would you do differently knowing this?",
        ]

    async def run(self, state: SwarmState) -> dict[str, Any]:
        """
        Execute this agent node.
        Returns a structured output dict that is appended to state.agent_outputs.
        """
        system_prompt = self.get_system_prompt(state.auditor_level)
        response_text, confidence = await self.call_llm(
            system_prompt=system_prompt,
            user_message=state.message,
            history=state.conversation_history,
        )
        follow_ups = await self.generate_follow_ups(response_text, state.auditor_level)

        return {
            "agent_name": self.agent_name,
            "domain": self.domain,
            "content": response_text,
            "confidence": confidence,
            "follow_up_questions": follow_ups,
        }


# ---------------------------------------------------------------------------
# APCF Domain Agents
# ---------------------------------------------------------------------------


class InteractionAgent(BaseAPCFAgent):
    """
    APCF Domain: INTERACTION
    Focuses on how students communicate with, prompt, and direct AI systems.
    Key competencies: prompt engineering, iterative refinement, multimodal input,
    conversational strategy, output elicitation.
    """

    domain: APCFDomain = "interaction"
    agent_name: str = "Symbio-Interaction"

    def __init__(self):
        super().__init__()
        self.tools = {
            "search_library": tool_search_gcu_library,
            "generate_practice": tool_generate_practice_prompt,
        }

    async def run(self, state: SwarmState) -> dict[str, Any]:
        base = await super().run(state)
        # Interaction domain adds a "prompt quality score" rubric check
        # TODO: call tool_evaluate_ai_output with interaction rubric
        base["domain_extras"] = {
            "prompt_score": None,
            "refinement_suggestions": [],
        }
        return base


class EvaluationAgent(BaseAPCFAgent):
    """
    APCF Domain: EVALUATION
    Focuses on critically assessing AI outputs for accuracy, bias, and fitness.
    Key competencies: rubric-based assessment, hallucination detection, source
    verification, bias identification, comparative tool analysis.
    """

    domain: APCFDomain = "evaluation"
    agent_name: str = "Symbio-Evaluation"

    def __init__(self):
        super().__init__()
        self.tools = {
            "evaluate_output": tool_evaluate_ai_output,
            "cite_sources": tool_cite_sources,
            "analyse_tool": tool_analyse_ai_tool,
        }

    async def run(self, state: SwarmState) -> dict[str, Any]:
        base = await super().run(state)
        base["domain_extras"] = {
            "evaluation_rubric_used": "GCU AI Output Quality Standard v1.2",
            "bias_flags": [],
            "source_verification_status": "pending",
        }
        return base


class ApplicationAgent(BaseAPCFAgent):
    """
    APCF Domain: APPLICATION
    Focuses on applying AI tools to real disciplinary tasks and workflows.
    Key competencies: tool selection, workflow integration, domain-specific use cases,
    productivity measurement, iterative refinement in context.
    """

    domain: APCFDomain = "application"
    agent_name: str = "Symbio-Application"

    def __init__(self):
        super().__init__()
        self.tools = {
            "search_library": tool_search_gcu_library,
            "analyse_tool": tool_analyse_ai_tool,
            "retrieve_portfolio": tool_retrieve_portfolio,
        }

    async def run(self, state: SwarmState) -> dict[str, Any]:
        base = await super().run(state)
        # Retrieve existing portfolio to avoid repetition and build on prior work
        prior = await tool_retrieve_portfolio(
            state.user_id, self.domain
        )
        base["domain_extras"] = {
            "prior_portfolio_entries": len(prior.get("entries", [])),
            "recommended_tools": [],
            "workflow_template": None,
        }
        return base


class GovernanceAgent(BaseAPCFAgent):
    """
    APCF Domain: GOVERNANCE
    Focuses on ethical, legal, and institutional frameworks for AI use.
    Key competencies: policy comprehension, ethical reasoning, academic integrity,
    data privacy, responsible disclosure, institutional compliance.
    """

    domain: APCFDomain = "governance"
    agent_name: str = "Symbio-Governance"

    def __init__(self):
        super().__init__()
        self.tools = {
            "check_policy": tool_check_governance_policy,
            "cite_sources": tool_cite_sources,
        }

    async def run(self, state: SwarmState) -> dict[str, Any]:
        base = await super().run(state)
        # Always check relevant governance policies
        policy_check = await tool_check_governance_policy(state.message[:200])
        base["domain_extras"] = {
            "applicable_policies": policy_check.get("policies", []),
            "ethical_flags": [],
            "integrity_note": None,
        }
        return base


class StrategyAgent(BaseAPCFAgent):
    """
    APCF Domain: STRATEGY
    Focuses on long-horizon AI planning, career positioning, and organisational impact.
    Key competencies: AI trend analysis, personal/professional roadmapping,
    organisational strategy, competitive positioning, future-of-work literacy.
    """

    domain: APCFDomain = "strategy"
    agent_name: str = "Symbio-Strategy"

    def __init__(self):
        super().__init__()
        self.tools = {
            "build_roadmap": tool_build_strategic_roadmap,
            "search_library": tool_search_gcu_library,
            "retrieve_portfolio": tool_retrieve_portfolio,
        }

    async def run(self, state: SwarmState) -> dict[str, Any]:
        base = await super().run(state)
        base["domain_extras"] = {
            "career_alignment_score": None,
            "industry_trends": [],
            "roadmap_next_steps": [],
        }
        return base


# ---------------------------------------------------------------------------
# Domain router — lightweight LLM call to score relevance
# ---------------------------------------------------------------------------


async def route_to_domains(
    message: str, preferred_domain: Optional[APCFDomain]
) -> dict[str, float]:
    """
    Score the student's message against the five APCF domains.
    Returns a dict like {"interaction": 0.9, "evaluation": 0.4, ...}.

    In production this is a lightweight embedding-based classifier or a
    dedicated "router" LLM call with a structured output schema.

    The preferred_domain (if set) receives a +0.3 bonus to honour explicit
    student intent without completely overriding natural routing.
    """
    # TODO: replace with embedding cosine-similarity or router LLM call
    domain_keywords: dict[str, list[str]] = {
        "interaction": ["prompt", "ask", "write", "generate", "tell", "chat", "instruct"],
        "evaluation": ["evaluate", "check", "assess", "bias", "accurate", "review", "critique"],
        "application": ["use", "apply", "workflow", "tool", "task", "project", "class", "assignment"],
        "governance": ["ethics", "policy", "allowed", "legal", "privacy", "integrity", "rule"],
        "strategy": ["career", "future", "plan", "roadmap", "industry", "goal", "long-term"],
    }
    lower_msg = message.lower()
    scores: dict[str, float] = {}
    for domain, keywords in domain_keywords.items():
        hit_count = sum(1 for kw in keywords if kw in lower_msg)
        scores[domain] = min(0.3 + hit_count * 0.15, 1.0)

    if preferred_domain:
        scores[preferred_domain] = min(scores.get(preferred_domain, 0.3) + 0.3, 1.0)

    return scores


# ---------------------------------------------------------------------------
# Swarm Orchestrator
# ---------------------------------------------------------------------------


class SymbioSwarmOrchestrator:
    """
    Central coordinator for the Symbio 5-agent APCF swarm.

    Execution graph (linear for MVP; parallel fan-out planned for v2):

      message
        │
        ▼
      route_to_domains()          ← lightweight domain classifier
        │
        ▼
      primary_agent.run()         ← highest-scoring domain
        │
        ├──(score > 0.6)──►  supporting_agent_1.run()   (concurrent)
        └──(score > 0.6)──►  supporting_agent_2.run()   (concurrent)
              │
              ▼
      merge_outputs()             ← synthesise + level-up nudges
              │
              ▼
      SymbioChatResponse
    """

    AGENT_REGISTRY: dict[APCFDomain, type[BaseAPCFAgent]] = {
        "interaction": InteractionAgent,
        "evaluation": EvaluationAgent,
        "application": ApplicationAgent,
        "governance": GovernanceAgent,
        "strategy": StrategyAgent,
    }

    # Threshold above which a secondary domain agent is also invoked
    SUPPORTING_AGENT_THRESHOLD: float = 0.65

    def __init__(self, user_id: str, auditor_level: AuditorLevel):
        self.user_id = user_id
        self.auditor_level = auditor_level
        # Instantiate all five agents (lightweight — no LLM calls at init time)
        self.agents: dict[APCFDomain, BaseAPCFAgent] = {
            domain: cls() for domain, cls in self.AGENT_REGISTRY.items()
        }

    async def run(
        self,
        message: str,
        preferred_domain: Optional[APCFDomain],
        session_id: str,
    ) -> dict[str, Any]:
        """
        Full swarm execution:
          1. Build state
          2. Route to domains
          3. Run primary + supporting agents (concurrently where possible)
          4. Merge and return structured response
        """
        state = SwarmState(
            session_id=session_id,
            user_id=self.user_id,
            auditor_level=self.auditor_level,
            message=message,
            preferred_domain=preferred_domain,
        )

        # --- Step 1: Route ---
        state.domain_scores = await route_to_domains(message, preferred_domain)
        sorted_domains = sorted(state.domain_scores.items(), key=lambda x: x[1], reverse=True)
        primary_domain: APCFDomain = sorted_domains[0][0]
        state.primary_domain = primary_domain

        # --- Step 2: Identify supporting agents ---
        supporting_domains: list[APCFDomain] = [
            d
            for d, score in sorted_domains[1:]
            if score >= self.SUPPORTING_AGENT_THRESHOLD
        ][:2]  # cap at 2 supporting agents to avoid response bloat

        # --- Step 3: Concurrent agent execution ---
        primary_task = asyncio.create_task(
            self.agents[primary_domain].run(state),
            name=f"agent_{primary_domain}",
        )
        supporting_tasks = [
            asyncio.create_task(self.agents[d].run(state), name=f"agent_{d}")
            for d in supporting_domains
        ]

        primary_output = await primary_task
        supporting_outputs = await asyncio.gather(*supporting_tasks, return_exceptions=True)

        # Filter out any exceptions from supporting agents (graceful degradation)
        clean_supporting: list[dict] = [
            o for o in supporting_outputs if isinstance(o, dict)
        ]

        # --- Step 4: Level-up nudge ---
        nudge = self._compute_level_nudge(state.auditor_level, state.domain_scores)

        # --- Step 5: Assemble response matching main.py SymbioChatResponse ---
        return {
            "session_id": session_id,
            "primary_response": primary_output,
            "supporting_agents": clean_supporting,
            "auditor_level_hint": nudge,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def _compute_level_nudge(
        self, auditor_level: AuditorLevel, domain_scores: dict[str, float]
    ) -> Optional[str]:
        """
        If the student's question is showing signals of the NEXT level's competency,
        surface a gentle nudge toward portfolio evidence opportunities.
        """
        next_level_signals: dict[AuditorLevel, list[str]] = {
            "ai_user": ["evaluate", "compare", "critique"],
            "ai_evaluator": ["policy", "ethics", "governance", "audit"],
            "ai_auditor": ["strategy", "roadmap", "organisational", "leadership"],
            "aipo": [],
        }
        signals = next_level_signals.get(auditor_level, [])
        level_up_map = {
            "ai_user": "AI Evaluator",
            "ai_evaluator": "AI Auditor",
            "ai_auditor": "AIPO",
            "aipo": None,
        }
        if not signals:
            return None
        high_score_domains = [d for d, s in domain_scores.items() if s > 0.7]
        if any(sig in " ".join(high_score_domains) for sig in signals):
            nxt = level_up_map.get(auditor_level)
            if nxt:
                return (
                    f"Your question touches on {nxt}-level thinking! "
                    f"Consider adding this interaction to your portfolio as evidence "
                    f"for your next AI Auditor progression."
                )
        return None


# ---------------------------------------------------------------------------
# Echo Twin agents (faculty) — lightweight stubs referenced from main.py
# ---------------------------------------------------------------------------


class EchoTwinAgent:
    """
    Faculty digital twin — general conversational mode.
    Backed by a faculty-specific system prompt that encodes their teaching
    philosophy, research interests, and preferred communication style.
    """

    def __init__(self, faculty_id: str):
        self.faculty_id = faculty_id
        from prompts.library import PromptLibrary
        self.prompt_library = PromptLibrary()

    async def respond(
        self,
        message: str,
        mode: str,
        document_context: Optional[str],
        session_id: str,
    ) -> tuple[str, list[str]]:
        """Return (response_text, suggested_actions)."""
        system_prompt = self.prompt_library.get_echo_twin_prompt(mode=mode)
        # TODO: LLM call with system_prompt + document_context as context
        response = f"[Echo Twin | mode={mode}] Responding to faculty query: {message[:80]}"
        actions = ["Add to draft studio", "Search research radar", "Save to notes"]
        return response, actions


class DraftStudioAgent:
    """
    Specialised drafting agent for the Echo Twin.
    Routes to document-type-specific prompts in prompts/library.py.
    """

    def __init__(self, faculty_id: str):
        self.faculty_id = faculty_id
        from prompts.library import PromptLibrary
        self.prompt_library = PromptLibrary()

    async def generate_draft(
        self,
        doc_type: str,
        title: str,
        topic: str,
        target_venue: Optional[str],
        word_count: int,
        key_points: list[str],
        existing_draft: Optional[str],
    ) -> tuple[str, list[str], list[str]]:
        """Return (draft_content, revision_notes, next_steps)."""
        system_prompt = self.prompt_library.get_draft_studio_prompt(doc_type=doc_type)
        # TODO: LLM call with structured doc-type prompt
        draft = f"[Draft Studio | {doc_type}] Draft for '{title}' on '{topic}'.\n\n[AI-generated content — LLM call pending]"
        revision_notes = ["Expand introduction section", "Add citations to claims in section 2"]
        next_steps = [
            "Review with faculty co-author",
            "Submit to Research Radar for gap analysis",
            "Check journal formatting guidelines",
        ]
        return draft, revision_notes, next_steps
