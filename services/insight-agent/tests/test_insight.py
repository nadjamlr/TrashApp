from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from insight_agent.main import app
from insight_agent.schemas import InsightResult
from insight_agent.cache import clear_cache

MOCK_RESULT = InsightResult(
    fact="Recycling von Aluminium spart bis zu 95% Energie im Vergleich zur Neuproduktion.",
    category="Future"
)


@pytest.fixture
def client():
    # Provide a FastAPI TestClient for test cases
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_cache():
    # Automatically clear cache before and after each test case to avoid side effects
    clear_cache()
    yield
    clear_cache()


def test_health_endpoint(client):
    # Test that /health responds with 200 and the correct service information
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "insight-agent"}


def test_generate_endpoint_success(client):
    # Test that /insights/generate generates an insight and conforms to the Pydantic schema
    with patch("insight_agent.main.run_agent", new=AsyncMock(return_value=MOCK_RESULT)) as mock_run:
        response = client.post(
            "/insights/generate",
            json={"label": "Alufolie", "material": "Aluminium", "bin": "Wertstoffinseln"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["fact"] == MOCK_RESULT.fact
        assert data["category"] == MOCK_RESULT.category
        mock_run.assert_called_once()


def test_generate_endpoint_cache_hit(client):
    # Test that the cache normalizes keys and returns cached results on duplicate requests
    with patch("insight_agent.main.run_agent", new=AsyncMock(return_value=MOCK_RESULT)) as mock_run:
        # First request (cache miss)
        response_first = client.post(
            "/insights/generate",
            json={"label": "Alufolie", "material": "Aluminium", "bin": "Wertstoffinseln"}
        )
        assert response_first.status_code == 200
        assert mock_run.call_count == 1

        # Second request with differing whitespace and case (cache hit due to normalization)
        response_second = client.post(
            "/insights/generate",
            json={"label": "  ALUFOLIE  ", "material": "Aluminium", "bin": "Wertstoffinseln"}
        )
        assert response_second.status_code == 200
        assert response_second.json()["fact"] == MOCK_RESULT.fact
        
        # CrewAI/Ollama agent should not have been called a second time
        assert mock_run.call_count == 1
