from crewai import Agent, Crew, LLM, Task

from insight_agent.schemas import InsightRequest, InsightResult
from trashapp_shared.rules import get_rules_text
from trashapp_shared.settings import settings


async def run_agent(request: InsightRequest) -> InsightResult:
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
            "Generate exactly one single sentence that is specific to the scanned item and the bin.\n"
            "The sentence must be short, contextual, and non-generic.\n"
            "Choose exactly one category from these three values: Myth, Impact, Future.\n"
            "Category meanings:\n"
            "- Myth: correct common misconceptions\n"
            "- Impact: explain the ecological consequence\n"
            "- Future: explain what the material can become\n\n"
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
