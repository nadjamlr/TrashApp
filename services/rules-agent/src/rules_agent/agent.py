from crewai import Agent, Crew, LLM, Task
from trashapp_shared.settings import settings
from trashapp_shared.rules import get_rules_text
from rules_agent.schemas import RulesRequest, RulesResult


async def run_agent(request: RulesRequest) -> RulesResult:

    llm = LLM(model=f"ollama/{settings.ollama_model_text}", base_url=settings.ollama_host)

    agent = Agent(
        role="Munich waste disposal expert",
        goal="Classify items into the correct Munich disposal bin based on the provided rules.",
        backstory="An expert in Munich waste disposal rules who knows exactly which bin every material belongs in, including deposit information and handling notes.",
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

