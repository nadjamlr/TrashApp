import re

from rules_agent.rules import MAX_IMPORTANT_NOTES
from rules_agent.schemas import RulesRequest, RulesResult

FALLBACK_SCENARIOS = [
    {
        "bin": "Papiertonne or Restmuelltonne",
        "patterns": [r"\bpizza\s+(box|carton|cardboard)\b", r"\bpizzakarton\b"],
        "reasoning": (
            "Pizza boxes depend on contamination: clean or only slightly soiled cardboard belongs in "
            "Papiertonne, but greasy or food-stained cardboard belongs in Restmuelltonne."
        ),
        "important_notes": ["Put leftover food in Biotonne before disposing of the box."],
    },
    {
        "bin": "Restmuelltonne or Wertstoffhof",
        "patterns": [
            r"\bbroken\s+(glass|drinking\s+glass|cup|mirror)\b",
            r"\bshattered\s+glass\b",
            r"\bkaputtes\s+glas\b",
            r"\bscherben\b",
        ],
        "reasoning": (
            "Broken glass is not automatically glass packaging. Empty glass bottles and jars without deposit "
            "go to Wertstoffinseln, but broken drinking glasses, mirrors, ceramics, and window glass do not."
        ),
        "important_notes": [
            "Small broken drinking glass usually belongs in Restmuelltonne.",
            "Window glass, mirrors, or larger special glass should go to Wertstoffhof.",
        ],
    },
    {
        "bin": "Wertstoffinseln",
        "patterns": [
            r"\b(yoghurt|yogurt|joghurt)\s+(cup|container|becher)\b",
            r"\bplastic\s+(cup|container|packaging)\b",
        ],
        "reasoning": "A yogurt cup is plastic packaging. Empty plastic packaging goes to Wertstoffinseln in Munich.",
        "important_notes": ["The packaging should be empty, but it does not need to be perfectly rinsed."],
    },
    {
        "bin": "AWM Altkleidercontainer",
        "patterns": [r"\bold\s+(clothes|clothing|shoes|textiles)\b"],
        "reasoning": (
            "Clean and still wearable clothing should use Munich textile collection routes instead of "
            "Restmuelltonne."
        ),
        "alternatives": ["Wertstoffhof", "Charity collections and second-hand shops"],
        "important_notes": ["Only broken or heavily soiled textiles belong in Restmuelltonne."],
    },
]


def fallback_result(request: RulesRequest) -> RulesResult | None:
    query = f"{request.label} {request.material}".casefold()
    for scenario in FALLBACK_SCENARIOS:
        if any(re.search(pattern, query) for pattern in scenario["patterns"]):
            return RulesResult(
                bin=scenario["bin"],
                reasoning=scenario["reasoning"],
                deposit=None,
                alternatives=[str(a) for a in scenario.get("alternatives", [])],
                important_notes=[str(n) for n in scenario.get("important_notes", [])][:MAX_IMPORTANT_NOTES],
                source="fallback",
                confidence=0.85,
            )
    return None
