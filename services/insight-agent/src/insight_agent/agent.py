from crewai import Agent, Crew, LLM, Task

from insight_agent.schemas import InsightRequest, InsightResult
from trashapp_shared.rules import find_rule_item
from trashapp_shared.settings import settings

FALLBACK_FACT = "Richtiges Trennen schont Ressourcen und hilft der Umwelt."
FALLBACK_CATEGORY = "Impact"


def _build_rule_context(label: str, material: str, bin: str) -> str:
    rule = find_rule_item(label, material)
    if rule:
        notes = "\n".join(f"- {n}" for n in rule.get("notes", []))
        return (
            f"Name: {rule.get('name', label)}\n"
            f"Tonne: {rule.get('bin', bin)}\n"
            f"Hinweise:\n{notes}"
        )
    return f"Label: {label}\nMaterial: {material}\nTonne: {bin}"


async def run_agent(request: InsightRequest) -> InsightResult:
    llm = LLM(model=f"ollama/{settings.ollama_model_text}", base_url=settings.ollama_host)

    agent = Agent(
        role="Münchener Recycling-Experte",
        goal=(
            "Schreibe einen kurzen, kontextbezogenen Recycling-Hinweis auf DEUTSCH "
            "für Münchener Bürger zum gescannten Gegenstand."
        ),
        backstory=(
            "Du bist ein sorgfältiger Recycling-Pädagoge. Du verwendest ausschließlich die "
            "bereitgestellten Münchener Abfallregeln und die Gegenstandsdetails, um einen einzigen "
            "Satz zu formulieren, der spezifisch, faktisch und hilfreich ist. "
            "Du antwortest IMMER auf Deutsch."
        ),
        llm=llm,
        verbose=False,
    )

    task = Task(
        description=(
            "WICHTIG: Antworte ausschließlich auf DEUTSCH.\n\n"
            "Verwende NUR die untenstehenden Münchener Abfallregeln als Grundlage.\n"
            "Generiere genau einen einzigen deutschen Satz, der spezifisch für das Material und die Tonne des gescannten Gegenstands ist.\n"
            "Der Satz muss kurz, kontextbezogen und nicht generisch sein (vermeide allgemeine Recycling-Floskeln).\n"
            "Wähle genau eine Kategorie aus diesen drei Werten: Myth, Impact, Future.\n"
            "Kategoriebedeutungen:\n"
            "- Myth: Entlarvt einen weit verbreiteten Irrtum (z.B. warum kompostierbare Plastiktüten NICHT in die Biotonne dürfen)\n"
            "- Impact: Ökologische Auswirkung von richtiger oder falscher Trennung (z.B. wie ein öliger Pizzakarton eine ganze Charge Altpapier unbrauchbar macht)\n"
            "- Future: Was aus dem Material recycelt werden kann (z.B. wie Aluminiumfolie zu einem Fahrradrahmen wird)\n\n"
            "Gib NUR gültiges JSON zurück, das genau dieser Form entspricht:\n"
            '{"fact": "...", "category": "Myth|Impact|Future"}\n\n'
            "REGELWERK FÜR DIESEN GEGENSTAND:\n"
            "{rule_context}"
        ),
        expected_output='JSON object: {"fact": "<deutscher Satz>", "category": "Myth|Impact|Future"}',
        agent=agent,
        output_pydantic=InsightResult,
    )

    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    result = await crew.kickoff_async(
        inputs={
            "rule_context": _build_rule_context(request.label, request.material, request.bin),
        }
    )

    if result.pydantic is None:
        return InsightResult(fact=FALLBACK_FACT, category=FALLBACK_CATEGORY)

    return result.pydantic
