import json
import re

from trashapp_shared.rules import load_rules

from chat_agent.fallbacks import CATEGORY_ALIASES
from chat_agent.language import _preferred_language
from chat_agent.schemas import ChatResponse, ConversationMessage

MIN_SEARCH_TOKEN_LENGTH = 4
MAX_RELEVANT_RULES = 3
CURRENT_MESSAGE_WEIGHT = 6
HISTORY_WEIGHT = 1
ALIAS_MATCH_SCORE = 12
DIRECT_MATCH_THRESHOLD = 8
FUZZY_ALIAS_SCORE = 8
MIN_FUZZY_TOKEN_LENGTH = 6

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


def _direct_rule_response(message: str, response_language: str | None = None) -> ChatResponse | None:
    query = message.casefold()
    if _mentions_deposit_sensitive_container(query):
        return None

    matches = []
    for item in load_rules()["items"]:
        score = _direct_rule_score(query, item)
        if score >= DIRECT_MATCH_THRESHOLD:
            matches.append((score, item))

    if matches:
        matches.sort(key=lambda match: match[0], reverse=True)
        return ChatResponse(
            response=_format_direct_rule_response(message, matches[0][1], response_language),
            suggested_location=None,
        )

    return None


def _mentions_deposit_sensitive_container(query: str) -> bool:
    return bool(
        re.search(
            r"\b("
            r"bottle|bottles|flasche|flaschen|dose|dosen|pfand|"
            r"cans|tin can|aluminium can|aluminum can|drink can|beverage can"
            r")\b",
            query,
        )
    )


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


def _format_direct_rule_response(message: str, item: dict, response_language: str | None = None) -> str:
    bin_name = item["bin"]
    category = item["name"]
    notes = item.get("notes", [])
    alternatives = item.get("alternatives", [])
    german = (response_language or _preferred_language(message, [])) == "de"

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
