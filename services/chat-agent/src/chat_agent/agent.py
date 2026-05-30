import asyncio
import json
import re

from trashapp_shared.rules import load_rules
from trashapp_shared.rules import get_rules_text
from trashapp_shared.settings import settings

from chat_agent.schemas import ChatResponse, ConversationMessage, SuggestedLocation

MIN_SEARCH_TOKEN_LENGTH = 4
MAX_RELEVANT_RULES = 3


def _format_history(conversation_history: list[ConversationMessage]) -> str:
    if not conversation_history:
        return "No previous messages."

    return "\n".join(f"{message.role}: {message.content}" for message in conversation_history)


def _relevant_rules_text(message: str, conversation_history: list[ConversationMessage]) -> str:
    query_tokens = _search_tokens(" ".join([message, *[item.content for item in conversation_history]]))
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


def _run_crew(message: str, conversation_history: list[ConversationMessage]) -> ChatResponse:
    from crewai import Agent, Crew, LLM, Task

    rules_text = get_rules_text()
    relevant_rules_text = _relevant_rules_text(message, conversation_history)
    llm = LLM(model=f"ollama/{settings.ollama_model_text}", base_url=settings.ollama_host)

    agent = Agent(
        role="Munich waste disposal advisor",
        goal="Answer Munich waste disposal questions using only the supplied AWM rules.",
        backstory=(
            "You help Munich residents decide how to dispose of waste. "
            "You are careful, concise, and never invent disposal rules that are not present in the supplied rules."
        ),
        llm=llm,
        verbose=False,
    )

    task = Task(
        description=(
            "Use the Munich waste disposal rules below as the only source of truth.\n"
            "If relevant rule matches are provided, prefer them over broad category guesses.\n"
            "First identify the closest matching YAML item by semantic meaning, then answer from that item's bin, alternatives, and notes.\n"
            "Preserve the user's multi-turn context from the conversation history.\n"
            "If the rules do not cover the item, say that the available rules do not specify it and suggest checking AWM.\n"
            "Do not contradict any note in the matched YAML item.\n"
            "Do not introduce materials, item descriptions, or disposal reasons that are absent from the user's question and the YAML rules.\n"
            "Answer in the same language as the current user question and keep the answer direct.\n"
            "Set suggested_location to null unless your answer clearly refers to one specific disposal site with known coordinates.\n"
            "Do not include reasoning, markdown, explanations outside the answer, or text before or after the JSON.\n"
            "Return only valid JSON matching this shape: "
            '{"response":"...", "suggested_location": null}\n'
            "If a specific disposal site is known, suggested_location may instead be "
            '{"lat":48.0,"lng":11.0}.\n\n'
            f"Conversation history:\n{_format_history(conversation_history)}\n\n"
            f"Current user question:\n{message}\n\n"
            f"Relevant rule matches:\n{relevant_rules_text}\n\n"
            f"Munich rules YAML:\n{rules_text}"
        ),
        expected_output="A JSON object with response and suggested_location fields.",
        agent=agent,
    )

    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    result = crew.kickoff()
    return _parse_agent_output(str(result))


async def ask_waste_question(message: str, conversation_history: list[ConversationMessage]) -> ChatResponse:
    return await asyncio.to_thread(_run_crew, message, conversation_history)
