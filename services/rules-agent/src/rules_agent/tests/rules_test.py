import asyncio

from fastapi.testclient import TestClient

from rules_agent.agent import run_agent
from rules_agent.main import app
from rules_agent.schemas import RulesRequest


client = TestClient(app)


def test_health_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "rules-agent"}


def test_run_agent_returns_direct_rule_match_before_llm(monkeypatch) -> None:
    monkeypatch.setattr(
        "rules_agent.agent.find_rule_item",
        lambda label, material: {
            "name": "Small electronic devices",
            "bin": "Wertstoffhof",
            "deposit": "none",
            "alternatives": ["Retail take-back where legally offered"],
            "notes": ["Electrical devices must not be disposed of in Restmuelltonne."],
        },
    )

    result = asyncio.run(
        run_agent(RulesRequest(label="headphones", material="", city="munich"))
    )

    assert result.bin == "Wertstoffhof"
    assert result.source == "rules"
    assert result.confidence == 0.95
    assert result.deposit is None
    assert "Retail take-back" in result.alternatives[0]


def test_run_agent_returns_common_fallback_before_llm(monkeypatch) -> None:
    monkeypatch.setattr("rules_agent.agent.find_rule_item", lambda label, material: None)

    result = asyncio.run(
        run_agent(RulesRequest(label="Where does a yogurt cup go?", material="", city="munich"))
    )

    assert result.bin == "Wertstoffinseln"
    assert result.source == "fallback"
    assert result.confidence == 0.85
    assert "plastic packaging" in result.reasoning


def test_run_agent_returns_organic_fallback_for_cucumber_without_llm(monkeypatch) -> None:
    monkeypatch.setattr("rules_agent.agent.find_rule_item", lambda label, material: None)

    result = asyncio.run(
        run_agent(RulesRequest(label="Where do cucumber slices go?", material="", city="munich"))
    )

    assert result.bin == "Biotonne"
    assert result.source == "fallback"
    assert result.confidence == 0.85
    assert "organic kitchen waste" in result.reasoning


def test_run_agent_returns_fast_unknown_without_llm(monkeypatch) -> None:
    monkeypatch.setattr("rules_agent.agent.find_rule_item", lambda label, material: None)

    def fail_if_llm_is_built(*args, **kwargs):
        raise AssertionError("Ollama/Crew should not run for unknown deterministic misses")

    monkeypatch.setattr("rules_agent.agent.LLM", fail_if_llm_is_built)

    result = asyncio.run(
        run_agent(RulesRequest(label="mystery blob", material="", city="munich"))
    )

    assert result.bin == "unknown"
    assert result.source == "unknown"
    assert result.confidence == 0.0
    assert "clarify the material" in result.reasoning


def test_classify_endpoint_returns_fallback_result(monkeypatch) -> None:
    monkeypatch.setattr("rules_agent.agent.find_rule_item", lambda label, material: None)

    response = client.post(
        "/rules/classify",
        json={"label": "Where do LED bulbs go?", "material": "", "city": "munich"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["bin"] == "Wertstoffhof"
    assert payload["source"] == "fallback"
    assert payload["confidence"] == 0.85
