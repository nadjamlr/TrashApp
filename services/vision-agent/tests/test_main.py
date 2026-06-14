import io

import pytest
from fastapi.testclient import TestClient

from vision_agent.agent import _parse_response
from vision_agent.main import app
from vision_agent.schemas import VisionResult

client = TestClient(app)


def test_health_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "vision-agent"}


def test_identify_returns_vision_result(monkeypatch) -> None:
    async def fake_identify_item(image_bytes: bytes) -> VisionResult:
        return VisionResult(label="Dose", material="Aluminium", confidence=0.95)

    monkeypatch.setattr("vision_agent.main.identify_item", fake_identify_item)

    response = client.post(
        "/vision/identify",
        files={"image": ("test.jpg", io.BytesIO(b"fake-image-bytes"), "image/jpeg")},
    )

    assert response.status_code == 200
    assert response.json() == {"label": "Dose", "material": "Aluminium", "confidence": 0.95}


def test_identify_missing_file_returns_422() -> None:
    response = client.post("/vision/identify")

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_parse_response_handles_markdown_wrapped_json() -> None:
    raw = '```json\n{"label": "Glasflasche", "material": "Glas", "confidence": 0.88}\n```'

    result = await _parse_response(raw)

    assert result.label == "Glasflasche"
    assert result.material == "Glas"
    assert result.confidence == 0.88


@pytest.mark.asyncio
async def test_parse_response_falls_back_on_unparseable_output() -> None:
    result = await _parse_response("I cannot identify this object.")

    assert result.label == "Unbekannt"
    assert result.material == "Unbekannt"
    assert result.confidence == 0.0
