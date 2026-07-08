from functools import lru_cache
from pathlib import Path
import re
import unicodedata

import yaml

from trashapp_shared.settings import settings

MIN_SEARCH_TOKEN_LENGTH = 3


@lru_cache(maxsize=1)
def load_rules() -> dict:
    """Load munich_rules.yaml and cache the result for the lifetime of the process."""
    rules_path = Path(settings.rules_path)
    with open(rules_path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_rules_text() -> str:
    """Return the full rules content as a YAML string for use in agent prompts."""
    return yaml.dump(load_rules(), allow_unicode=True, default_flow_style=False)


def find_rule_item(label: str, material: str) -> dict | None:
    """Find the best explicit keyword match in the local rules."""
    query = _normalize_text(f"{label} {material}")
    if not query:
        return None

    matches = []
    for index, item in enumerate(load_rules().get("items", [])):
        score = _score_rule_item(query, item)
        if score:
            matches.append((score, -index, item))

    if not matches:
        return None

    matches.sort(reverse=True)
    return matches[0][2]


def _score_rule_item(query: str, item: dict) -> int:
    score = 0
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
