from functools import lru_cache
from pathlib import Path
import logging
import re
import unicodedata

import yaml

from trashapp_shared.settings import settings

logger = logging.getLogger("trashapp_shared.rules")

MIN_SEARCH_TOKEN_LENGTH = 3
# Minimum length of the *shorter* token before it's allowed to count as a partial/
# compound match against a longer token. Keeps regular DE/EN pluralization (which
# just appends a suffix, so the singular is a literal prefix of the plural - e.g.
# "Flasche"/"Flaschen", "bottle"/"bottles") working, while staying high enough to
# avoid coincidental short-prefix collisions between unrelated words (e.g. stemming
# "broken" down to "brok" used to falsely match the keyword "Brokkoli").
MIN_PARTIAL_MATCH_LENGTH = 5


@lru_cache(maxsize=1)
def load_rules() -> dict:
    rules_path = Path(settings.rules_path)
    with open(rules_path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_rules_text() -> str:
    return yaml.dump(load_rules(), allow_unicode=True, default_flow_style=False)


def find_rule_item(label: str, material: str) -> dict | None:
    query = _normalize_text(f"{label} {material}")
    normalized_material = _normalize_text(material)
    if not query:
        return None

    matches = []
    for index, item in enumerate(load_rules().get("items", [])):
        score = _score_rule_item(query, normalized_material, item)
        if score:
            matches.append((score, -index, item))

    if not matches:
        logger.info("No local rule match for label=%r material=%r", label, material)
        return None

    matches.sort(reverse=True)
    return matches[0][2]


def _score_rule_item(query: str, material: str, item: dict) -> int:
    score = 0

    # Match on the request's material against the item's declared material categories.
    if material:
        for mat in item.get("materials", []):
            normalized_mat = _normalize_text(str(mat))
            if normalized_mat == material:
                score += 20
                break
            if _is_partial_match(normalized_mat, material):
                score += 18
                break

    for keyword in item.get("keywords", []):
        normalized_keyword = _normalize_text(str(keyword))
        if _contains_phrase(query, normalized_keyword):
            score += 10 + len(_search_tokens(normalized_keyword))

    name = _normalize_text(str(item.get("name", "")))
    if _contains_phrase(query, name):
        score += 6

    query_tokens = _search_tokens(query)
    searchable_tokens = _search_tokens(_rule_search_text(item))
    score += _token_overlap_score(query_tokens, searchable_tokens)
    return score


def _token_overlap_score(query_tokens: set[str], searchable_tokens: set[str]) -> int:
    """Exact token matches score full points; remaining tokens still get credit if
    one contains the other as a whole word, so plurals ("Flaschen" containing
    "Flasche") and German compounds ("Zeitungspapier" containing "papier") match
    their component keyword without a destructive stemmer that risks collisions."""
    exact = query_tokens & searchable_tokens
    score = len(exact)

    remaining_query = query_tokens - exact
    remaining_searchable = searchable_tokens - exact
    for query_token in remaining_query:
        for searchable_token in remaining_searchable:
            if _is_partial_match(query_token, searchable_token):
                score += 1
                break
    return score


def _is_partial_match(token_a: str, token_b: str) -> bool:
    shorter, longer = sorted((token_a, token_b), key=len)
    return len(shorter) >= MIN_PARTIAL_MATCH_LENGTH and shorter in longer


def _rule_search_text(item: dict) -> str:
    values = [str(item.get("name", ""))]
    values.extend(str(keyword) for keyword in item.get("keywords", []))
    values.extend(str(mat) for mat in item.get("materials", []))
    return " ".join(values)


def _contains_phrase(text: str, phrase: str) -> bool:
    if not phrase:
        return False
    return re.search(rf"(?<!\w){re.escape(phrase)}(?!\w)", text) is not None


def _search_tokens(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]+", _normalize_text(text))
        if len(token) >= MIN_SEARCH_TOKEN_LENGTH
    }


def _normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text.casefold())
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", ascii_text).strip()
