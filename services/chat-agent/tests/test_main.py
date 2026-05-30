from fastapi.testclient import TestClient

from chat_agent.agent import _parse_agent_output, _relevant_rules_text
from chat_agent.main import app
from chat_agent.schemas import ChatResponse


client = TestClient(app)


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


def test_parse_agent_output_extracts_wrapped_json() -> None:
    response = _parse_agent_output(
        'Here is my response:\n{"response": "Use Wertstoffhof.", "suggested_location": null}\nReasoning...'
    )

    assert response == ChatResponse(response="Use Wertstoffhof.", suggested_location=None)


def test_relevant_rules_text_uses_rules_content_without_item_specific_keywords(monkeypatch) -> None:
    monkeypatch.setattr(
        "chat_agent.agent.load_rules",
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
