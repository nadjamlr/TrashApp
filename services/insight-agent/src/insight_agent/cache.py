MAX_INSIGHT_CACHE_ENTRIES = 1000

_insight_cache: dict[str, dict[str, str]] = {}


def _cache_key(label: str, material: str, bin: str) -> str:
    return f"{label.strip().lower()}|{material.strip().lower()}|{bin.strip().lower()}"


def get_cached_insight(label: str, material: str, bin: str) -> dict[str, str] | None:
    return _insight_cache.get(_cache_key(label, material, bin))


def set_cached_insight(label: str, material: str, bin: str, fact: str, category: str) -> None:
    key = _cache_key(label, material, bin)
    if key not in _insight_cache and len(_insight_cache) >= MAX_INSIGHT_CACHE_ENTRIES:
        _insight_cache.pop(next(iter(_insight_cache)))
    _insight_cache[key] = {"fact": fact, "category": category}


def clear_cache() -> None:
    _insight_cache.clear()
