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
    with patch("insight_agent.main.run_agent", new=AsyncMock(return_value=MOCK_RESULT)) as mock_run:
        client.post(
            "/insights/generate",
            json={"label": "Alufolie", "material": "Aluminium", "bin": "Wertstoffinseln"}
        )
        assert mock_run.call_count == 1

        # Same label+material+bin with different casing/whitespace → cache hit
        response_second = client.post(
            "/insights/generate",
            json={"label": "  ALUFOLIE  ", "material": "Aluminium", "bin": "Wertstoffinseln"}
        )
        assert response_second.status_code == 200
        assert response_second.json()["fact"] == MOCK_RESULT.fact
        assert mock_run.call_count == 1


def test_cache_miss_on_different_material(client):
    with patch("insight_agent.main.run_agent", new=AsyncMock(return_value=MOCK_RESULT)) as mock_run:
        client.post(
            "/insights/generate",
            json={"label": "Flasche", "material": "Glas", "bin": "Altglas"}
        )
        client.post(
            "/insights/generate",
            json={"label": "Flasche", "material": "Plastik", "bin": "Gelbe Tonne"}
        )
        # Different material/bin → two separate agent calls
        assert mock_run.call_count == 2
