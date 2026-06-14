import json
import re

from trashapp_shared.ollama import generate_vision
from trashapp_shared.settings import settings

from vision_agent.schemas import VisionResult

PROMPT = (
    "You are a waste disposal assistant. Look at the image and identify the object.\n"
    "Respond only with a JSON object in this exact format, no other text:\n"
    '{"label": "Dose", "material": "Aluminium", "confidence": 0.92}\n\n'
    "label: the name of the object in German, e.g. 'Dose', 'Glasflasche', 'Karton'\n"
    "material: the primary material in German, e.g. 'Aluminium', 'Glas', 'Papier', 'Kunststoff'\n"
    "confidence: a float between 0.0 and 1.0 indicating how certain you are\n"
    "If you cannot identify the object, return label 'Unbekannt', material 'Unbekannt', confidence 0.0"
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
    print(f"RAW: {repr(response)}", flush=True)
    return await _parse_response(response)
