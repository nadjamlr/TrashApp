from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from rules_agent.main import app
from rules_agent.schemas import RulesResult

MOCK_RESULT = RulesResult(
    bin="Wertstoffinseln",
    reasoning="Aluminium cans are metal packaging and belong at Wertstoffinseln.",
    deposit="0.25 EUR",
    alternatives=["Wertstoffhof"],
    important_notes=["Empty the can before disposal."],
)


@pytest.fixture
def client():
    return TestClient(app)


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_classify_returns_rules_result(client):
    with patch("rules_agent.main.run_agent", new=AsyncMock(return_value=MOCK_RESULT)):
        response = client.post(
            "/rules/classify",
            json={"label": "Dose", "material": "Aluminium", "city": "munich"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["bin"] == "Wertstoffinseln"
    assert "reasoning" in data
    assert isinstance(data["alternatives"], list)
    assert isinstance(data["important_notes"], list)
