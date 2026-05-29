from fastapi import HTTPException, status

from trashapp_shared.fastapi_app import create_app
from rules_agent.schemas import RulesRequest, RulesResult

app = create_app("rules-agent")


@app.post("/rules/classify", response_model=RulesResult)
async def classify(request: RulesRequest) -> RulesResult:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")
