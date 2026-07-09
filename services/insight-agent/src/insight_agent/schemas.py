from typing import Literal
from pydantic import BaseModel, Field


class InsightRequest(BaseModel):
    label: str
    material: str
    bin: str


class InsightResult(BaseModel):
    fact: str = Field(description="A single contextual fact about recycling this item")
    category: Literal["Myth", "Impact", "Future"] = Field(
        description="Exactly one of: Myth, Impact, Future"
    )
