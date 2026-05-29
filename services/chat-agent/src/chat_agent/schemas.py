from pydantic import BaseModel, Field


class ConversationMessage(BaseModel):
    role: str = Field(description="'user' or 'assistant'")
    content: str


class SuggestedLocation(BaseModel):
    lat: float
    lng: float


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[ConversationMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    response: str
    suggested_location: SuggestedLocation | None = None
