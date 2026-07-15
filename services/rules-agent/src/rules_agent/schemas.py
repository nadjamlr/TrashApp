from typing import Literal

from pydantic import BaseModel, Field


class RulesRequest(BaseModel):
    label: str
    material: str
    city: str = "munich"
    language: Literal["de", "en"] = "en"


class RulesResult(BaseModel):
    bin: str = Field(description="Disposal bin, e.g. 'Pfand', 'Gelbe Tonne', 'Restmüll'")
    reasoning: str = Field(description="Explanation of why this bin applies")
    deposit: str | None = Field(default=None, description="Deposit amount if applicable, e.g. '0.25 EUR'")
    alternatives: list[str] = Field(default_factory=list, description="Alternative disposal options")
    important_notes: list[str] = Field(default_factory=list, description="Additional handling notes")
    source: str = Field(default="llm", description="Where the classification came from: rules, fallback, llm, or unknown")
    confidence: float = Field(default=0.7, ge=0.0, le=1.0, description="Classifier confidence from 0.0 to 1.0")
