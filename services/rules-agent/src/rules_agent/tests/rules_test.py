import asyncio

from fastapi.testclient import TestClient

from rules_agent.agent import run_agent
from rules_agent.main import app
from rules_agent.rules import MAX_IMPORTANT_NOTES, find_rule_item, rules_result_from_item
from rules_agent.schemas import RulesRequest
from rules_agent.translate import _correct_known_terms


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


# --- find_rule_item against the real munich_rules.yaml (no mocking) ---
# Regression coverage for real camera-scan label/material pairs that previously
# failed to match, either due to a stale deployment or missing yaml coverage.

def test_find_rule_item_matches_newspaper_paper() -> None:
    item = find_rule_item("zeitung", "papier")

    assert item is not None
    assert item["bin"] == "Papiertonne"


def test_find_rule_item_matches_banana_peel_organic() -> None:
    item = find_rule_item("bananenschale", "organisch")

    assert item is not None
    assert item["bin"] == "Biotonne"


def test_find_rule_item_matches_plural_bottle_material() -> None:
    # "Flaschen" (plural) should still match the "Glas" material via stemming.
    item = find_rule_item("flaschen", "glas")

    assert item is not None
    assert item["bin"] == "Wertstoffinseln"


def test_find_rule_item_matches_compound_word() -> None:
    # "Zeitungspapier" is a German compound word containing "papier" as a
    # substring, not a separate token - covers the compound-word partial match.
    item = find_rule_item("zeitungspapier", "")

    assert item is not None
    assert item["bin"] == "Papiertonne"


def test_find_rule_item_matches_car_battery() -> None:
    item = find_rule_item("autobatterie", "")

    assert item is not None
    assert item["name"] == "Car batteries and lead batteries"


def test_find_rule_item_matches_washing_machine() -> None:
    item = find_rule_item("waschmaschine", "")

    assert item is not None
    assert item["name"] == "Large electronic appliances"


def test_find_rule_item_matches_motor_oil() -> None:
    item = find_rule_item("motoroel", "")

    assert item is not None
    assert item["name"] == "Motor oil and lubricating oil"


def test_find_rule_item_returns_none_for_gibberish() -> None:
    assert find_rule_item("qwxjklzzz", "qwxjklzzz") is None


def test_find_rule_item_does_not_confuse_broken_with_brokkoli() -> None:
    # Regression guard: a naive stemmer once shortened "broken" to "brok", which
    # coincidentally prefix-matched the "Brokkoli" keyword and misclassified
    # broken glass as organic waste (Biotonne).
    item = find_rule_item("broken glass", "")

    assert item is not None
    assert item["name"] != "Organic kitchen and garden waste"


# --- important_notes cap ---

def test_rules_result_from_item_caps_important_notes() -> None:
    item = {
        "name": "Test item",
        "bin": "Restmuelltonne",
        "notes": ["Note one.", "Note two.", "Note three.", "Note four."],
    }

    result = rules_result_from_item(item)

    assert len(result.important_notes) == MAX_IMPORTANT_NOTES
    assert result.important_notes == ["Note one.", "Note two."]


def test_paper_and_cardboard_yaml_entry_is_capped_after_matching() -> None:
    # "Paper and cardboard" has 3 notes in munich_rules.yaml - confirms the cap
    # applies to real yaml data, not just a synthetic fixture.
    item = find_rule_item("zeitung", "papier")
    result = rules_result_from_item(item)

    assert len(result.important_notes) <= MAX_IMPORTANT_NOTES


# --- language handling ---

def test_rules_request_defaults_to_english() -> None:
    assert RulesRequest(label="x", material="y").language == "en"


def test_run_agent_returns_english_untranslated_by_default(monkeypatch) -> None:
    monkeypatch.setattr(
        "rules_agent.agent.find_rule_item",
        lambda label, material: {
            "name": "Small electronic devices",
            "bin": "Wertstoffhof",
            "alternatives": ["Retail take-back where legally offered"],
            "notes": [],
        },
    )

    result = asyncio.run(
        run_agent(RulesRequest(label="headphones", material="", city="munich", language="en"))
    )

    assert "Retail take-back" in result.alternatives[0]


def test_run_agent_translates_deterministic_result_for_german(monkeypatch) -> None:
    monkeypatch.setattr(
        "rules_agent.agent.find_rule_item",
        lambda label, material: {
            "name": "Small electronic devices",
            "bin": "Wertstoffhof",
            "alternatives": ["Retail take-back where legally offered"],
            "notes": [],
        },
    )

    async def fake_translate(result):
        return result.model_copy(update={"alternatives": ["Rücknahme im Handel, falls gesetzlich angeboten"]})

    monkeypatch.setattr("rules_agent.agent.translate_result_to_german", fake_translate)

    result = asyncio.run(
        run_agent(RulesRequest(label="headphones", material="", city="munich", language="de"))
    )

    assert result.bin == "Wertstoffhof"
    assert result.alternatives == ["Rücknahme im Handel, falls gesetzlich angeboten"]


# --- known-term typo correction ---
# Regression guard: the LLM occasionally generates a near-miss spelling of a known
# German municipal term (e.g. "Restmílltonne" instead of "Restmülltonne" - one
# wrong character, otherwise correct). This is fixed with a post-processing pass
# rather than more prompt instructions, since prompt-based attempts to enforce
# correct spelling made the small local model hallucinate or refuse to answer.

def test_correct_known_terms_fixes_near_miss_spelling() -> None:
    text = "Bitte nicht in die Restmílltonne werfen."

    result = _correct_known_terms(text)

    assert "Restmülltonne" in result
    assert "Restmílltonne" not in result


def test_correct_known_terms_leaves_unrelated_words_unchanged() -> None:
    text = "Dies ist ein Test mit Pappe, Verpackung und Kartonagen."

    assert _correct_known_terms(text) == text


def test_correct_known_terms_leaves_already_correct_terms_unchanged() -> None:
    text = "Biotonne und Papiertonne und Giftmobil bleiben unveraendert."

    result = _correct_known_terms(text)

    assert "Biotonne" in result
    assert "Papiertonne" in result
    assert "Giftmobil" in result
