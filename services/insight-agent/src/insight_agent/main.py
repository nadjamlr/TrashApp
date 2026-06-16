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
    # Check cache using normalized label (normalization is handled inside cache.py)
    cached = get_cached_insight(request.label)
    if cached is not None:
        return InsightResult(fact=cached["fact"], category=cached["category"])

    # Run the CrewAI agent to generate a new fact
    result = await run_agent(request)

    # Store the result in cache for future requests
    set_cached_insight(request.label, result.fact, result.category)

    return result

