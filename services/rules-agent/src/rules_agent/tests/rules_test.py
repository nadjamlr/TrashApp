import asyncio

from fastapi.testclient import TestClient

from rules_agent.agent import run_agent
from rules_agent.main import app
from rules_agent.schemas import RulesRequest


client = TestClient(app) # Test HTTP Client


# Test Health Statuscode - Ist Service erreichbar?
def test_health_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "rules-agent"}


# Test runagent gibt YAML-Treffer zuerst zurück
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


# regex fallback test vor llm
def test_run_agent_returns_common_fallback_before_llm(monkeypatch) -> None:
    monkeypatch.setattr("rules_agent.agent.find_rule_item", lambda label, material: None)

    result = asyncio.run(
        run_agent(RulesRequest(label="Where does a yogurt cup go?", material="", city="munich"))
    )

    assert result.bin == "Wertstoffinseln"
    assert result.source == "fallback"
    assert result.confidence == 0.85
    assert "plastic packaging" in result.reasoning


# regex test: kontexterkennung
def test_run_agent_returns_fallback_for_broken_glass(monkeypatch) -> None:
    monkeypatch.setattr("rules_agent.agent.find_rule_item", lambda label, material: None)

    result = asyncio.run(
        run_agent(RulesRequest(label="broken glass", material="", city="munich"))
    )

    assert result.bin == "Restmuelltonne or Wertstoffhof"
    assert result.source == "fallback"
    assert result.confidence == 0.85


# unknown rückgabe bei rest
def test_run_agent_returns_unknown_when_llm_fails(monkeypatch) -> None:
    monkeypatch.setattr("rules_agent.agent.find_rule_item", lambda label, material: None)

    class FakeResult:
        pydantic = None

    class FakeCrew:
        async def kickoff_async(self, inputs):
            return FakeResult()

    monkeypatch.setattr("rules_agent.agent.LLM", lambda **kwargs: None)
    monkeypatch.setattr("rules_agent.agent.Agent", lambda **kwargs: None)
    monkeypatch.setattr("rules_agent.agent.Task", lambda **kwargs: None)
    monkeypatch.setattr("rules_agent.agent.Crew", lambda agents, tasks, verbose: FakeCrew())

    result = asyncio.run(
        run_agent(RulesRequest(label="mystery blob", material="", city="munich"))
    )

    assert result.bin == "unknown"
    assert result.source == "unknown"
    assert result.confidence == 0.0
    assert "clarify the material" in result.reasoning


# test zusammenspiel main, agent, etc.
def test_classify_endpoint_returns_fallback_result(monkeypatch) -> None:
    monkeypatch.setattr("rules_agent.agent.find_rule_item", lambda label, material: None)

    response = client.post(
        "/rules/classify",
        json={"label": "pizza box", "material": "cardboard", "city": "munich"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["bin"] == "Papiertonne or Restmuelltonne"
    assert payload["source"] == "fallback"
    assert payload["confidence"] == 0.85
