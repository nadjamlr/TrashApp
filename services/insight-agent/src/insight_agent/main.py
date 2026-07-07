from trashapp_shared.fastapi_app import create_app
from insight_agent.schemas import InsightRequest, InsightResult
from insight_agent.agent import run_agent
from insight_agent.cache import get_cached_insight, set_cached_insight

app = create_app("insight-agent")


@app.post("/insights/generate", response_model=InsightResult)
async def generate(request: InsightRequest) -> InsightResult:
    """
    Generate a contextual recycling fact for the scanned item.
    Check in-memory cache first to avoid redundant LLM invocations.
    """
    cached = get_cached_insight(request.label, request.material, request.bin)
    if cached is not None:
        return InsightResult(fact=cached["fact"], category=cached["category"])

    result = await run_agent(request)

    set_cached_insight(request.label, request.material, request.bin, result.fact, result.category)

    return result

