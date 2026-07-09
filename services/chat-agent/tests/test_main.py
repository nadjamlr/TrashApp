import asyncio
import json
import logging

from fastapi.testclient import TestClient

from chat_agent.agent import (
    ask_waste_question,
    _build_polish_messages,
    _build_polish_prompt,
    _build_polish_system_prompt,
    _build_prompt,
    _direct_rule_response,
    _parse_agent_output,
    _preferred_language,
    _relevant_rules_text,
)
from chat_agent.main import app
from chat_agent.schemas import ChatResponse, ConversationMessage


client = TestClient(app)


def _common_test_rules() -> dict:
    return {
        "items": [
            {
                "name": "Organic kitchen and garden waste",
                "bin": "Biotonne",
                "alternatives": ["Home composting where suitable"],
                "notes": ["Use the brown organic bin for fruit and vegetable scraps, bread, and coffee grounds."],
                "keywords": ["food scraps", "coffee grounds", "bread"],
            },
            {
                "name": "Batteries and button cells",
                "bin": "Retail battery collection boxes",
                "alternatives": ["Wertstoffhof", "Giftmobil"],
                "notes": ["Batteries must not be disposed of in Restmuelltonne."],
                "keywords": ["batteries", "battery"],
            },
            {
                "name": "Clothing, shoes, and textiles",
                "bin": "AWM Altkleidercontainer",
                "alternatives": ["Wertstoffhof"],
                "notes": ["Only put well-preserved and clean textiles into clothing containers."],
                "keywords": ["clothes", "clothing", "textiles"],
            },
            {
                "name": "Small electronic devices",
                "bin": "Wertstoffhof",
                "alternatives": ["Retail take-back where legally offered"],
                "notes": ["Electrical and electronic devices must not be disposed of in Restmuelltonne."],
                "keywords": ["electronics", "electronic device", "headphones"],
            },
            {
                "name": "Paint, wall paint, and varnish",
                "bin": "Wertstoffhof",
                "alternatives": ["Restmuelltonne for dried residues up to 2 kg"],
                "notes": ["Private households can take quantities up to 25 kg to Wertstoffhoefe free of charge."],
                "keywords": ["paint", "varnish"],
            },
        ],
        "deposit_rules": {},
    }


def test_health_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "chat-agent"}


def test_chat_ask_passes_history_and_returns_schema(monkeypatch) -> None:
    captured = {}

    async def fake_ask_waste_question(message, conversation_history):
        captured["message"] = message
        captured["conversation_history"] = conversation_history
        return ChatResponse(
            response="Kaputte Kopfhoerer gehoeren zum Elektroschrott.",
            suggested_location=None,
        )

    monkeypatch.setattr("chat_agent.main.ask_waste_question", fake_ask_waste_question)

    response = client.post(
        "/chat/ask",
        json={
            "message": "Was mache ich mit kaputten Kopfhoerern?",
            "conversation_history": [
                {"role": "user", "content": "Ich wohne in Muenchen."},
                {"role": "assistant", "content": "Welche Sache moechtest du entsorgen?"},
            ],
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "response": "Kaputte Kopfhoerer gehoeren zum Elektroschrott.",
        "suggested_location": None,
    }
    assert captured["message"] == "Was mache ich mit kaputten Kopfhoerern?"
    assert [message.model_dump() for message in captured["conversation_history"]] == [
        {"role": "user", "content": "Ich wohne in Muenchen."},
        {"role": "assistant", "content": "Welche Sache moechtest du entsorgen?"},
    ]


def test_chat_ask_requires_message() -> None:
    response = client.post("/chat/ask", json={})

    assert response.status_code == 422


def test_chat_ask_rejects_invalid_history_role() -> None:
    response = client.post(
        "/chat/ask",
        json={
            "message": "Was mache ich mit kaputten Kopfhoerern?",
            "conversation_history": [
                {"role": "system", "content": "Du bist ein hilfreicher Assistent."},
            ],
        },
    )

    assert response.status_code == 422


def test_parse_agent_output_extracts_wrapped_json() -> None:
    response = _parse_agent_output(
        'Here is my response:\n{"response": "Use Wertstoffhof.", "suggested_location": null}\nReasoning...'
    )

    assert response == ChatResponse(response="Use Wertstoffhof.", suggested_location=None)


def test_parse_agent_output_falls_back_to_plain_text_for_non_json() -> None:
    response = _parse_agent_output("Use AWM if the available rules do not specify the item.")

    assert response == ChatResponse(
        response="Use AWM if the available rules do not specify the item.",
        suggested_location=None,
    )


def test_build_prompt_includes_all_category_names_without_full_unselected_rules(monkeypatch) -> None:
    monkeypatch.setattr(
        "chat_agent.retrieval.load_rules",
        lambda: {
            "items": [
                {
                    "name": "Organic kitchen and garden waste",
                    "bin": "Biotonne",
                    "alternatives": [],
                    "notes": ["Selected organic details."],
                },
                {
                    "name": "Small electronic devices",
                    "bin": "Wertstoffhof",
                    "keywords": ["earbuds"],
                    "alternatives": [],
                    "notes": ["Unselected electronics details should not be in the prompt."],
                },
            ],
            "deposit_rules": {},
        },
    )

    prompt = _build_prompt("Where do food scraps go?", [])

    assert "- Organic kitchen and garden waste" in prompt
    assert "- Small electronic devices" in prompt
    assert "Selected organic details." in prompt
    assert "Unselected electronics details should not be in the prompt." not in prompt
    assert "Fallback disposal method guide:" in prompt
    assert "Biotonne: use for Organic kitchen and garden waste" in prompt
    assert "Wertstoffhof: use for Electronics" in prompt
    assert "less than 70 percent confident" in prompt
    assert "ask one concise clarifying question" in prompt
    assert "answer in English" in prompt


def test_preferred_language_uses_first_user_message() -> None:
    history = [
        ConversationMessage(role="user", content="Where do batteries go?"),
        ConversationMessage(role="assistant", content="Batteries go to collection boxes."),
    ]

    assert _preferred_language("Und Gurken?", history) == "en"


def test_preferred_language_defaults_to_german_when_unclear(monkeypatch) -> None:
    monkeypatch.setattr(
        "chat_agent.retrieval.load_rules",
        lambda: {"items": [], "deposit_rules": {}},
    )

    assert _preferred_language("???", []) == "de"
    assert "answer in German" in _build_prompt("???", [])


def test_polish_prompt_preserves_facts_and_requires_explanation() -> None:
    prompt = _build_polish_prompt(
        "Wo entsorge ich Gurkenscheiben?",
        [],
        "de",
        ChatResponse(
            response="According to Munich rules, cucumber slices belong in Biotonne.",
            suggested_location=None,
        ),
        "rules_agent",
        {
            "bin": "Biotonne",
            "reasoning": "Fruit and vegetable scraps are organic kitchen waste.",
        },
    )

    assert "editing and translation task" in prompt
    assert "Include a short explanation" in prompt
    assert "Never mix languages" in prompt
    assert "same language as the user's most recent message" in prompt
    assert "fall back to German" in prompt
    assert "Biotonne" in prompt
    assert "Fruit and vegetable scraps are organic kitchen waste." in prompt


def test_polish_system_prompt_requires_translation_without_reclassification() -> None:
    prompt = _build_polish_system_prompt("de")

    assert "Do not classify the item again" in prompt
    assert "Do not change the bin" in prompt
    assert "Never mix languages" in prompt
    assert "SAME" in prompt and "user's most recent message" in prompt
    assert "fall back to German" in prompt


def test_polish_messages_use_system_prompt() -> None:
    messages = _build_polish_messages(
        "Wo entsorge ich ein Sandwich?",
        [],
        "de",
        ChatResponse(response="Organic kitchen and garden waste belongs in Biotonne.", suggested_location=None),
        "local_rules",
        None,
    )

    assert messages[0]["role"] == "system"
    assert "Never mix languages" in messages[0]["content"]
    assert messages[1]["role"] == "user"
    assert "Organic kitchen and garden waste belongs in Biotonne." in messages[1]["content"]


def test_direct_rule_response_uses_electronics_rule_for_headphones(monkeypatch) -> None:
    monkeypatch.setattr(
        "chat_agent.retrieval.load_rules",
        lambda: {
            "items": [
                {
                    "name": "Plastic packaging",
                    "bin": "Wertstoffinseln",
                    "keywords": ["plastic packaging"],
                    "alternatives": [],
                    "notes": ["Use Wertstoffinseln for plastic packaging."],
                },
                {
                    "name": "Small electronic devices",
                    "bin": "Wertstoffhof",
                    "keywords": ["headphones", "Kopfhörer"],
                    "alternatives": ["Retail take-back where legally offered"],
                    "notes": ["Electrical and electronic devices must not be disposed of in Restmuelltonne."],
                },
            ]
        },
    )

    response = _direct_rule_response("Where do I throw away headphones?")

    assert response is not None
    assert "Wertstoffhof" in response.response
    assert "Wertstoffinseln" not in response.response


def test_direct_rule_response_handles_headphones_typo(monkeypatch) -> None:
    monkeypatch.setattr(
        "chat_agent.retrieval.load_rules",
        lambda: {
            "items": [
                {
                    "name": "Residual household waste",
                    "bin": "Restmuelltonne",
                    "alternatives": [],
                    "notes": ["Use Restmuelltonne when no dedicated route exists."],
                },
                {
                    "name": "Small electronic devices",
                    "bin": "Wertstoffhof",
                    "keywords": ["headphones"],
                    "alternatives": ["Retail take-back where legally offered"],
                    "notes": ["Electrical and electronic devices must not be disposed of in Restmuelltonne."],
                },
            ]
        },
    )

    response = _direct_rule_response("Where do I throw away headpones?")

    assert response is not None
    assert "Small electronic devices" in response.response
    assert "Wertstoffhof" in response.response


def test_direct_rule_response_maps_sandwich_to_organic_without_rule_keyword(monkeypatch) -> None:
    monkeypatch.setattr(
        "chat_agent.retrieval.load_rules",
        lambda: {
            "items": [
                {
                    "name": "Organic kitchen and garden waste",
                    "bin": "Biotonne",
                    "alternatives": ["Home composting where suitable"],
                    "notes": ["Use the brown organic bin for fruit and vegetable scraps."],
                },
                {
                    "name": "Residual household waste",
                    "bin": "Restmuelltonne",
                    "alternatives": [],
                    "notes": ["Use Restmuelltonne when no dedicated route exists."],
                },
            ]
        },
    )

    response = _direct_rule_response("Where should I put a sandwich?")

    assert response is not None
    assert "Biotonne" in response.response


def test_relevant_rules_text_current_item_beats_food_history(monkeypatch) -> None:
    monkeypatch.setattr(
        "chat_agent.retrieval.load_rules",
        lambda: {
            "items": [
                {
                    "name": "Organic kitchen and garden waste",
                    "bin": "Biotonne",
                    "alternatives": ["Home composting where suitable"],
                    "notes": ["Use the brown organic bin for fruit and vegetable scraps."],
                },
                {
                    "name": "Small electronic devices",
                    "bin": "Wertstoffhof",
                    "keywords": ["earbuds"],
                    "alternatives": ["Retail take-back where legally offered"],
                    "notes": ["Electrical and electronic devices must not be disposed of in Restmuelltonne."],
                },
            ]
        },
    )

    relevant_rules = _relevant_rules_text(
        "What about earbuds?",
        [
            ConversationMessage(
                role="user",
                content="I have sandwich leftovers, bread, cooked food, and vegetable scraps.",
            ),
            ConversationMessage(role="assistant", content="Food scraps belong in the Biotonne."),
        ],
    )

    rules = json.loads(relevant_rules)

    assert rules[0]["name"] == "Small electronic devices"


def test_relevant_rules_text_typo_current_item_beats_food_history(monkeypatch) -> None:
    monkeypatch.setattr(
        "chat_agent.retrieval.load_rules",
        lambda: {
            "items": [
                {
                    "name": "Organic kitchen and garden waste",
                    "bin": "Biotonne",
                    "alternatives": ["Home composting where suitable"],
                    "notes": ["Use the brown organic bin for fruit and vegetable scraps."],
                },
                {
                    "name": "Small electronic devices",
                    "bin": "Wertstoffhof",
                    "keywords": ["headphones"],
                    "alternatives": ["Retail take-back where legally offered"],
                    "notes": ["Electrical and electronic devices must not be disposed of in Restmuelltonne."],
                },
            ]
        },
    )

    relevant_rules = _relevant_rules_text(
        "What about headpones?",
        [
            ConversationMessage(
                role="user",
                content="I have sandwich leftovers, bread, cooked food, and vegetable scraps.",
            ),
            ConversationMessage(role="assistant", content="Food scraps belong in the Biotonne."),
        ],
    )
    rules = json.loads(relevant_rules)

    assert rules[0]["name"] == "Small electronic devices"


def test_relevant_rules_text_uses_history_for_vague_follow_up(monkeypatch) -> None:
    monkeypatch.setattr(
        "chat_agent.retrieval.load_rules",
        lambda: {
            "items": [
                {
                    "name": "Organic kitchen and garden waste",
                    "bin": "Biotonne",
                    "alternatives": ["Home composting where suitable"],
                    "notes": ["Use the brown organic bin for fruit and vegetable scraps."],
                },
                {
                    "name": "Small electronic devices",
                    "bin": "Wertstoffhof",
                    "keywords": ["earbuds"],
                    "alternatives": ["Retail take-back where legally offered"],
                    "notes": ["Electrical and electronic devices must not be disposed of in Restmuelltonne."],
                },
            ]
        },
    )

    relevant_rules = _relevant_rules_text(
        "Can it go there?",
        [ConversationMessage(role="user", content="I have earbuds.")],
    )

    assert "Small electronic devices" in relevant_rules


def test_relevant_rules_text_uses_rules_content_without_item_specific_keywords(monkeypatch) -> None:
    monkeypatch.setattr(
        "chat_agent.retrieval.load_rules",
        lambda: {
            "items": [
                {
                    "name": "Clothing, shoes, and textiles",
                    "bin": "AWM Altkleidercontainer",
                    "alternatives": ["Wertstoffhof", "Charity collections and second-hand shops"],
                    "notes": ["Only put well-preserved and clean textiles into clothing containers."],
                },
                {
                    "name": "Batteries and button cells",
                    "bin": "Retail battery collection boxes",
                    "alternatives": ["Wertstoffhof", "Giftmobil"],
                    "notes": ["Batteries must not be disposed of in Restmuelltonne."],
                },
            ]
        },
    )

    relevant_rules = _relevant_rules_text("Where can I bring old textiles?", [])

    assert "Clothing, shoes, and textiles" in relevant_rules
    assert "Batteries and button cells" not in relevant_rules


def test_direct_rule_response_does_not_treat_question_can_as_beverage_can(monkeypatch) -> None:
    monkeypatch.setattr(
        "chat_agent.retrieval.load_rules",
        lambda: {
            "items": [
                {
                    "name": "Clothing, shoes, and textiles",
                    "bin": "AWM Altkleidercontainer",
                    "alternatives": ["Wertstoffhof"],
                    "notes": ["Only put well-preserved and clean textiles into clothing containers."],
                },
            ]
        },
    )

    response = _direct_rule_response("Can I throw old clothes in Restmuell?")

    assert response is not None
    assert "AWM Altkleidercontainer" in response.response


def test_common_disposal_questions_are_answered_without_llm(monkeypatch) -> None:
    def fail_if_llm_runs(message, conversation_history):
        raise AssertionError(f"LLM should not run for common disposal question: {message}")

    async def no_rules_agent_response(message, conversation_history, response_language=None):
        return None

    def no_polish(message, conversation_history, response_language, source_response, source_name, source_payload=None):
        return source_response

    monkeypatch.setattr("chat_agent.agent._run_crew", fail_if_llm_runs)
    monkeypatch.setattr("chat_agent.agent._rules_agent_response", no_rules_agent_response)
    monkeypatch.setattr("chat_agent.agent._polish_standardized_response", no_polish)
    monkeypatch.setattr("chat_agent.retrieval.load_rules", _common_test_rules)

    cases = [
        ("Where do I throw away a pizza box?", ["Papiertonne", "Restmuelltonne"]),
        ("How do I dispose of batteries?", ["Retail battery collection boxes", "Wertstoffhof"]),
        ("What bin for broken glass?", ["Restmuelltonne", "Wertstoffhof"]),
        ("Where does a yogurt cup go?", ["Wertstoffinseln"]),
        ("Can I throw old clothes in Restmuell?", ["AWM Altkleidercontainer"]),
        ("What should I do with electronics?", ["Wertstoffhof"]),
        ("Where do LED bulbs go?", ["Wertstoffhof"]),
        ("How should I dispose of medicine?", ["Restmuelltonne"]),
        ("Where does a milk carton go?", ["Wertstoffinseln"]),
        ("Where do coffee grounds go?", ["Biotonne"]),
    ]

    for question, expected_parts in cases:
        response = asyncio.run(ask_waste_question(question, []))
        for expected_part in expected_parts:
            assert expected_part in response.response


def test_standard_local_answer_is_sent_through_polish_step(monkeypatch) -> None:
    captured = {}

    async def no_rules_agent_response(message, conversation_history, response_language=None):
        return None

    def fake_polish(message, conversation_history, response_language, source_response, source_name, source_payload=None):
        captured["message"] = message
        captured["response_language"] = response_language
        captured["source_response"] = source_response.response
        captured["source_name"] = source_name
        return ChatResponse(response="Polished German Groq answer.", suggested_location=None)

    monkeypatch.setattr("chat_agent.agent._rules_agent_response", no_rules_agent_response)
    monkeypatch.setattr("chat_agent.agent._polish_standardized_response", fake_polish)
    monkeypatch.setattr("chat_agent.retrieval.load_rules", _common_test_rules)

    response = asyncio.run(ask_waste_question("Wo entsorge ich ein Sandwich?", []))

    assert response.response == "Polished German Groq answer."
    assert captured["response_language"] == "de"
    assert captured["source_name"] == "local_rules"
    assert "Biotonne" in captured["source_response"]


def test_chat_uses_rules_agent_response_before_local_fallback(monkeypatch) -> None:
    captured = {}

    async def fake_rules_agent_response(message, conversation_history, response_language=None):
        captured["response_language"] = response_language
        captured["conversation_history"] = conversation_history
        return ChatResponse(
            response="According to Munich rules, it belongs in Wertstoffinseln.",
            suggested_location=None,
        )

    def fail_if_llm_runs(message, conversation_history):
        raise AssertionError("LLM should not run when rules-agent provides an answer")

    monkeypatch.setattr("chat_agent.agent._rules_agent_response", fake_rules_agent_response)
    monkeypatch.setattr("chat_agent.agent._run_crew", fail_if_llm_runs)
    monkeypatch.setattr("chat_agent.retrieval.load_rules", lambda: {"items": [], "deposit_rules": {}})

    response = asyncio.run(ask_waste_question("Where does a yogurt cup go?", []))

    assert response.response == "According to Munich rules, it belongs in Wertstoffinseln."
    assert captured["response_language"] == "en"
    assert captured["conversation_history"] == []


def test_unknown_question_returns_safe_fallback_and_logs(monkeypatch, caplog) -> None:
    def fail_if_llm_runs(message, conversation_history):
        raise AssertionError("LLM should not run for an unknown low-confidence item")

    async def no_rules_agent_response(message, conversation_history, response_language=None):
        return None

    def no_polish(message, conversation_history, response_language, source_response, source_name, source_payload=None):
        return source_response

    monkeypatch.setattr("chat_agent.agent._run_crew", fail_if_llm_runs)
    monkeypatch.setattr("chat_agent.agent._rules_agent_response", no_rules_agent_response)
    monkeypatch.setattr("chat_agent.agent._polish_standardized_response", no_polish)
    monkeypatch.setattr("chat_agent.retrieval.load_rules", lambda: {"items": [], "deposit_rules": {}})
    monkeypatch.setattr("chat_agent.agent.settings.groq_api_key", "")

    with caplog.at_level(logging.WARNING, logger="chat_agent.agent"):
        response = asyncio.run(ask_waste_question("Where do I throw away a mystery blob?", []))

    assert "do not have enough Munich-specific rule information" in response.response
    assert "what it is made of" in response.response
    assert "chat_agent_unanswered_low_confidence" in caplog.text
