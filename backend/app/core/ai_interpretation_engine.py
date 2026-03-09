"""
AI Interpretation Engine — UrjaRakshak v2.2
============================================
Physics-grounded, structured AI interpretation layer.

Architecture:
  Layer 1 — Deterministic core (physics + GHI + risk) builds structured context
  Layer 2 — Structured prompt builder (never sends raw DB rows)
  Layer 3 — LLM call (Anthropic Claude or OpenAI GPT — temperature 0.2)
  Layer 4 — Output validation + guardrails (strips speculation)
  Layer 5 — Audit: prompt hash, model, tokens, timestamp stored in DB

Ethics contract:
  - SYSTEM_PROMPT explicitly forbids individual attribution
  - Output schema is bounded — no free-text accusation fields
  - If confidence < threshold, interpretation is refused
  - All outputs stored for audit traceability

Author: Vipin Baniya
"""

import hashlib
import json
import logging
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ── Prompt templates ──────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
You are a senior infrastructure risk analyst for an energy utility company.
Your role is to interpret physics-based grid diagnostics and recommend engineering actions.

STRICT RULES — violation will invalidate this response:
1. DO NOT speculate about individuals, customers, or specific people.
2. All analysis must refer to INFRASTRUCTURE (transformers, lines, meters, substations).
3. Express uncertainty explicitly — use phrases like "may indicate", "possible", "warrants investigation".
4. Be conservative: prefer recommending investigation over definitive conclusions.
5. DO NOT invent data not present in the summary provided.
6. Output ONLY valid JSON matching the schema below. No prose outside JSON.

OUTPUT SCHEMA (return exactly this structure):
{
  "risk_level": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "primary_infrastructure_hypothesis": "<one sentence, infrastructure-scoped>",
  "inspection_priority": "<INFORMATIONAL|LOW|MEDIUM|HIGH|CRITICAL>",
  "recommended_actions": ["<action 1>", "<action 2>", "<action 3>"],
  "confidence_commentary": "<one sentence about confidence and uncertainty>",
  "trend_assessment": "<one sentence about temporal trend if data present, else 'Insufficient trend data'>",
  "estimated_investigation_scope": "<FIELD_CREW|DESK_REVIEW|SENIOR_ENGINEER>"
}
"""

USER_PROMPT_TEMPLATE = """\
GRID SECTION DIAGNOSTIC SUMMARY
=================================
Substation: {substation_id}
Analysis Timestamp: {timestamp}

PHYSICS RESULTS:
  Input Energy:         {input_mwh:.2f} MWh
  Output Energy:        {output_mwh:.2f} MWh
  Expected Tech Loss:   {expected_loss_mwh:.2f} MWh
  Actual Loss:          {actual_loss_mwh:.2f} MWh
  Residual (unexplained): {residual_pct:.2f}% of input
  Balance Status:       {balance_status}
  Measurement Quality:  {measurement_quality}

ANOMALY DETECTION:
  Anomaly Rate:         {anomaly_rate_pct:.1f}% of readings
  Anomalies Flagged:    {anomalies_flagged}
  Detection Method:     Z-Score + Isolation Forest ensemble

GRID HEALTH INDEX:
  GHI Score:            {ghi:.1f} / 100
  Classification:       {ghi_class}
  PBS (Physics Balance): {pbs:.3f}
  ASS (Anomaly Stability): {ass:.3f}
  CS  (Confidence):     {cs:.3f}
  TSS (Trend Stability): {tss:.3f}
  DIS (Data Integrity): {dis:.3f}

RISK CLASSIFICATION (deterministic):
  Priority:             {priority}
  Category:             {category}

TREND DATA ({trend_count} recent analyses):
{trend_summary}

Physics Engine Confidence: {confidence_pct:.0f}%

Interpret this diagnostic. Output JSON only.
"""


# ── Data structures ────────────────────────────────────────────────────────

@dataclass
class AIInterpretationInput:
    substation_id:    str
    timestamp:        str
    input_mwh:        float
    output_mwh:       float
    expected_loss_mwh: float
    actual_loss_mwh:  float
    residual_pct:     float
    balance_status:   str
    measurement_quality: str
    anomaly_rate:     float       # fraction
    anomalies_flagged: int
    ghi:              float
    ghi_class:        str
    pbs:              float
    ass:              float
    cs:               float
    tss:              float
    dis:              float
    priority:         str
    category:         str
    confidence:       float
    trend:            List[Dict]  # [{ts, residual_pct}, …]


@dataclass
class AIInterpretationResult:
    risk_level:                    str
    primary_infrastructure_hypothesis: str
    inspection_priority:           str
    recommended_actions:           List[str]
    confidence_commentary:         str
    trend_assessment:              str
    estimated_investigation_scope: str
    model_name:                    str
    model_version:                 str
    prompt_hash:                   str
    token_usage:                   int
    raw_response:                  Optional[str] = None
    error:                         Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "risk_level":                    self.risk_level,
            "primary_infrastructure_hypothesis": self.primary_infrastructure_hypothesis,
            "inspection_priority":           self.inspection_priority,
            "recommended_actions":           self.recommended_actions,
            "confidence_commentary":         self.confidence_commentary,
            "trend_assessment":              self.trend_assessment,
            "estimated_investigation_scope": self.estimated_investigation_scope,
            "model_name":                    self.model_name,
            "model_version":                 self.model_version,
            "prompt_hash":                   self.prompt_hash,
            "token_usage":                   self.token_usage,
            "error":                         self.error,
        }


# ── Allowed values for guardrail validation ───────────────────────────────

_VALID_RISK_LEVELS = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
_VALID_PRIORITIES  = {"INFORMATIONAL", "LOW", "MEDIUM", "HIGH", "CRITICAL"}
_VALID_SCOPES      = {"FIELD_CREW", "DESK_REVIEW", "SENIOR_ENGINEER"}


# ── Engine ─────────────────────────────────────────────────────────────────

class AIInterpretationEngine:
    """
    AI-powered interpretation layer.

    Supports:
      - Anthropic Claude (claude-haiku-4-5 via Messages API)
      - OpenAI GPT-4o-mini
      - Offline mock mode (no API key configured)

    The engine NEVER sends raw DB rows. It builds a structured summary from
    the deterministic physics + GHI + risk results, then asks the LLM to
    interpret within a bounded JSON schema.
    """

    MIN_CONFIDENCE_THRESHOLD = 0.5  # refuse interpretation below this

    def __init__(self, anthropic_key: Optional[str] = None, openai_key: Optional[str] = None):
        self._anthropic_key = anthropic_key
        self._openai_key    = openai_key

    @property
    def is_configured(self) -> bool:
        return bool(self._anthropic_key or self._openai_key)

    @property
    def preferred_provider(self) -> str:
        if self._anthropic_key: return "anthropic"
        if self._openai_key:    return "openai"
        return "none"

    def interpret(self, inp: AIInterpretationInput) -> AIInterpretationResult:
        """
        Main entry point. Builds prompt, calls LLM, validates output.
        Returns a structured AIInterpretationResult.
        """
        # Refuse if confidence too low
        if inp.confidence < self.MIN_CONFIDENCE_THRESHOLD:
            return self._refused_result(
                reason=f"Confidence {inp.confidence*100:.0f}% is below threshold "
                       f"({self.MIN_CONFIDENCE_THRESHOLD*100:.0f}%). Cannot interpret reliably.",
                inp=inp,
            )

        # Build bounded prompt
        prompt = self._build_user_prompt(inp)
        prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()[:16]

        if not self.is_configured:
            return self._offline_result(inp, prompt_hash)

        # Try preferred provider, fallback to other
        try:
            if self.preferred_provider == "anthropic":
                return self._call_anthropic(prompt, prompt_hash, inp)
            else:
                return self._call_openai(prompt, prompt_hash, inp)
        except Exception as e:
            logger.warning("AI interpretation failed: %s — returning offline result", e)
            result = self._offline_result(inp, prompt_hash)
            result.error = f"API call failed: {str(e)[:200]}"
            return result

    # ── Prompt builder ────────────────────────────────────────────────────

    @staticmethod
    def _build_user_prompt(inp: AIInterpretationInput) -> str:
        # Build trend summary
        if inp.trend:
            lines = []
            for t in inp.trend[-7:]:  # last 7 data points
                ts = t.get("ts", "")[:10]
                r  = t.get("residual_pct", 0)
                lines.append(f"  {ts}: residual {r:.2f}%")
            trend_summary = "\n".join(lines)
        else:
            trend_summary = "  No trend data available"

        return USER_PROMPT_TEMPLATE.format(
            substation_id=inp.substation_id,
            timestamp=inp.timestamp,
            input_mwh=inp.input_mwh,
            output_mwh=inp.output_mwh,
            expected_loss_mwh=inp.expected_loss_mwh,
            actual_loss_mwh=inp.actual_loss_mwh,
            residual_pct=inp.residual_pct,
            balance_status=inp.balance_status,
            measurement_quality=inp.measurement_quality,
            anomaly_rate_pct=inp.anomaly_rate * 100,
            anomalies_flagged=inp.anomalies_flagged,
            ghi=inp.ghi,
            ghi_class=inp.ghi_class,
            pbs=inp.pbs,
            ass=inp.ass,
            cs=inp.cs,
            tss=inp.tss,
            dis=inp.dis,
            priority=inp.priority,
            category=inp.category,
            confidence_pct=inp.confidence * 100,
            trend_count=len(inp.trend),
            trend_summary=trend_summary,
        )

    # ── Provider callers ──────────────────────────────────────────────────

    def _call_anthropic(
        self, prompt: str, prompt_hash: str, inp: AIInterpretationInput
    ) -> AIInterpretationResult:
        import anthropic
        client = anthropic.Anthropic(api_key=self._anthropic_key)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            temperature=0.2,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text
        tokens = response.usage.input_tokens + response.usage.output_tokens
        parsed = self._parse_and_validate(raw)
        return AIInterpretationResult(
            **parsed,
            model_name="claude-haiku-4-5",
            model_version="20251001",
            prompt_hash=prompt_hash,
            token_usage=tokens,
            raw_response=raw,
        )

    def _call_openai(
        self, prompt: str, prompt_hash: str, inp: AIInterpretationInput
    ) -> AIInterpretationResult:
        from openai import OpenAI
        client = OpenAI(api_key=self._openai_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            max_tokens=800,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
        raw = response.choices[0].message.content
        tokens = response.usage.total_tokens
        parsed = self._parse_and_validate(raw)
        return AIInterpretationResult(
            **parsed,
            model_name="gpt-4o-mini",
            model_version="2024",
            prompt_hash=prompt_hash,
            token_usage=tokens,
            raw_response=raw,
        )

    # ── Validation / guardrails ───────────────────────────────────────────

    def _parse_and_validate(self, raw: str) -> Dict[str, Any]:
        """
        Parse LLM JSON response and enforce guardrails.
        Raises ValueError on invalid structure.
        """
        # Extract JSON from response (LLM sometimes wraps in code blocks)
        json_str = raw.strip()
        if json_str.startswith("```"):
            json_str = re.sub(r"^```[a-z]*\n?", "", json_str)
            json_str = re.sub(r"\n?```$", "", json_str)

        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValueError(f"LLM returned invalid JSON: {e}. Raw: {raw[:200]}")

        # Validate required fields
        required = {
            "risk_level", "primary_infrastructure_hypothesis",
            "inspection_priority", "recommended_actions",
            "confidence_commentary", "trend_assessment",
            "estimated_investigation_scope",
        }
        missing = required - set(data.keys())
        if missing:
            raise ValueError(f"LLM response missing fields: {missing}")

        # Enforce allowed values
        data["risk_level"] = self._coerce_enum(
            data["risk_level"], _VALID_RISK_LEVELS, "MEDIUM"
        )
        data["inspection_priority"] = self._coerce_enum(
            data["inspection_priority"], _VALID_PRIORITIES, "MEDIUM"
        )
        data["estimated_investigation_scope"] = self._coerce_enum(
            data["estimated_investigation_scope"], _VALID_SCOPES, "FIELD_CREW"
        )

        # Ensure recommended_actions is a list of strings
        if not isinstance(data["recommended_actions"], list):
            data["recommended_actions"] = [str(data["recommended_actions"])]
        data["recommended_actions"] = [str(a)[:300] for a in data["recommended_actions"][:8]]

        # Guardrail: strip any individual-accusing language
        data = self._apply_guardrails(data)

        return data

    @staticmethod
    def _coerce_enum(value: str, valid: set, default: str) -> str:
        normalized = str(value).strip().upper()
        return normalized if normalized in valid else default

    @staticmethod
    def _apply_guardrails(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Strip any content that references individuals or makes direct accusations.
        Also enforce infrastructure-scoped language.
        """
        # Patterns to detect and neutralise
        _ACCUSATION_PATTERNS = [
            r"\btheft\b", r"\bstolen\b", r"\bfraud\b",
            r"\bsuspect\b", r"\bcriminal\b", r"\billegal\b",
            r"\bcustomer\s+\w+\s+is\b", r"\bperson\b", r"\bindividual\b",
        ]

        def clean(text: str) -> str:
            for pattern in _ACCUSATION_PATTERNS:
                if re.search(pattern, text, re.IGNORECASE):
                    text = re.sub(
                        pattern,
                        "[infrastructure-scoped language required]",
                        text, flags=re.IGNORECASE,
                    )
            return text

        data["primary_infrastructure_hypothesis"] = clean(
            data["primary_infrastructure_hypothesis"]
        )
        data["confidence_commentary"] = clean(data["confidence_commentary"])
        data["recommended_actions"] = [clean(a) for a in data["recommended_actions"]]
        return data

    # ── Fallback results ──────────────────────────────────────────────────

    @staticmethod
    def _offline_result(inp: AIInterpretationInput, prompt_hash: str) -> AIInterpretationResult:
        """Return a deterministic offline result when no API key is configured."""
        # Map GHI classification to risk level
        risk_map = {
            "HEALTHY": "LOW", "STABLE": "LOW",
            "DEGRADED": "MEDIUM", "CRITICAL": "HIGH", "SEVERE": "CRITICAL",
        }
        risk = risk_map.get(inp.ghi_class, "MEDIUM")

        return AIInterpretationResult(
            risk_level=risk,
            primary_infrastructure_hypothesis=(
                f"GHI {inp.ghi:.1f} ({inp.ghi_class}). "
                f"Residual {inp.residual_pct:.2f}% may indicate "
                f"{inp.category.lower().replace('_', ' ')} issue. "
                "Infrastructure inspection is recommended."
            ),
            inspection_priority=inp.priority,
            recommended_actions=[
                "Schedule physical inspection of the substation infrastructure",
                "Verify meter calibration dates and communication health",
                "Review load schedules and reactive power compensation",
            ],
            confidence_commentary=(
                f"Physics engine confidence: {inp.confidence*100:.0f}%. "
                "AI interpretation offline — configure ANTHROPIC_API_KEY or OPENAI_API_KEY "
                "for live LLM analysis."
            ),
            trend_assessment=(
                f"{len(inp.trend)} data points available for trend analysis."
                if inp.trend else "Insufficient trend data."
            ),
            estimated_investigation_scope=(
                "SENIOR_ENGINEER" if inp.ghi < 50 else "FIELD_CREW"
            ),
            model_name="offline",
            model_version="deterministic",
            prompt_hash=prompt_hash,
            token_usage=0,
        )

    @staticmethod
    def _refused_result(reason: str, inp: AIInterpretationInput) -> AIInterpretationResult:
        return AIInterpretationResult(
            risk_level="MEDIUM",
            primary_infrastructure_hypothesis="Interpretation refused — insufficient confidence.",
            inspection_priority="MEDIUM",
            recommended_actions=["Collect more data before drawing conclusions", "Verify measurement equipment"],
            confidence_commentary=reason,
            trend_assessment="Insufficient data quality for trend analysis.",
            estimated_investigation_scope="DESK_REVIEW",
            model_name="refused",
            model_version="n/a",
            prompt_hash="",
            token_usage=0,
            error=reason,
        )


# ── Singleton (keys injected at startup) ─────────────────────────────────
_ai_engine: Optional[AIInterpretationEngine] = None


def get_ai_engine() -> AIInterpretationEngine:
    global _ai_engine
    if _ai_engine is None:
        _ai_engine = AIInterpretationEngine()
    return _ai_engine


def init_ai_engine(anthropic_key: Optional[str], openai_key: Optional[str]) -> AIInterpretationEngine:
    global _ai_engine
    _ai_engine = AIInterpretationEngine(anthropic_key=anthropic_key, openai_key=openai_key)
    return _ai_engine
