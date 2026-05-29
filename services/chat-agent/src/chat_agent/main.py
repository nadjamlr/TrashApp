from fastapi import HTTPException, status

from trashapp_shared.fastapi_app import create_app
from chat_agent.schemas import ChatRequest, ChatResponse

app = create_app("chat-agent")


@app.post("/chat/ask", response_model=ChatResponse)
async def ask(request: ChatRequest) -> ChatResponse:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")
