import pytest

from vision_agent.agent import identify_item
from vision_agent.crew import _parse_crew_output
from vision_agent.schemas import VisionResult


@pytest.mark.asyncio
async def test_high_confidence_skips_crew(monkeypatch):
    crew_called = []

    async def fake_generate_vision(**kwargs):
        return '{"label": "Dose", "material": "Aluminium", "confidence": 0.9}'

    def fake_crew(result, host, model):
        crew_called.append(True)
        return result

    monkeypatch.setattr("vision_agent.agent.generate_vision", fake_generate_vision)
    monkeypatch.setattr("vision_agent.agent.run_verification_crew", fake_crew)

    await identify_item(b"fake-image")

    assert len(crew_called) == 0


@pytest.mark.asyncio
async def test_nicht_erkannt_skips_crew(monkeypatch):
    crew_called = []

    async def fake_generate_vision(**kwargs):
        return '{"label": "Nicht erkannt", "material": "Unbekannt", "confidence": 0.0}'

    def fake_crew(result, host, model):
        crew_called.append(True)
        return result

    monkeypatch.setattr("vision_agent.agent.generate_vision", fake_generate_vision)
    monkeypatch.setattr("vision_agent.agent.run_verification_crew", fake_crew)

    result = await identify_item(b"fake-image")

    assert len(crew_called) == 0
    assert result.label == "Nicht erkannt"


@pytest.mark.asyncio
async def test_low_confidence_calls_crew(monkeypatch):
    crew_called = []

    async def fake_generate_vision(**kwargs):
        return '{"label": "Flasche", "material": "Glas", "confidence": 0.4}'

    def fake_crew(result, host, model):
        crew_called.append(True)
        return result

    monkeypatch.setattr("vision_agent.agent.generate_vision", fake_generate_vision)
    monkeypatch.setattr("vision_agent.agent.run_verification_crew", fake_crew)

    await identify_item(b"fake-image")

    assert len(crew_called) == 1


@pytest.mark.asyncio
async def test_crew_failure_returns_original(monkeypatch):
    async def fake_generate_vision(**kwargs):
        return '{"label": "Flasche", "material": "Glas", "confidence": 0.3}'

    def fake_crew(result, host, model):
        raise RuntimeError("Ollama timeout")

    monkeypatch.setattr("vision_agent.agent.generate_vision", fake_generate_vision)
    monkeypatch.setattr("vision_agent.agent.run_verification_crew", fake_crew)

    result = await identify_item(b"fake-image")

    assert result.label == "Flasche"
    assert result.material == "Glas"


def test_parse_crew_output_valid_json():
    fallback = VisionResult(label="Flasche", material="Glas", confidence=0.4)
    output = '{"label": "Flasche", "material": "Glas", "confidence": 0.4}'

    result = _parse_crew_output(output, fallback)

    assert result.label == "Flasche"
    assert result.material == "Glas"


def test_parse_crew_output_embedded_json():
    fallback = VisionResult(label="Flasche", material="Glas", confidence=0.4)
    output = 'The item is valid. Here is the result: {"label": "Flasche", "material": "Glas", "confidence": 0.4}'

    result = _parse_crew_output(output, fallback)

    assert result.label == "Flasche"


def test_parse_crew_output_garbage_returns_fallback():
    fallback = VisionResult(label="Flasche", material="Glas", confidence=0.4)

    result = _parse_crew_output("I cannot determine this.", fallback)

    assert result.label == "Flasche"
    assert result.material == "Glas"
