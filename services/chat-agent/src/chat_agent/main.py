from trashapp_shared.fastapi_app import create_app

from chat_agent.agent import ask_waste_question
from chat_agent.schemas import ChatRequest, ChatResponse

app = create_app("chat-agent")


@app.post("/chat/ask", response_model=ChatResponse)
async def ask(request: ChatRequest) -> ChatResponse:
    return await ask_waste_question(request.message, request.conversation_history)
