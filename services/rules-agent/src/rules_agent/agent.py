import re
from crewai import Agent, Crew, LLM, Task
from trashapp_shared.settings import settings
from trashapp_shared.rules import find_rule_item, get_rules_text
from rules_agent.schemas import RulesRequest, RulesResult

USE_OLLAMA_FALLBACK = False


FALLBACK_SCENARIOS = [
    {
        "bin": "Biotonne",
        "patterns": [
            r"\b(cucumber|cucumbers|gurke|gurken)\b",
            r"\b(vegetable|vegetables|fruit|fruits)\s+(scrap|scraps|slice|slices|peel|peels|leftover|leftovers)\b",
            r"\b(gem[uü]se|obst)(rest|reste|schale|schalen)\b",
        ],
        "reasoning": "Fruit and vegetable scraps are organic kitchen waste and belong in Biotonne in Munich.",
        "alternatives": ["Home composting where suitable"],
        "important_notes": ["Do not put plastic bags or compostable plastic bio-bags into Biotonne."],
    },
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
        "patterns": [r"\bold\s+(clothes|clothing|shoes|textiles)\b", r"\baltkleider\b", r"\balte\s+kleidung\b"],
        "reasoning": (
            "Clean and still wearable clothing should use Munich textile collection routes instead of "
            "Restmuelltonne."
        ),
        "alternatives": ["Wertstoffhof", "Charity collections and second-hand shops"],
        "important_notes": ["Only broken or heavily soiled textiles belong in Restmuelltonne."],
    },
    {
        "bin": "Wertstoffhof",
        "patterns": [
            r"\bled\s+(bulb|bulbs|lamp|lamps|light|lights)\b",
            r"\benergy[-\s]?saving\s+(lamp|lamps|bulb|bulbs)\b",
            r"\bled[-\s]?lampe\b",
        ],
        "reasoning": "LED lamps and energy-saving lamps require special collection and belong at Wertstoffhof.",
        "alternatives": ["Giftmobil for small quantities", "Wertstoffmobil for small quantities", "Retail take-back"],
        "important_notes": ["Do not put LED lamps in Restmuelltonne or glass containers."],
    },
    {
        "bin": "Restmuelltonne",
        "patterns": [r"\b(medicine|medication|pills|tablets)\b", r"\bmedikamente\b", r"\barzneimittel\b"],
        "reasoning": "Medicines belong in Restmuelltonne in Munich.",
        "alternatives": ["Wertstoffhof during problem-waste acceptance times", "Giftmobil"],
        "important_notes": ["Do not flush medicines down the toilet or sink."],
    },
    {
        "bin": "Wertstoffinseln",
        "patterns": [
            r"\b(milk|juice|beverage)\s+carton\b",
            r"\btetra\s?pak\b",
            r"\bmilchkarton\b",
            r"\bgetraenkekarton\b",
            r"\bgetränkekarton\b",
        ],
        "reasoning": "Milk cartons, beverage cartons, and other composite packaging belong at Wertstoffinseln.",
        "important_notes": ["Composite cartons do not belong in Papiertonne. Empty the packaging first."],
    },
]

async def run_agent(request: RulesRequest) -> RulesResult:
    deterministic_result = _deterministic_result(request)
    if deterministic_result is not None:
        return deterministic_result

    if not USE_OLLAMA_FALLBACK:
        return _unknown_result(request)

    llm = LLM(model=f"ollama/{settings.ollama_model_text}", base_url=settings.ollama_host)

    agent = Agent(
        role="Munich waste disposal expert",
        goal="Classify items into the correct Munich disposal bin based on the provided rules.",
        backstory="An expert in Munich waste disposal rules who knows exactly which bin every material belongs in, including deposit information and handling notes.",
        llm=llm,
        verbose=False,  # Keine Ausgaben im Terminal
    ) 

    task = Task(
        description=(
            "Use ONLY the Munich waste disposal rules below as your source of truth.\n\n"
            "RULES:\n"
            "{rules_text}\n\n"
            "ITEM TO CLASSIFY:\n"
            "Label: {label}\n"
            "Material: {material}\n"
            "City: {city}\n\n"
            "Instructions:\n"
            "1. Match the item to the closest category in the rules based on its material.\n"
            "2. Return the correct bin and explain why.\n"
            "3. List any alternative disposal options mentioned in the rules.\n"
            "4. If the item is a bottle or can, check whether Pfand (deposit) applies and return the right amount from deposit_rules.\n"
            "   If no deposit applies, return null.\n"
            "5. Include any important handling notes from the rules.\n"
            "6. Return only valid JSON matching this exact shape:\n"
            '{{ "bin": "...", "reasoning": "...", "deposit": "..." or null, "alternatives": [...], "important_notes": [...] }}'
        ),
        expected_output="A JSON object with bin, reasoning, deposit, alternatives and important_notes.",
        agent=agent,
        output_pydantic=RulesResult,
    )

    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    result = await crew.kickoff_async(inputs={
        "rules_text": get_rules_text(),
        "label": request.label,
        "material": request.material,
        "city": request.city,
    })

    if result.pydantic is None:
        raise ValueError(
            f"Agent returned no structured result for label='{request.label}', "
            f"material='{request.material}'. Raw output: {result.raw}"
        )

    return result.pydantic

def _unknown_result(request: RulesRequest) -> RulesResult:
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


def _deterministic_result(request: RulesRequest) -> RulesResult | None:
    item = find_rule_item(request.label, request.material)
    if item is not None:
        return _rules_result_from_item(item)

    fallback_result = _fallback_result(request)
    if fallback_result is not None:
        return fallback_result

    return None


def _rules_result_from_item(item: dict) -> RulesResult:
    return RulesResult(
        bin=str(item.get("bin", "unknown")),
        reasoning=f"Matched Munich rule category: {item.get('name', 'unknown')}.",
        deposit=_none_if_no_deposit(item.get("deposit")),
        alternatives=[str(alternative) for alternative in item.get("alternatives", [])],
        important_notes=[str(note) for note in item.get("notes", [])],
        source="rules",
        confidence=0.95,
    )


def _fallback_result(request: RulesRequest) -> RulesResult | None:
    query = f"{request.label} {request.material}".casefold()
    for scenario in FALLBACK_SCENARIOS:
        if any(re.search(pattern, query) for pattern in scenario["patterns"]):
            return RulesResult(
                bin=scenario["bin"],
                reasoning=scenario["reasoning"],
                deposit=None,
                alternatives=[str(alternative) for alternative in scenario.get("alternatives", [])],
                important_notes=[str(note) for note in scenario.get("important_notes", [])],
                source="fallback",
                confidence=0.85,
            )

    return None


def _none_if_no_deposit(value: object) -> str | None:
    if value is None:
        return None

    text = str(value)
    if text.casefold() in {"none", "null", ""}:
        return None

    return text
