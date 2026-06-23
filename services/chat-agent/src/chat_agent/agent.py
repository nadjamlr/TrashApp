import asyncio
import json
import re

from trashapp_shared.rules import load_rules
from trashapp_shared.settings import settings

from chat_agent.schemas import ChatResponse, ConversationMessage, SuggestedLocation

MIN_SEARCH_TOKEN_LENGTH = 4
MAX_RELEVANT_RULES = 3


def _format_history(conversation_history: list[ConversationMessage]) -> str:
    if not conversation_history:
        return "No previous messages."

    return "\n".join(f"{message.role}: {message.content}" for message in conversation_history)


def _relevant_rules_text(message: str, conversation_history: list[ConversationMessage]) -> str:
    query_text = " ".join([message, *[item.content for item in conversation_history]])
    query_tokens = _search_tokens(query_text)

    if not query_tokens:
        return "No lexical rule matches."

    scored_items = []
    for item in load_rules()["items"]:
        score = len(query_tokens & _search_tokens(_rule_item_text(item)))
        if score:
            scored_items.append((score, item))

    if not scored_items:
        return "No lexical rule matches."

    scored_items.sort(key=lambda scored_item: scored_item[0], reverse=True)
    matches = [item for _, item in scored_items[:MAX_RELEVANT_RULES]]
    return json.dumps(matches, ensure_ascii=False)


def _rule_item_text(item: dict) -> str:
    values = []
    for value in item.values():
        if isinstance(value, list):
            values.extend(str(part) for part in value)
        else:
            values.append(str(value))
    return " ".join(values)


def _search_tokens(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[\wäöüßÄÖÜ]+", text.casefold())
        if len(token) >= MIN_SEARCH_TOKEN_LENGTH
    }


def _parse_agent_output(output: str) -> ChatResponse:
    output = output.strip()
    try:
        payload = json.loads(output)
    except json.JSONDecodeError:
        payload = _extract_json_payload(output)
        if payload is None:
            return ChatResponse(response=output, suggested_location=None)

    location = payload.get("suggested_location")
    suggested_location = None
    if isinstance(location, dict) and location.get("lat") is not None and location.get("lng") is not None:
        suggested_location = SuggestedLocation(lat=location["lat"], lng=location["lng"])

    response = payload.get("response")
    if not isinstance(response, str) or not response.strip():
        response = output.strip()

    return ChatResponse(response=response, suggested_location=suggested_location)


def _extract_json_payload(output: str) -> dict | None:
    json_blocks = re.findall(r"\{.*?\}", output, flags=re.DOTALL)
    for block in json_blocks:
        try:
            payload = json.loads(block)
        except json.JSONDecodeError:
            continue
        if isinstance(payload, dict) and "response" in payload and "suggested_location" in payload:
            return payload
    return None


def _build_prompt(message: str, conversation_history: list[ConversationMessage]) -> str:
    rules = load_rules()
    relevant_rules_text = _relevant_rules_text(message, conversation_history)
    deposit_rules_text = json.dumps(rules.get("deposit_rules", {}), ensure_ascii=False)

    return (
        "You are a Munich waste disposal advisor.\n"
        "Use only the supplied selected rules and deposit rules. If the rules do not cover the item, "
        "say that the available rules do not specify it and suggest checking AWM.\n"
        "Never invent street names, station names, shops, districts, collection points, or exact locations.\n"
        "Only mention a concrete place if it appears verbatim in the selected rules.\n"
        "For deposit bottles or cans, say they should be returned to retailers or reverse vending machines.\n"
        "For plastic packaging without deposit, say it goes to Wertstoffinseln.\n"
        "Answer in the same language as the current user question. Keep the answer direct.\n"
        "Do not include markdown or text outside JSON.\n"
        "Return only valid JSON matching this shape: "
        '{"response":"...", "suggested_location": null}\n'
        "Set suggested_location to null unless exact coordinates are supplied by the rules.\n\n"
        f"Conversation history:\n{_format_history(conversation_history)}\n\n"
        f"Current user question:\n{message}\n\n"
        f"Selected rules:\n{relevant_rules_text}\n\n"
        f"Deposit rules:\n{deposit_rules_text}"
    )


async def ask_waste_question(message: str, conversation_history: list[ConversationMessage]) -> ChatResponse:
    return await asyncio.to_thread(_run_crew, message, conversation_history)


def _run_crew(message: str, conversation_history: list[ConversationMessage]) -> ChatResponse:
    from crewai import Agent, Crew, LLM, Task

    llm = LLM(
        model="groq/llama-3.3-70b-versatile",
        api_key=settings.groq_api_key,
        temperature=0.2,
    )

    advisor_agent = Agent(
        role="Munich waste disposal advisor",
        goal="Answer waste disposal questions using only the selected Munich AWM rules.",
        backstory=(
            "You advise Munich residents about waste disposal. You are strict about using only "
            "the supplied rules and you never invent collection points, addresses, or shop names."
        ),
        llm=llm,
        verbose=False,
        allow_delegation=False,
        respect_context_window=False,
    )

    task = Task(
        description=_build_prompt(message, conversation_history),
        expected_output='Only valid JSON: {"response":"...", "suggested_location": null}',
        agent=advisor_agent,
    )

    crew = Crew(
        agents=[advisor_agent],
        tasks=[task],
        verbose=False,
    )
    result = crew.kickoff()
    return _parse_agent_output(str(result))
