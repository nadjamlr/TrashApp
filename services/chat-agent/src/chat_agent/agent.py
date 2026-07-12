import asyncio
import logging
import re

from trashapp_shared.settings import settings

from chat_agent.fallbacks import _fallback_rule_response
from chat_agent.language import _preferred_language
from chat_agent.parsing import _parse_agent_output
from chat_agent.prompts import (
    _build_identifier_prompt,
    _build_polish_messages,
    _build_polish_prompt,
    _build_polish_system_prompt,
    _build_reasoner_prompt,
    _build_smalltalk_messages,
)
from chat_agent.retrieval import _direct_rule_response, _relevant_rules_text
from chat_agent.schemas import ChatResponse, ConversationMessage

logger = logging.getLogger(__name__)

APOSTROPHE_CHARS = "'’‘ʼ`´"

GREETING_KIND_HELLO = "hello"
GREETING_KIND_THANKS = "thanks"
GREETING_KIND_BYE = "bye"
GREETING_KIND_HOW_ARE_YOU = "how_are_you"
GREETING_KIND_WHO_ARE_YOU = "who_are_you"

GREETING_PATTERNS = (
    (
        GREETING_KIND_HELLO,
        r"^\s*(hi|hello|hey|hallo|hej|halloechen|hallöchen|servus|moin|gruezi|grüezi|"
        r"guten\s+(tag|morgen|abend)|good\s+(morning|afternoon|evening))"
        r"(\s+(there|everyone|guys|folks|all|leute))?[\s!.?]*$",
    ),
    (
        GREETING_KIND_THANKS,
        r"^\s*(thanks|thank\s+you|thx|danke|dankeschoen|dankeschön|vielen\s+dank)[\s!.?]*$",
    ),
    (
        GREETING_KIND_BYE,
        r"^\s*(bye|tschuess|tschüss|ciao|auf\s+wiedersehen|goodbye|see\s+you)[\s!.?]*$",
    ),
    (
        GREETING_KIND_HOW_ARE_YOU,
        r"^\s*(how\s+are\s+you|how["
        + APOSTROPHE_CHARS
        + r"]s\s+it\s+going|"
        r"wie\s+geht["
        + APOSTROPHE_CHARS
        + r"]?s|wie\s+geht\s+es(\s+dir)?|wie\s+gehts)[\s!.?]*$",
    ),
    (
        GREETING_KIND_WHO_ARE_YOU,
        r"^\s*(who\s+are\s+you|what\s+can\s+you\s+do|was\s+kannst\s+du|wer\s+bist\s+du)[\s!.?]*$",
    ),
)

GREETING_REPLIES = {
    GREETING_KIND_HELLO: {
        "de": "Hallo! Ich helfe dir bei Fragen zur Müllentsorgung in München. Was möchtest du entsorgen?",
        "en": "Hi! I can help with waste disposal in Munich. What would you like to throw away?",
    },
    GREETING_KIND_THANKS: {
        "de": "Gerne! Wenn du noch etwas entsorgen möchtest, sag Bescheid.",
        "en": "You're welcome! Let me know if you have anything else to dispose of.",
    },
    GREETING_KIND_BYE: {
        "de": "Tschüss! Melde dich, wenn du wieder Fragen zur Müllentsorgung hast.",
        "en": "Bye! Come back anytime for waste disposal questions.",
    },
    GREETING_KIND_HOW_ARE_YOU: {
        "de": "Mir geht's gut, danke! Wobei kann ich dir bei der Müllentsorgung helfen?",
        "en": "I'm doing well, thanks! How can I help you with waste disposal?",
    },
    GREETING_KIND_WHO_ARE_YOU: {
        "de": "Ich bin dein Münchner Müll-Helfer. Beschreibe einen Gegenstand und ich sage dir, in welche Tonne er gehört.",
        "en": "I'm your Munich waste helper. Tell me an item and I'll tell you which bin it goes in.",
    },
}


async def ask_waste_question(message: str, conversation_history: list[ConversationMessage]) -> ChatResponse:
    response_language = _preferred_language(message, conversation_history)

    greeting_response = _greeting_response(message, response_language)
    if greeting_response is not None:
        return greeting_response

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
        return await asyncio.to_thread(
            _smalltalk_fallback_response, message, conversation_history, response_language
        )

    return await asyncio.to_thread(_run_crew, message, conversation_history)


def _greeting_response(message: str, response_language: str) -> ChatResponse | None:
    normalized = message.strip().casefold()
    if not normalized:
        return None

    for kind, pattern in GREETING_PATTERNS:
        if re.search(pattern, normalized):
            language = response_language if response_language in ("de", "en") else "de"
            return ChatResponse(response=GREETING_REPLIES[kind][language], suggested_location=None)

    return None


def _smalltalk_fallback_response(
    message: str,
    conversation_history: list[ConversationMessage],
    response_language: str,
) -> ChatResponse:
    if _llm_available():
        try:
            return _run_smalltalk_with_llm(message, conversation_history, response_language)
        except Exception as exc:
            logger.warning(
                "chat_agent_smalltalk_failed",
                extra={"user_message": message, "error": str(exc)},
            )

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


def _run_smalltalk_with_llm(
    message: str,
    conversation_history: list[ConversationMessage],
    response_language: str,
) -> ChatResponse:
    from litellm import completion

    result = completion(
        **_llm_completion_kwargs(),
        temperature=0.4,
        messages=_build_smalltalk_messages(message, conversation_history, response_language),
    )
    content = result.choices[0].message.content
    return _parse_agent_output(str(content))


def _llm_available() -> bool:
    return settings.chat_use_ollama or bool(settings.groq_api_key)


def _llm_completion_kwargs() -> dict:
    if settings.chat_use_ollama:
        return {
            "model": f"ollama/{settings.ollama_model_text}",
            "api_base": settings.ollama_host,
        }
    return {
        "model": "groq/llama-3.3-70b-versatile",
        "api_key": settings.groq_api_key,
    }


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
    if not _llm_available():
        return source_response

    try:
        return _run_polish_with_llm(
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


def _run_polish_with_llm(
    message: str,
    conversation_history: list[ConversationMessage],
    response_language: str,
    source_response: ChatResponse,
    source_name: str,
    source_payload: dict | None,
) -> ChatResponse:
    from litellm import completion

    result = completion(
        **_llm_completion_kwargs(),
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


def _run_crew(message: str, conversation_history: list[ConversationMessage]) -> ChatResponse:
    try:
        return _run_crew_with_llm(message, conversation_history, _build_llm())
    except Exception as exc:
        if not settings.groq_api_key or "cache_breakpoint" not in str(exc):
            raise
        return _run_crew_with_llm(message, conversation_history, _build_ollama_llm())


def _run_crew_with_llm(message: str, conversation_history: list[ConversationMessage], llm: "LLM") -> ChatResponse:
    from crewai import Agent, Crew, Process, Task

    response_language = _preferred_language(message, conversation_history)

    identifier_agent = Agent(
        role="Munich waste rule matcher",
        goal="Pick the single best matching Munich AWM rule for the user's item, or return unknown.",
        backstory=(
            "You classify items by matching them to Munich AWM waste rules. You only pick rules "
            "that appear in the supplied selected rules. You never invent categories."
        ),
        llm=llm,
        verbose=False,
        allow_delegation=False,
        respect_context_window=False,
    )

    reasoner_agent = Agent(
        role="Munich waste disposal advisor",
        goal="Explain the matched Munich AWM rule to the user in a short, conversational answer.",
        backstory=(
            "You advise Munich residents about waste disposal. You rely on the matcher agent's "
            "pick and you never invent collection points, addresses, or shop names."
        ),
        llm=llm,
        verbose=False,
        allow_delegation=False,
        respect_context_window=False,
    )

    identifier_task = Task(
        description=_build_identifier_prompt(message, conversation_history),
        expected_output=(
            'Only valid JSON: {"category":"...", "bin":"...", "confidence": 0.0, '
            '"reasoning_bullets": ["..."]}'
        ),
        agent=identifier_agent,
    )

    reasoner_task = Task(
        description=_build_reasoner_prompt(message, conversation_history, response_language),
        expected_output='Only valid JSON: {"response":"...", "suggested_location": null}',
        agent=reasoner_agent,
        context=[identifier_task],
    )

    crew = Crew(
        agents=[identifier_agent, reasoner_agent],
        tasks=[identifier_task, reasoner_task],
        process=Process.sequential,
        verbose=False,
    )
    result = crew.kickoff()
    return _parse_agent_output(str(result))


def _build_llm() -> "LLM":
    if settings.chat_use_ollama:
        return _build_ollama_llm()

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
