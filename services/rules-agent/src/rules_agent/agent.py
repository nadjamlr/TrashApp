import logging

from crewai import Agent, Crew, LLM, Task
from trashapp_shared.settings import settings
from rules_agent.rules import find_rule_item, get_rules_text
from rules_agent.schemas import RulesRequest, RulesResult
from rules_agent.fallbacks import fallback_result
from rules_agent.rules import rules_result_from_item, unknown_result

logger = logging.getLogger("rules_agent")


async def run_agent(request: RulesRequest) -> RulesResult:
    deterministic_result = _deterministic_result(request)
    if deterministic_result is not None:
        return deterministic_result

    logger.info(
        "No deterministic/fallback match for label=%r material=%r city=%r; falling back to LLM",
        request.label, request.material, request.city,
    )

    llm = LLM(model=f"ollama/{settings.ollama_model_text}", base_url=settings.ollama_host)

    agent = Agent(
        role="Munich waste disposal expert",
        goal=(
            "Classify every item into the correct Munich disposal bin "
            "based exclusively on the official AWM rules."
        ),
        backstory=(
            "You are an expert on the Munich waste disposal system of the AWM (Abfallwirtschaftsbetrieb München). "
            "You know all bins: Restmülltonne, Biotonne, Papiertonne, Wertstoffinseln, Wertstoffhof, "
            "Giftmobil, and AWM Altkleidercontainer. "
            "You know when Pfand (deposit) applies, the special rules for e-waste, batteries, and hazardous materials, "
            "and how to distinguish packaging from non-packaging items. "
            "You only give answers that are backed by the provided AWM rules. "
            "All text fields in your response (reasoning, alternatives, important_notes) must be written in German."
        ),
        llm=llm,
        verbose=False,
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
            "1. Match the item to the closest rule category based on its material and label.\n"
            "2. Write a short, precise explanation in German for why this bin is correct.\n"
            "3. List any alternative disposal options from the rules in German.\n"
            "4. Check whether Pfand applies (only for bottles and cans with a Pfand marking). "
            "   Return the amount or null if no deposit applies.\n"
            "5. Add any important handling notes from the rules in German "
            "   (e.g. remove batteries first, do not put in Restmülltonne).\n"
            "6. If the item cannot be matched to any rule category, set bin to 'unknown' and confidence below 0.5.\n"
            "7. Respond with valid JSON only, in exactly this shape:\n"
            '{{'
            '"bin": "...", '
            '"reasoning": "... (in German)", '
            '"deposit": "..." or null, '
            '"alternatives": ["... (in German)"], '
            '"important_notes": ["... (in German)"], '
            '"source": "llm", '
            '"confidence": 0.0'
            '}}'
        ),
        expected_output="A JSON object with bin, reasoning, deposit, alternatives, important_notes, source and confidence.",
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
        logger.warning(
            "LLM returned no structured result for label=%r material=%r; returning unknown",
            request.label, request.material,
        )
        return unknown_result()

    if result.pydantic.bin.strip().casefold() == "unknown":
        logger.warning(
            "LLM classified as unknown for label=%r material=%r", request.label, request.material,
        )

    return result.pydantic


def _deterministic_result(request: RulesRequest) -> RulesResult | None:
    item = find_rule_item(request.label, request.material)
    if item is not None:
        return rules_result_from_item(item)

    return fallback_result(request)
