from trashapp_shared.rules import find_rule_item, get_rules_text
from rules_agent.schemas import RulesResult

__all__ = ["find_rule_item", "get_rules_text", "rules_result_from_item", "unknown_result", "MAX_IMPORTANT_NOTES"]

MAX_IMPORTANT_NOTES = 2


def rules_result_from_item(item: dict) -> RulesResult:
    return RulesResult(
        bin=str(item.get("bin", "unknown")),
        reasoning=f"Matched Munich rule category: {item.get('name', 'unknown')}.",
        deposit=_none_if_no_deposit(item.get("deposit")),
        alternatives=[str(a) for a in item.get("alternatives", [])],
        important_notes=[str(n) for n in item.get("notes", [])][:MAX_IMPORTANT_NOTES],
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
