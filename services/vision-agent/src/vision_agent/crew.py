import json
import re

from crewai import Agent, Crew, LLM, Task

from vision_agent.schemas import VisionResult


def run_verification_crew(result: VisionResult, ollama_host: str, model: str) -> VisionResult:
    llm = LLM(
        model=f"ollama/{model}",
        base_url=ollama_host,
        temperature=0.1,
    )

    object_analyst = Agent(
        role="Waste item analyst",
        goal="Determine whether an identified object is a real disposable household item.",
        backstory=(
            "You review the output of a vision model for a Munich waste disposal app. "
            "Your job is to decide whether the label refers to something a person could actually dispose of. "
            "People, body parts, animals, vehicles, buildings, and abstract concepts are not disposable items."
        ),
        llm=llm,
        verbose=False,
        allow_delegation=False,
    )

    material_verifier = Agent(
        role="Material consistency verifier",
        goal="Verify that the identified material is physically plausible for the given item.",
        backstory=(
            "You review vision model output for a waste disposal app. "
            "You check whether the material makes physical sense for the identified label. "
            "Only correct the material if the combination is clearly impossible. "
            "When in doubt, keep the original material."
        ),
        llm=llm,
        verbose=False,
        allow_delegation=False,
    )

    validate_task = Task(
        description=(
            f"The vision model identified this item: label='{result.label}', "
            f"material='{result.material}', confidence={result.confidence}.\n\n"
            "Is this a real physical household item that a person in Munich could dispose of?\n"
            "Reply with exactly one word: VALID or INVALID."
        ),
        expected_output="VALID or INVALID",
        agent=object_analyst,
    )

    verify_material_task = Task(
        description=(
            f"The vision model identified: label='{result.label}', material='{result.material}'.\n\n"
            "The previous analysis has validated whether this is a disposable item.\n"
            "If the previous result was INVALID, return: "
            '{{"label": "Nicht erkannt", "material": "Unbekannt", "confidence": 0.0}}\n\n'
            "If VALID, check whether the material is physically possible for this label. "
            "Only change the material if the combination is clearly impossible. "
            "Return a JSON object with exactly these fields: label, material, confidence."
        ),
        expected_output='JSON object: {"label": "...", "material": "...", "confidence": 0.0}',
        agent=material_verifier,
        context=[validate_task],
    )

    crew = Crew(
        agents=[object_analyst, material_verifier],
        tasks=[validate_task, verify_material_task],
        verbose=False,
    )

    output = str(crew.kickoff()).strip()
    return _parse_crew_output(output, result)


def _parse_crew_output(output: str, fallback: VisionResult) -> VisionResult:
    try:
        payload = json.loads(output)
        return VisionResult(
            label=str(payload.get("label", fallback.label)),
            material=str(payload.get("material", fallback.material)),
            confidence=float(payload.get("confidence", fallback.confidence)),
        )
    except (json.JSONDecodeError, ValueError):
        match = re.search(r"\{[^{}]*\}", output, flags=re.DOTALL)
        if match:
            try:
                payload = json.loads(match.group())
                return VisionResult(
                    label=str(payload.get("label", fallback.label)),
                    material=str(payload.get("material", fallback.material)),
                    confidence=float(payload.get("confidence", fallback.confidence)),
                )
            except (json.JSONDecodeError, ValueError):
                pass
    return fallback
