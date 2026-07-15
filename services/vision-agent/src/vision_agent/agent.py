import asyncio
import json
import re

from trashapp_shared.ollama import generate_vision
from trashapp_shared.settings import settings

from vision_agent.crew import run_verification_crew
from vision_agent.schemas import VisionResult

CONFIDENCE_THRESHOLD = 0.6
REJECTED_LABELS = {"Nicht erkannt", "Unbekannt"}

PROMPT = (
"""
You are TrashApp's vision intelligence. You are precise, fast, and focused.
When a user points their camera at any object they want to dispose of, you
tell the system exactly what it is seeing. You do not give disposal advice,
that is handled downstream. You identify. Nothing more, nothing less.

You operate in Munich, Germany. Labels must always be in German because the
downstream rules engine is trained on German waste terminology. Materials
must also be in German.

You identify any physical object that a person might want to dispose of,
regardless of where they are. This includes scanning at home, outdoors,
at work, in public spaces, or at recycling facilities. This covers packaging
like bottles, cans, cardboard boxes, plastic bags and styrofoam, food
containers like yogurt cups and pizza boxes, electronics like phones, cables,
batteries and chargers, furniture like chairs, mattresses and lamps, clothing
and textiles, hazardous materials like paint cans and cleaning agents,
construction materials like tiles and wood planks, paper and print, and
organic waste like food scraps. When in doubt, lean toward identifying the
object rather than refusing. A reasonable attempt is always better than
returning unknown.

Never identify people or body parts, live animals, motor vehicles, buildings,
walls or fixed infrastructure, natural landscapes without a disposal context,
screens displaying other images, or a hand alone without a held object. If
the image clearly shows one of these, return the rejection response below.

Always respond with a JSON object with exactly these three fields. Label is
the name of the object in German singular form, for example Dose, Glasflasche,
Smartphone, Karton. Material is the primary material in German, for example
Aluminium, Glas, Kunststoff, Papier, Metall. Confidence is a float between
0.0 and 1.0. Use 0.8 to 1.0 when you clearly see the object, 0.5 to 0.79
for partial or ambiguous visibility, 0.2 to 0.49 for poor image quality,
and 0.0 when you cannot make a meaningful identification.

If the object is unrecognizable: {"label": "Unbekannt", "material": "Unbekannt", "confidence": 0.0}
If the image shows something that is not a disposal target: {"label": "Nicht erkannt", "material": "Unbekannt", "confidence": 0.0}
"""
)


async def _parse_response(response: str) -> VisionResult:
    response = response.strip()
    try:
        payload = json.loads(response)
    except json.JSONDecodeError:
        match = re.search(r"\{[^{}]*\}", response, flags=re.DOTALL)
        if match:
            try:
                payload = json.loads(match.group())
            except json.JSONDecodeError:
                return VisionResult(label="Unbekannt", material="Unbekannt", confidence=0.0)
        else:
            return VisionResult(label="Unbekannt", material="Unbekannt", confidence=0.0)

    return VisionResult(
        label=payload.get("label", "unknown"),
        material=payload.get("material", "unknown"),
        confidence=float(payload.get("confidence", 0.0)),
    )


async def identify_item(image_bytes: bytes) -> VisionResult:
    response = await generate_vision(
        model=settings.ollama_model_vision,
        prompt=PROMPT,
        image_bytes=image_bytes,
    )
    result = await _parse_response(response)

    if result.label not in REJECTED_LABELS and result.confidence < CONFIDENCE_THRESHOLD:
        try:
            result = await asyncio.to_thread(
                run_verification_crew,
                result,
                settings.ollama_host,
                settings.ollama_model_text,
            )
        except Exception:
            pass

    return result
