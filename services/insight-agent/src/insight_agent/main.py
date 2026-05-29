from fastapi import HTTPException, status

from trashapp_shared.fastapi_app import create_app
from insight_agent.schemas import InsightRequest, InsightResult

app = create_app("insight-agent")


@app.post("/insights/generate", response_model=InsightResult)
async def generate(request: InsightRequest) -> InsightResult:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")
