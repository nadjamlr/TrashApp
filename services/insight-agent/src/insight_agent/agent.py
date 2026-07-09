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
            f"Gescanntes Objekt: {label} (Material: {material})\n"
            f"Entsorgung: {rule.get('bin', bin)}\n"
            f"Regeln für diese Kategorie:\n{notes}"
        )
    return f"Gescanntes Objekt: {label} (Material: {material})\nTonne: {bin}"


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
            "Aufgabe: Schreibe genau EINEN kurzen deutschen Satz (max. 20 Wörter) über das gescannte Objekt.\n"
            "Verwende NUR die untenstehenden Regelinformationen.\n"
            "Der Satz muss das Objekt beim Namen nennen und auf seine korrekte Entsorgung eingehen.\n\n"
            "Kategorie – wähle genau einen Wert:\n"
            "- Myth: Korrigiert einen häufigen Irrtum\n"
            "- Impact: Ökologische Wirkung\n"
            "- Future: Wiederverwendung des Materials\n\n"
            "Beispiele für gute Antworten:\n"
            '{"fact": "Leere Konservendosen gehören in den Gelben Sack, nicht in die Restmülltonne.", "category": "Myth"}\n'
            '{"fact": "Eine recycelte Glasflasche spart bis zu 30 % Energie gegenüber neuer Produktion.", "category": "Impact"}\n'
            '{"fact": "Aus alten Zeitungen wird neues Zeitungspapier hergestellt.", "category": "Future"}\n\n'
            "Gib NUR gültiges JSON zurück:\n"
            '{"fact": "...", "category": "Myth|Impact|Future"}\n\n'
            "REGELWERK FÜR DIESEN GEGENSTAND:\n"
            "{rule_context}"
        ),
        expected_output='JSON object: {"fact": "<kurzer deutscher Satz>", "category": "Myth|Impact|Future"}',
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
