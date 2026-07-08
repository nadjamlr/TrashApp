import asyncio
import json
import re

from trashapp_shared.rules import load_rules
from trashapp_shared.settings import settings

from chat_agent.schemas import ChatResponse, ConversationMessage, SuggestedLocation

MIN_SEARCH_TOKEN_LENGTH = 4
MAX_RELEVANT_RULES = 3
CURRENT_MESSAGE_WEIGHT = 6
HISTORY_WEIGHT = 1
ALIAS_MATCH_SCORE = 12
DIRECT_MATCH_THRESHOLD = 8
FUZZY_ALIAS_SCORE = 8
MIN_FUZZY_TOKEN_LENGTH = 6

DISPOSAL_METHOD_GUIDE = [
    {
        "method": "Biotonne",
        "use_for": (
            "Organic kitchen and garden waste: fruit and vegetable scraps, cooked or raw food scraps, "
            "bread, coffee grounds, filters, flowers, leaves, grass, and small branches."
        ),
        "do_not_use_for": (
            "Plastic bags, compostable plastic bio-bags, dog feces, cat litter, or small animal litter."
        ),
    },
    {
        "method": "Papiertonne",
        "use_for": "Clean paper, newspapers, envelopes, books without covers, folded cardboard, and paper bags.",
        "do_not_use_for": (
            "Dirty paper, hygiene paper, wallpaper, backing paper from self-adhesive foils, "
            "beverage cartons, or coated dairy cartons."
        ),
    },
    {
        "method": "Wertstoffinseln",
        "use_for": (
            "Empty packaging made of glass, plastic, metal, or composite materials, such as jars, "
            "non-deposit bottles, yoghurt cups, shampoo bottles, cans, aluminium trays, foils, lids, "
            "milk cartons, and beverage cartons."
        ),
        "do_not_use_for": (
            "Deposit bottles or cans, electronics, batteries, ceramics, window glass, mirrors, "
            "drinking glasses, or non-packaging household items unless an exact selected rule says so."
        ),
    },
    {
        "method": "Restmuelltonne",
        "use_for": (
            "Non-recyclable household waste without a dedicated Munich collection route, such as dirty paper, "
            "hygiene products, backing paper, and contaminated small household waste."
        ),
        "do_not_use_for": "Batteries, electronics, problem waste, recyclable packaging, paper, glass, or organic waste.",
    },
    {
        "method": "Wertstoffhof",
        "use_for": (
            "Electronics, large or special recyclable items, bulky waste, rechargeable or lithium batteries, "
            "LED lamps, larger amounts of cardboard or garden cuttings, and items that need special handling."
        ),
        "do_not_use_for": (
            "Normal daily household waste when a closer bin or Wertstoffinsel route is clearly available."
        ),
    },
    {
        "method": "Retail take-back / collection boxes",
        "use_for": (
            "Deposit bottles and cans, batteries in shops that sell batteries, and electronics where legal "
            "retail take-back is offered."
        ),
        "do_not_use_for": "General household waste.",
    },
    {
        "method": "Giftmobil / problem waste",
        "use_for": (
            "Hazardous or problem waste such as chemicals, solvents, pesticides, acids, mercury thermometers, "
            "paint-related hazardous residues, and damaged high-risk batteries when accepted."
        ),
        "do_not_use_for": "Normal residual waste, packaging, paper, or organic waste.",
    },
]

CATEGORY_ALIASES = {
    "Organic kitchen and garden waste": [
        "sandwich",
        "leftovers",
        "food scraps",
        "food waste",
        "meal scraps",
        "cooked food",
        "raw food",
        "bread",
        "bread roll",
        "belegtes brot",
        "brot",
        "broetchen",
        "brötchen",
        "obstrest",
        "gemueserest",
        "gemüserest",
        "speiserest",
        "kaffeesatz",
        "coffee grounds",
    ],
    "Small electronic devices": [
        "airpods",
        "earbuds",
        "headphones",
        "earphones",
        "charger",
        "charging cable",
        "usb cable",
        "remote control",
        "smartphone",
        "phone",
        "tablet",
        "laptop",
        "kopfhoerer",
        "kopfhörer",
        "ladekabel",
        "fernbedienung",
        "handy",
    ],
    "Batteries and button cells": [
        "battery",
        "batteries",
        "button cell",
        "aa battery",
        "aaa battery",
        "batterie",
        "batterien",
        "knopfzelle",
    ],
    "Rechargeable batteries and lithium batteries": [
        "lithium battery",
        "rechargeable battery",
        "power bank",
        "akku",
        "akkus",
        "lithium akku",
    ],
    "Paper and cardboard": [
        "clean cardboard",
        "cardboard box",
        "newspaper",
        "envelope",
        "paper bag",
        "clean paper",
        "karton",
        "pappe",
        "zeitung",
        "briefumschlag",
    ],
    "Residual household waste": [
        "dirty paper",
        "dirty cardboard",
        "used tissue",
        "hygiene paper",
        "diaper",
        "broken mug",
        "ceramic mug",
        "kaputte tasse",
        "keramik",
        "windel",
        "taschentuch",
        "verschmutztes papier",
    ],
    "Plastic packaging": [
        "plastic packaging",
        "yoghurt cup",
        "shampoo bottle",
        "detergent bottle",
        "plastic wrapper",
        "verpackungsfolie",
        "kunststoffverpackung",
        "joghurtbecher",
    ],
    "Metal packaging": [
        "aluminium foil",
        "aluminium tray",
        "metal lid",
        "tin can without deposit",
        "alufolie",
        "aluschale",
        "metalldeckel",
    ],
    "Glass packaging": [
        "glass jar",
        "jar without deposit",
        "jam jar",
        "einwegglas",
        "marmeladenglas",
    ],
    "Clothing, shoes, and textiles": [
        "clothes",
        "clothing",
        "shoes",
        "textiles",
        "shirt",
        "jeans",
        "kleidung",
        "schuhe",
        "textilien",
    ],
    "Bulky waste": [
        "furniture",
        "mattress",
        "carpet",
        "chair",
        "table",
        "sofa",
        "moebel",
        "möbel",
        "matratze",
        "teppich",
    ],
    "Paint, wall paint, and varnish": [
        "paint",
        "wall paint",
        "varnish",
        "farbe",
        "wandfarbe",
        "lack",
    ],
    "Chemicals and hazardous problem waste": [
        "chemicals",
        "solvent",
        "pesticide",
        "acid",
        "mercury thermometer",
        "hazardous waste",
        "chemikalien",
        "loesungsmittel",
        "lösungsmittel",
        "quecksilberthermometer",
    ],
    "Medicines and pharmaceuticals": [
        "medicine",
        "medication",
        "pills",
        "tablets",
        "pharmaceuticals",
        "medikamente",
        "arzneimittel",
        "tabletten",
    ],
    "E-cigarettes and vapes": [
        "vape",
        "vapes",
        "e-cigarette",
        "e-cigarettes",
        "elfbar",
        "e-zigarette",
        "einweg-e-zigarette",
    ],
}

VAGUE_FOLLOW_UP_PATTERNS = (
    r"\bit\b",
    r"\bthat\b",
    r"\bthis\b",
    r"\bthere\b",
    r"\bthose\b",
    r"\bthem\b",
    r"\bdas\b",
    r"\bdamit\b",
    r"\bdahin\b",
    r"\bdiese[rsn]?\b",
    r"\bes\b",
)


def _format_history(conversation_history: list[ConversationMessage]) -> str:
    if not conversation_history:
        return "No previous messages."

    return "\n".join(f"{message.role}: {message.content}" for message in conversation_history)


def _relevant_rules_text(message: str, conversation_history: list[ConversationMessage]) -> str:
    message_tokens = _expanded_search_tokens(message)
    history_tokens = (
        _expanded_search_tokens(" ".join(item.content for item in conversation_history))
        if _should_use_history_for_retrieval(message, conversation_history)
        else set()
    )

    if not message_tokens and not history_tokens:
        return "No lexical rule matches."

    scored_items = []
    for item in load_rules()["items"]:
        rule_tokens = _expanded_rule_tokens(item)
        score = (CURRENT_MESSAGE_WEIGHT * len(message_tokens & rule_tokens)) + (
            HISTORY_WEIGHT * len(history_tokens & rule_tokens)
        )
        score += _alias_score(message, item, CURRENT_MESSAGE_WEIGHT)
        if history_tokens:
            history_text = " ".join(item.content for item in conversation_history)
            score += _alias_score(history_text, item, HISTORY_WEIGHT)
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


def _expanded_search_tokens(text: str) -> set[str]:
    tokens = _search_tokens(text)
    for category, aliases in CATEGORY_ALIASES.items():
        if _contains_any_phrase(text, aliases) or _fuzzy_matches_any_phrase(text, aliases):
            tokens.update(_search_tokens(category))
            tokens.update(_search_tokens(" ".join(aliases)))
    return tokens


def _expanded_rule_tokens(item: dict) -> set[str]:
    tokens = _search_tokens(_rule_item_text(item))
    tokens.update(_search_tokens(" ".join(CATEGORY_ALIASES.get(item.get("name", ""), []))))
    return tokens


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
    category_names_text = _category_names_text(rules)
    disposal_method_guide_text = _disposal_method_guide_text()
    deposit_rules_text = json.dumps(rules.get("deposit_rules", {}), ensure_ascii=False)

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
        "Answer in the same language as the current user question. Keep the answer direct.\n"
        "Do not include markdown or text outside JSON.\n"
        "Return only valid JSON matching this shape: "
        '{"response":"...", "suggested_location": null}\n'
        "Set suggested_location to null unless exact coordinates are supplied by the rules.\n\n"
        f"Conversation history:\n{_format_history(conversation_history)}\n\n"
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


def _disposal_method_guide_text() -> str:
    lines = []
    for entry in DISPOSAL_METHOD_GUIDE:
        lines.append(
            f"- {entry['method']}: use for {entry['use_for']} Do not use for {entry['do_not_use_for']}"
        )
    return "\n".join(lines)


async def ask_waste_question(message: str, conversation_history: list[ConversationMessage]) -> ChatResponse:
    direct_response = _direct_rule_response(message)
    if direct_response is not None:
        return direct_response

    return await asyncio.to_thread(_run_crew, message, conversation_history)


def _direct_rule_response(message: str) -> ChatResponse | None:
    query = message.casefold()
    if any(term in query for term in ("bottle", "can", "flasche", "dose", "pfand")):
        return None

    matches = []
    for item in load_rules()["items"]:
        score = _direct_rule_score(query, item)
        if score >= DIRECT_MATCH_THRESHOLD:
            matches.append((score, item))

    if matches:
        matches.sort(key=lambda match: match[0], reverse=True)
        return ChatResponse(
            response=_format_direct_rule_response(message, matches[0][1]),
            suggested_location=None,
        )

    return None


def _direct_rule_score(query: str, item: dict) -> int:
    score = 0
    for phrase in _rule_phrases(item):
        normalized_phrase = phrase.casefold()
        if _contains_phrase(query, normalized_phrase):
            score += DIRECT_MATCH_THRESHOLD + len(_search_tokens(normalized_phrase))
        elif _fuzzy_matches_phrase(query, normalized_phrase):
            score += FUZZY_ALIAS_SCORE + len(_search_tokens(normalized_phrase))

    score += _alias_score(query, item, CURRENT_MESSAGE_WEIGHT)
    return score


def _matches_rule_keyword(query: str, item: dict) -> bool:
    return any(_contains_phrase(query, phrase.casefold()) for phrase in _rule_phrases(item))


def _rule_phrases(item: dict) -> list[str]:
    return [
        str(item.get("name", "")),
        *[str(keyword) for keyword in item.get("keywords", [])],
        *CATEGORY_ALIASES.get(item.get("name", ""), []),
    ]


def _alias_score(text: str, item: dict, weight: int) -> int:
    aliases = CATEGORY_ALIASES.get(item.get("name", ""), [])
    if _contains_any_phrase(text, aliases):
        return weight * ALIAS_MATCH_SCORE

    if _fuzzy_matches_any_phrase(text, aliases):
        return weight * FUZZY_ALIAS_SCORE

    return 0


def _contains_any_phrase(text: str, phrases: list[str]) -> bool:
    normalized_text = text.casefold()
    return any(_contains_phrase(normalized_text, phrase.casefold()) for phrase in phrases)


def _contains_phrase(text: str, phrase: str) -> bool:
    return re.search(rf"(?<!\w){re.escape(phrase)}(?!\w)", text) is not None


def _fuzzy_matches_any_phrase(text: str, phrases: list[str]) -> bool:
    normalized_text = text.casefold()
    return any(_fuzzy_matches_phrase(normalized_text, phrase.casefold()) for phrase in phrases)


def _fuzzy_matches_phrase(text: str, phrase: str) -> bool:
    phrase_tokens = _search_tokens(phrase)
    if not phrase_tokens:
        return False

    text_tokens = _search_tokens(text)
    return all(_fuzzy_token_in_tokens(phrase_token, text_tokens) for phrase_token in phrase_tokens)


def _fuzzy_token_in_tokens(target: str, tokens: set[str]) -> bool:
    if len(target) < MIN_FUZZY_TOKEN_LENGTH:
        return False

    max_distance = _max_edit_distance(target)
    return any(
        abs(len(target) - len(token)) <= max_distance
        and _levenshtein_distance_at_most(target, token, max_distance)
        for token in tokens
    )


def _max_edit_distance(token: str) -> int:
    if len(token) >= 10:
        return 2
    return 1


def _levenshtein_distance_at_most(left: str, right: str, max_distance: int) -> bool:
    if abs(len(left) - len(right)) > max_distance:
        return False

    previous_row = list(range(len(right) + 1))
    for left_index, left_char in enumerate(left, start=1):
        current_row = [left_index]
        row_min = left_index
        for right_index, right_char in enumerate(right, start=1):
            insertion = current_row[right_index - 1] + 1
            deletion = previous_row[right_index] + 1
            substitution = previous_row[right_index - 1] + (left_char != right_char)
            value = min(insertion, deletion, substitution)
            current_row.append(value)
            row_min = min(row_min, value)

        if row_min > max_distance:
            return False
        previous_row = current_row

    return previous_row[-1] <= max_distance


def _should_use_history_for_retrieval(
    message: str, conversation_history: list[ConversationMessage]
) -> bool:
    if not conversation_history:
        return False

    query = message.casefold()
    if any(
        _contains_phrase(query, phrase.casefold()) or _fuzzy_matches_phrase(query, phrase.casefold())
        for phrase in _all_known_item_phrases()
    ):
        return False

    return any(re.search(pattern, query) for pattern in VAGUE_FOLLOW_UP_PATTERNS)


def _all_known_item_phrases() -> list[str]:
    rules = load_rules()
    phrases = []
    for item in rules.get("items", []):
        phrases.extend(_rule_phrases(item))
    return [phrase for phrase in phrases if phrase]


def _format_direct_rule_response(message: str, item: dict) -> str:
    bin_name = item["bin"]
    category = item["name"]
    notes = item.get("notes", [])
    alternatives = item.get("alternatives", [])
    german = _looks_german(message)

    if german:
        response = f"{category} gehört in München zu {bin_name}."
        if notes:
            response += f" Wichtig: {notes[0]}"
        if alternatives:
            response += f" Alternative: {alternatives[0]}."
        return response

    response = f"{category} belongs in {bin_name} in Munich."
    if notes:
        response += f" Important: {notes[0]}"
    if alternatives:
        response += f" Alternative: {alternatives[0]}."
    return response


def _looks_german(message: str) -> bool:
    return bool(
        re.search(
            r"\b(was|wohin|muss|gehört|gehoert|entsorge|entsorgen|müll|muell|kopfhoerer|kopfhörer)\b",
            message.casefold(),
        )
    )


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


def _build_llm() -> "LLM":
    from crewai import LLM

    if settings.groq_api_key:
        return LLM(
            model="groq/llama-3.3-70b-versatile",
            api_key=settings.groq_api_key,
            temperature=0.2,
            additional_drop_params=["cache_breakpoint"],
        )

    return _build_ollama_llm()


def _build_ollama_llm() -> "LLM":
    from crewai import LLM

    return LLM(
        model=f"ollama/{settings.ollama_model_text}",
        base_url=settings.ollama_host,
        temperature=0.2,
    )
