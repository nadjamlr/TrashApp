import json

from chat_agent.fallbacks import _disposal_method_guide_text
from chat_agent.language import _preferred_language
from chat_agent import retrieval
from chat_agent.schemas import ChatResponse, ConversationMessage


def _build_prompt(
    message: str,
    conversation_history: list[ConversationMessage],
    response_language: str | None = None,
) -> str:
    rules = retrieval.load_rules()
    relevant_rules_text = retrieval._relevant_rules_text(message, conversation_history)
    category_names_text = _category_names_text(rules)
    disposal_method_guide_text = _disposal_method_guide_text()
    deposit_rules_text = json.dumps(rules.get("deposit_rules", {}), ensure_ascii=False)
    language = response_language or _preferred_language(message, conversation_history)
    language_name = "English" if language == "en" else "German"

    return (
        "You are a Munich waste disposal advisor.\n"
        "Use the supplied selected rules first. If the selected rules do not cover the item exactly, "
        "use the fallback disposal method guide for broad classification. If neither source gives enough "
        "confidence, say that the available rules do not specify it and suggest checking AWM.\n"
        "You also receive a lightweight list of all available rule category names. Use those names only "
        "to notice that another category might exist; do not invent disposal instructions from a category "
        "name alone.\n"
        "If you are less than 70 percent confident after checking the selected rules and fallback guide, "
        "ask one concise clarifying question that would let you choose the right disposal method. "
        "Do not guess a bin in that case.\n"
        "Never invent street names, station names, shops, districts, collection points, or exact locations.\n"
        "Only mention a concrete place if it appears verbatim in the selected rules.\n"
        "For deposit bottles or cans, say they should be returned to retailers or reverse vending machines.\n"
        "For plastic packaging without deposit, say it goes to Wertstoffinseln.\n"
        "Use the language of the first user message in the conversation. German is the default when "
        f"the language is unclear. For this response, answer in {language_name}. Keep the answer direct.\n"
        "Do not include markdown or text outside JSON.\n"
        "Return only valid JSON matching this shape: "
        '{"response":"...", "suggested_location": null}\n'
        "Set suggested_location to null unless exact coordinates are supplied by the rules.\n\n"
        f"Conversation history:\n{retrieval._format_history(conversation_history)}\n\n"
        f"Current user question:\n{message}\n\n"
        f"Available rule category names:\n{category_names_text}\n\n"
        f"Selected rules:\n{relevant_rules_text}\n\n"
        f"Fallback disposal method guide:\n{disposal_method_guide_text}\n\n"
        f"Deposit rules:\n{deposit_rules_text}"
    )


def _category_names_text(rules: dict) -> str:
    names = [str(item.get("name")) for item in rules.get("items", []) if item.get("name")]
    if not names:
        return "No available rule category names."

    return "\n".join(f"- {name}" for name in names)


def _build_polish_messages(
    message: str,
    conversation_history: list[ConversationMessage],
    response_language: str,
    source_response: ChatResponse,
    source_name: str,
    source_payload: dict | None = None,
) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": _build_polish_system_prompt(response_language)},
        {
            "role": "user",
            "content": _build_polish_prompt(
                message,
                conversation_history,
                response_language,
                source_response,
                source_name,
                source_payload,
            ),
        },
    ]


def _build_polish_system_prompt(response_language: str) -> str:
    language_hint = "English" if response_language == "en" else "German"
    return (
        "You are a Munich waste disposal answer editor. "
        "Your task is to rewrite verified disposal facts into one clear chat answer. "
        "Do not classify the item again. Do not change the bin, disposal route, warnings, alternatives, "
        "or uncertainty supplied by the source facts. "
        "Include the user's item when possible and include a short explanation using only source facts. "
        "Never mix languages, except for official disposal names such as Biotonne, Papiertonne, "
        "Restmuelltonne, Wertstoffinseln, Wertstoffhof, Giftmobil, Pfand, and AWM. "
        "Never invent street names, station names, shops, districts, collection points, or exact locations. "
        "LANGUAGE: Detect the language of the user's most recent message and reply in the SAME "
        f"language, fully translating any source facts. If it is genuinely ambiguous, fall back to {language_hint}. "
        'Return only valid JSON: {"response":"...", "suggested_location": null}'
    )


def _build_polish_prompt(
    message: str,
    conversation_history: list[ConversationMessage],
    response_language: str,
    source_response: ChatResponse,
    source_name: str,
    source_payload: dict | None = None,
) -> str:
    language_name = "English" if response_language == "en" else "German"
    source_payload_text = json.dumps(source_payload or {}, ensure_ascii=False)

    return (
        "Rewrite the verified waste disposal source answer for the user.\n"
        "This is an editing and translation task, not a new classification task.\n"
        "Preserve the disposal method, bin, alternatives, warnings, and uncertainty exactly as supplied.\n"
        "Do not change Restmuelltonne, Biotonne, Papiertonne, Wertstoffinseln, Wertstoffhof, Giftmobil, "
        "or collection-box decisions.\n"
        "Include the item from the user's question when possible.\n"
        "Include a short explanation of why the item belongs there, using only the source facts.\n"
        "Translate all source facts fully into the requested language.\n"
        "Never mix languages, except for official disposal names such as Biotonne, Papiertonne, "
        "Restmuelltonne, Wertstoffinseln, Wertstoffhof, Giftmobil, Pfand, and AWM.\n"
        "If the source answer asks for clarification, keep it as one concise clarifying question.\n"
        "Never invent street names, station names, shops, districts, collection points, or exact locations.\n"
        f"Reply in the same language as the user's most recent message; if it is genuinely "
        f"ambiguous, fall back to {language_name}. Keep the tone friendly, consistent, and direct.\n"
        "Do not include markdown or text outside JSON.\n"
        "Return only valid JSON matching this shape: "
        '{"response":"...", "suggested_location": null}\n'
        "Set suggested_location to null.\n\n"
        f"Conversation history:\n{retrieval._format_history(conversation_history)}\n\n"
        f"Current user question:\n{message}\n\n"
        f"Source name:\n{source_name}\n\n"
        f"Source answer:\n{source_response.response}\n\n"
        f"Source payload:\n{source_payload_text}"
    )


def _build_smalltalk_messages(
    message: str,
    conversation_history: list[ConversationMessage],
    response_language: str,
) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": _build_smalltalk_system_prompt(response_language)},
        {"role": "user", "content": _build_smalltalk_user_prompt(message, conversation_history)},
    ]


def _build_smalltalk_system_prompt(response_language: str) -> str:
    language_hint = "English" if response_language == "en" else "German"
    return (
        "You are a friendly Munich waste disposal chatbot. "
        "For this message, no Munich rule matched the user's input by keyword. You still have "
        "the simplified Munich disposal rules and category names in the user message; use them "
        "to reason about the item's category. Pick exactly one response mode and reply in one "
        "or two short sentences.\n"
        "1. SMALL TALK OR GREETING (hi, thanks, how are you, off-topic questions) -> answer "
        "briefly like a person would and offer to help. Do NOT mention any bin.\n"
        "2. ITEM WHOSE CATEGORY YOU CAN INFER FROM THE SIMPLIFIED RULES -> name the correct "
        "bin from the simplified rules and give one short reason. Do NOT enumerate item names; "
        "reason from the category (what it is made of and what it is for), then map to the bin. "
        "Prefer the most specific applicable rule.\n"
        "3. ITEM WHOSE CATEGORY IS GENUINELY UNCLEAR FROM THE SIMPLIFIED RULES -> ask ONE "
        "targeted clarifying question about the ONE detail that would change the bin. Do NOT "
        "ask about a detail that would not change the bin (for example, if two conditions of "
        "the item map to the same bin according to the rules, do not ask which condition it is).\n"
        "Never invent addresses, shops, districts, collection points, or exact locations. "
        "Never mention bins that don't appear in the simplified rules below.\n"
        "LANGUAGE: Detect the language of the user's most recent message and reply in the SAME "
        f"language. If it is genuinely ambiguous, fall back to {language_hint}.\n"
        "Do not include markdown or text outside JSON. "
        'Return only valid JSON: {"response":"...", "suggested_location": null}'
    )


def _build_smalltalk_user_prompt(
    message: str, conversation_history: list[ConversationMessage]
) -> str:
    rules = retrieval.load_rules()
    category_names_text = _category_names_text(rules)
    disposal_method_guide_text = _disposal_method_guide_text()
    return (
        f"Simplified Munich disposal rules:\n{disposal_method_guide_text}\n\n"
        f"Available rule category names:\n{category_names_text}\n\n"
        f"Conversation history:\n{retrieval._format_history(conversation_history)}\n\n"
        f"Current user message:\n{message}\n\n"
        "Pick exactly one of the three response modes and reply in one or two short sentences. "
        "Return only the JSON described in the system prompt."
    )
