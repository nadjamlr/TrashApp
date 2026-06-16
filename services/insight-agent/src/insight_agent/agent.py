from crewai import Agent, Crew, LLM, Task

from insight_agent.schemas import InsightRequest, InsightResult
from trashapp_shared.rules import get_rules_text
from trashapp_shared.settings import settings


async def run_agent(request: InsightRequest) -> InsightResult:
    """
    Run the CrewAI agent to generate a contextual recycling fact for a given item.
    The fact is grounded in the Munich waste rules and categorized as Myth, Impact, or Future.
    """
    llm = LLM(model=f"ollama/{settings.ollama_model_text}", base_url=settings.ollama_host)

    agent = Agent(
        role="Munich recycling insight writer",
        goal=(
            "Write a short contextual recycling fact that helps Munich residents learn something useful "
            "about the scanned item."
        ),
        backstory=(
            "You are a careful recycling educator. You only use the supplied Munich waste rules and the item "
            "details to generate one single sentence that feels specific, factual, and helpful."
        ),
        llm=llm,
        verbose=False,
    )

    task = Task(
        description=(
            "Use ONLY the Munich waste disposal rules below as grounding.\n"
            "Generate exactly one single sentence in German that is specific to the scanned item's material and bin.\n"
            "The sentence must be short, contextual, and non-generic (avoid generic recycling trivia).\n"
            "Choose exactly one category from these three values: Myth, Impact, Future.\n"
            "Category meanings and guidelines:\n"
            "- Myth: Myth-buster that clears up common misconceptions (e.g. explaining why 'compostable plastic bags' are prohibited in Munich's organic waste bin / Biotonne)\n"
            "- Impact: Ecological impact showing the consequence of correct or incorrect sorting (e.g. how a greasy pizza box ruins an entire load of waste paper)\n"
            "- Future: Vision of the future explaining what the material can be recycled into (e.g. how aluminum foil is recycled into a bicycle frame)\n\n"
            "Return only valid JSON matching this exact shape:\n"
            '{"fact": "...", "category": "Myth|Impact|Future"}\n\n'
            "RULES:\n"
            "{rules_text}\n\n"
            "ITEM:\n"
            "Label: {label}\n"
            "Material: {material}\n"
            "Bin: {bin}"
        ),
        expected_output="A JSON object with fact and category fields.",
        agent=agent,
        output_pydantic=InsightResult,
    )


    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    result = await crew.kickoff_async(
        inputs={
            "rules_text": get_rules_text(),
            "label": request.label,
            "material": request.material,
            "bin": request.bin,
        }
    )

    if result.pydantic is None:
        raise ValueError(
            f"Agent returned no structured result for label='{request.label}', "
            f"material='{request.material}', bin='{request.bin}'. Raw output: {result.raw}"
        )

    return result.pydantic
