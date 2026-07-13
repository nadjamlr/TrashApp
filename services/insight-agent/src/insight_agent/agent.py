import random
from typing import Literal

from crewai import Agent, Crew, LLM, Task

from insight_agent.schemas import InsightRequest, InsightResult
from trashapp_shared.rules import find_rule_item
from trashapp_shared.settings import settings

FALLBACK_FACT = "Richtiges Trennen schont Ressourcen und hilft der Umwelt."
FALLBACK_CATEGORY = "Impact"

_CATEGORY_INSTRUCTIONS: dict[str, str] = {
    "Myth": (
        "Kategorie: Myth\n"
        "Korrigiere einen häufigen Irrtum über die Entsorgung dieses Objekts.\n"
        "Beispiel: \"Viele denken, Plastikflaschen gehören in den Müll – sie kommen in die Wertstoffinsel.\""
    ),
    "Impact": (
        "Kategorie: Impact\n"
        "Erkläre die ökologische Wirkung von richtigem oder falschem Recycling dieses Objekts.\n"
        "Beispiel: \"Eine recycelte Glasflasche spart bis zu 30 % Energie gegenüber neuer Produktion.\""
    ),
    "Future": (
        "Kategorie: Future\n"
        "Beschreibe, was nach dem Recycling aus dem Material dieses Objekts werden kann.\n"
        "Beispiel: \"Aus alten Zeitungen wird neues Zeitungspapier hergestellt.\""
    ),
}


def _build_rule_context(label: str, material: str) -> str:
    rule = find_rule_item(label, material)
    if rule:
        notes = "\n".join(f"- {n}" for n in rule.get("notes", []))
        return (
            f"Gescanntes Objekt: {label} (Material: {material})\n"
            f"Entsorgung: {rule.get('bin', 'unbekannt')}\n"
            f"Regeln für diese Kategorie:\n{notes}"
        )
    return f"Gescanntes Objekt: {label} (Material: {material})"


async def run_agent(request: InsightRequest) -> InsightResult:
    category: Literal["Myth", "Impact", "Future"] = random.choice(["Myth", "Impact", "Future"])
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
            "Der Satz muss das Objekt beim Namen nennen.\n\n"
            "{category_instruction}\n\n"
            f"Die Kategorie im JSON muss exakt \"{category}\" sein.\n"
            "Gib NUR gültiges JSON zurück:\n"
            '{"fact": "...", "category": "' + category + '"}\n\n'
            "REGELWERK FÜR DIESEN GEGENSTAND:\n"
            "{rule_context}"
        ),
        expected_output=f'JSON object: {{"fact": "<kurzer deutscher Satz>", "category": "{category}"}}',
        agent=agent,
        output_pydantic=InsightResult,
    )

    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    result = await crew.kickoff_async(
        inputs={
            "rule_context": _build_rule_context(request.label, request.material),
            "category_instruction": _CATEGORY_INSTRUCTIONS[category],
        }
    )

    if result.pydantic is None:
        return InsightResult(fact=FALLBACK_FACT, category=FALLBACK_CATEGORY)

    return result.pydantic
