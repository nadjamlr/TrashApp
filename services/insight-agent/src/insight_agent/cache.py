_insight_cache: dict[str, dict[str, str]] = {}


def normalize_label(label: str) -> str:
    return label.strip().lower()


def get_cached_insight(label: str) -> dict[str, str] | None:
    return _insight_cache.get(normalize_label(label))


def set_cached_insight(label: str, fact: str, category: str) -> None:
    _insight_cache[normalize_label(label)] = {"fact": fact, "category": category}


def clear_cache() -> None:
    _insight_cache.clear()
