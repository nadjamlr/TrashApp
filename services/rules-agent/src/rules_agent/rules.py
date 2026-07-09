from functools import lru_cache
from pathlib import Path
import re
import unicodedata

import yaml

from trashapp_shared.settings import settings
from rules_agent.schemas import RulesResult

MIN_SEARCH_TOKEN_LENGTH = 3


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
        return None

    matches.sort(reverse=True)
    return matches[0][2]


def _score_rule_item(query: str, material: str, item: dict) -> int:
    score = 0

    # Exact match on the request's material against the item's declared material categories
    if material:
        for mat in item.get("materials", []):
            if _normalize_text(str(mat)) == material:
                score += 20
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
    score += len(query_tokens & searchable_tokens)
    return score


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


def rules_result_from_item(item: dict) -> RulesResult:
    return RulesResult(
        bin=str(item.get("bin", "unknown")),
        reasoning=f"Matched Munich rule category: {item.get('name', 'unknown')}.",
        deposit=_none_if_no_deposit(item.get("deposit")),
        alternatives=[str(a) for a in item.get("alternatives", [])],
        important_notes=[str(n) for n in item.get("notes", [])],
        source="rules",
        confidence=0.95,
    )


def unknown_result() -> RulesResult:
    return RulesResult(
        bin="unknown",
        reasoning=(
            "No confident local Munich rule or deterministic fallback matched this item. "
            "Please clarify the material and whether it is packaging, electronic, hazardous, or food-contaminated."
        ),
        deposit=None,
        alternatives=[],
        important_notes=[],
        source="unknown",
        confidence=0.0,
    )


def _none_if_no_deposit(value: object) -> str | None:
    if value is None:
        return None
    text = str(value)
    if text.casefold() in {"none", "null", ""}:
        return None
    return text
