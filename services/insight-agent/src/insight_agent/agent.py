import random
import re
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
        "Korrigiere einen Irrtum. Format: [Falsche Annahme] – [Korrektur].\n"
        "Der Satz MUSS ein '–' oder 'aber' enthalten, das Irrtum und Wahrheit trennt.\n"
        "NICHT: wo es entsorgt wird – das weiß der Nutzer schon.\n"
        "Beispiele:\n"
        "- \"Viele waschen Gläser vor dem Recycling gründlich – ein kurzes Ausspülen reicht völlig aus.\"\n"
        "- \"Kompostierbare Bio-Plastiktüten klingen umweltfreundlich, zersetzen sich in der Biotonne aber nicht richtig.\""
    ),
    "Impact": (
        "Kategorie: Impact\n"
        "Nenne eine konkrete, überraschende Zahl oder Wirkung – nicht nur 'spart Energie', sondern wie viel.\n"
        "NICHT: wo es entsorgt wird – das weiß der Nutzer schon.\n"
        "Beispiele:\n"
        "- \"Eine einzige Aluminiumdose neu herzustellen verbraucht 20-mal mehr Energie als sie zu recyceln.\"\n"
        "- \"Falsch entsorgter Elektroschrott enthält oft mehr Gold pro Tonne als ein Goldminengestein.\""
    ),
    "Future": (
        "Kategorie: Future\n"
        "Beschreibe überraschend, was aus dem recycelten Material tatsächlich werden kann – konkret und unerwartet.\n"
        "NICHT: wo es entsorgt wird – das weiß der Nutzer schon.\n"
        "Beispiele:\n"
        "- \"Aus recycelten PET-Flaschen werden Fleecejacken, Teppiche und sogar neue Flaschen hergestellt.\"\n"
        "- \"Recycelte Aluminiumdosen können innerhalb von 60 Tagen wieder als neue Dosen im Regal stehen.\""
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


_DISPOSAL_INSTRUCTION = re.compile(
    r"(gehört|sollte?|muss|müssen|darf|dürfen|werden|wird)\s.{0,50}"
    r"(entsorgt|recycelt|entsorgen|in die (Bio|Papier|Restmüll|Gelbe)tonne"
    r"|in (der|den|die) (Bio|Papier|Restmüll|Gelbe)tonne"
    r"|im Wertstoffhof|in den Müll|in Wertstoffinseln)",
    re.IGNORECASE,
)


def _is_valid_fact(fact: str, label: str, material: str = "") -> bool:
    if not fact or not isinstance(fact, str):
        return False
    # Reject JSON fragments or curly braces leaking through
    if re.search(r"[{}\[\]]", fact):
        return False
    words = fact.split()
    if len(words) < 5 or len(words) > 30:
        return False
    # Reject facts starting with "Wusstest du" — that's already the card header
    if re.match(r"^Wusstest du", fact, re.IGNORECASE):
        return False
    # Reject facts that are just disposal instructions (ResultCard already shows that)
    if _DISPOSAL_INSTRUCTION.search(fact):
        return False
    # Myth facts that only state the false belief without a correction are incomplete
    if re.match(r"^Viele (glauben|denken|meinen).{0,80}$", fact, re.IGNORECASE):
        if not re.search(r"(–|aber|jedoch|doch|stimmt|tatsächlich)", fact, re.IGNORECASE):
            return False
    # Fact must reference the item or its material (LLMs often use synonyms/material names)
    context_tokens = {
        t.lower()
        for t in re.findall(r"\w+", f"{label} {material}")
        if len(t) > 2
    }
    fact_lower = fact.lower()
    if context_tokens and not any(t in fact_lower for t in context_tokens):
        return False
    return True


async def run_agent(request: InsightRequest) -> InsightResult:
    category: Literal["Myth", "Impact", "Future"] = random.choice(["Myth", "Impact", "Future"])
    llm = LLM(
        model=f"ollama/{settings.ollama_model_text}",
        base_url=settings.ollama_host,
        temperature=0.3,
    )

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
            "Du erfindest keine Wörter und schreibst kein Kauderwelsch. "
            "Du antwortest IMMER auf Deutsch."
        ),
        llm=llm,
        verbose=False,
    )

    task = Task(
        description=(
            "WICHTIG: Antworte ausschließlich auf DEUTSCH.\n\n"
            "Aufgabe: Schreibe genau EINEN kurzen deutschen Satz (5–20 Wörter) über das gescannte Objekt.\n"
            "Der Satz soll überraschend und lehrreich sein – ein echter Fakt, keine Entsorgungsanweisung.\n"
            "VERBOTEN: Beginne den Satz NICHT mit 'Wusstest du' oder einer Frage.\n"
            "VERBOTEN: Erkläre NICHT, wohin das Objekt entsorgt wird – das steht bereits auf der Karte darüber.\n"
            "Der Satz MUSS das Objekt oder sein Material beim Namen nennen.\n"
            "Erfinde keine Wörter. Schreibe grammatikalisch korrektes Deutsch.\n\n"
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

    fact = result.pydantic.fact
    if not _is_valid_fact(fact, request.label, request.material):
        return InsightResult(fact=FALLBACK_FACT, category=FALLBACK_CATEGORY)

    return result.pydantic
