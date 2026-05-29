import base64

import httpx

from trashapp_shared.settings import settings


async def generate_text(model: str, prompt: str) -> str:
    """Send a text prompt to Ollama and return the response string."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{settings.ollama_host}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
        )
        response.raise_for_status()
        return response.json()["response"]


async def generate_vision(model: str, prompt: str, image_bytes: bytes) -> str:
    """Send an image and a text prompt to Ollama and return the response string."""
    image_b64 = base64.b64encode(image_bytes).decode()
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{settings.ollama_host}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "images": [image_b64],
                "stream": False,
            },
        )
        response.raise_for_status()
        return response.json()["response"]
