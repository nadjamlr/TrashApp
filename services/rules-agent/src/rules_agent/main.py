from trashapp_shared.fastapi_app import create_app
from rules_agent.schemas import RulesRequest, RulesResult
from rules_agent.agent import run_agent

app = create_app("rules-agent")


@app.post("/rules/classify", response_model=RulesResult)
async def classify(request: RulesRequest) -> RulesResult:
    return await run_agent(request)
