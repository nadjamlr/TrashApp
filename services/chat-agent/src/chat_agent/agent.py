import asyncio
import logging

import httpx

from trashapp_shared.settings import settings

from chat_agent.fallbacks import _fallback_rule_response
from chat_agent.language import _preferred_language
from chat_agent.parsing import _parse_agent_output
from chat_agent.prompts import (
    _build_polish_messages,
    _build_polish_prompt,
    _build_polish_system_prompt,
    _build_prompt,
)
from chat_agent.retrieval import _direct_rule_response, _relevant_rules_text
from chat_agent.schemas import ChatResponse, ConversationMessage

logger = logging.getLogger(__name__)


async def ask_waste_question(message: str, conversation_history: list[ConversationMessage]) -> ChatResponse:
    response_language = _preferred_language(message, conversation_history)

    rules_agent_response = await _rules_agent_response(message, conversation_history, response_language)
    if rules_agent_response is not None:
        return rules_agent_response

    direct_response = _direct_rule_response(message, response_language)
    if direct_response is not None:
        return await _finalize_standardized_response(
            message,
            conversation_history,
            response_language,
            direct_response,
            "local_rules",
        )

    fallback_response = _fallback_rule_response(message, response_language, conversation_history)
    if fallback_response is not None:
        logger.info(
            "chat_agent_fallback_response",
            extra={"user_message": message, "fallback_response": fallback_response.response},
        )
        return await _finalize_standardized_response(
            message,
            conversation_history,
            response_language,
            fallback_response,
            "local_fallback",
        )

    if _relevant_rules_text(message, conversation_history) == "No lexical rule matches.":
        logger.warning(
            "chat_agent_unanswered_low_confidence",
            extra={"user_message": message},
        )
        unknown_response = _unknown_fallback_response(response_language)
        return await _finalize_standardized_response(
            message,
            conversation_history,
            response_language,
            unknown_response,
            "unknown_fallback",
        )

    return await asyncio.to_thread(_run_crew, message, conversation_history)


def _unknown_fallback_response(response_language: str) -> ChatResponse:
    if response_language == "de":
        return ChatResponse(
            response=(
                "Ich habe dafuer nicht genug muenchenspezifische Regel-Informationen. "
                "Kannst du beschreiben, woraus der Gegenstand besteht und ob es Verpackung, "
                "Elektronik, Problemabfall oder mit Essen verschmutzt ist?"
            ),
            suggested_location=None,
        )

    return ChatResponse(
        response=(
            "I do not have enough Munich-specific rule information for that item. "
            "Can you describe what it is made of, whether it is packaging, electronic, hazardous, "
            "or contaminated with food?"
        ),
        suggested_location=None,
    )


async def _rules_agent_response(
    message: str,
    conversation_history: list[ConversationMessage],
    response_language: str | None = None,
) -> ChatResponse | None:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.post(
                f"{settings.rules_agent_url.rstrip('/')}/rules/classify",
                json={"label": message, "material": "", "city": "munich"},
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.info(
            "chat_agent_rules_agent_unavailable",
            extra={"user_message": message, "error": str(exc)},
        )
        return None

    payload = response.json()
    confidence = _numeric_confidence(payload.get("confidence"))
    source = str(payload.get("source", "llm"))
    bin_name = str(payload.get("bin", "")).strip()
    if confidence < 0.7 or not bin_name or bin_name.casefold() == "unknown":
        logger.info(
            "chat_agent_rules_agent_low_confidence",
            extra={"user_message": message, "source": source, "confidence": confidence},
        )
        return None

    source_response = ChatResponse(
        response=_format_rules_agent_response(message, payload, response_language),
        suggested_location=None,
    )
    return await _finalize_standardized_response(
        message,
        conversation_history,
        response_language or _preferred_language(message, conversation_history),
        source_response,
        "rules_agent",
        payload,
    )


async def _finalize_standardized_response(
    message: str,
    conversation_history: list[ConversationMessage],
    response_language: str,
    source_response: ChatResponse,
    source_name: str,
    source_payload: dict | None = None,
) -> ChatResponse:
    return await asyncio.to_thread(
        _polish_standardized_response,
        message,
        conversation_history,
        response_language,
        source_response,
        source_name,
        source_payload,
    )


def _polish_standardized_response(
    message: str,
    conversation_history: list[ConversationMessage],
    response_language: str,
    source_response: ChatResponse,
    source_name: str,
    source_payload: dict | None = None,
) -> ChatResponse:
    if not settings.groq_api_key:
        return source_response

    try:
        return _run_polish_with_groq(
            message,
            conversation_history,
            response_language,
            source_response,
            source_name,
            source_payload,
        )
    except Exception as exc:
        logger.warning(
            "chat_agent_polish_failed",
            extra={"user_message": message, "source": source_name, "error": str(exc)},
        )
        return source_response


def _run_polish_with_groq(
    message: str,
    conversation_history: list[ConversationMessage],
    response_language: str,
    source_response: ChatResponse,
    source_name: str,
    source_payload: dict | None,
) -> ChatResponse:
    from litellm import completion

    result = completion(
        model="groq/llama-3.3-70b-versatile",
        api_key=settings.groq_api_key,
        temperature=0.2,
        messages=_build_polish_messages(
            message,
            conversation_history,
            response_language,
            source_response,
            source_name,
            source_payload,
        ),
    )
    content = result.choices[0].message.content
    return _parse_agent_output(str(content))


def _format_rules_agent_response(message: str, payload: dict, response_language: str | None = None) -> str:
    bin_name = str(payload.get("bin", "")).strip()
    reasoning = str(payload.get("reasoning", "")).strip()
    alternatives = [str(item) for item in payload.get("alternatives", []) if item]
    notes = [str(item) for item in payload.get("important_notes", []) if item]

    if (response_language or _preferred_language(message, [])) == "de":
        response = f"Laut Münchner Regeln gehört das zu {bin_name}."
        if reasoning:
            response += f" {reasoning}"
        if notes:
            response += f" Wichtig: {notes[0]}"
        if alternatives:
            response += f" Alternative: {alternatives[0]}."
        return response

    response = f"According to Munich rules, it belongs in {bin_name}."
    if reasoning:
        response += f" {reasoning}"
    if notes:
        response += f" Important: {notes[0]}"
    if alternatives:
        response += f" Alternative: {alternatives[0]}."
    return response


def _numeric_confidence(value: object) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _run_crew(message: str, conversation_history: list[ConversationMessage]) -> ChatResponse:
    try:
        return _run_crew_with_llm(message, conversation_history, _build_llm())
    except Exception as exc:
        if not settings.groq_api_key or "cache_breakpoint" not in str(exc):
            raise
        return _run_crew_with_llm(message, conversation_history, _build_ollama_llm())


def _run_crew_with_llm(message: str, conversation_history: list[ConversationMessage], llm: "LLM") -> ChatResponse:
    from crewai import Agent, Crew, Task

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
        description=_build_prompt(message, conversation_history, _preferred_language(message, conversation_history)),
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


def _build_llm() -> "LLM":
    if settings.groq_api_key:
        return _build_groq_llm()

    return _build_ollama_llm()


def _build_groq_llm() -> "LLM":
    from crewai import LLM

    return LLM(
        model="groq/llama-3.3-70b-versatile",
        api_key=settings.groq_api_key,
        temperature=0.2,
        additional_drop_params=["cache_breakpoint"],
    )


def _build_ollama_llm() -> "LLM":
    from crewai import LLM

    return LLM(
        model=f"ollama/{settings.ollama_model_text}",
        base_url=settings.ollama_host,
        temperature=0.2,
    )
