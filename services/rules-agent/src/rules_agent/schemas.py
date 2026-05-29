from pydantic import BaseModel, Field


class RulesRequest(BaseModel):
    label: str
    material: str
    city: str = "munich"


class RulesResult(BaseModel):
    bin: str = Field(description="Disposal bin, e.g. 'Pfand', 'Gelbe Tonne', 'Restmüll'")
    reasoning: str = Field(description="Explanation of why this bin applies")
    deposit: str | None = Field(default=None, description="Deposit amount if applicable, e.g. '0.25 EUR'")
    alternatives: list[str] = Field(default_factory=list, description="Alternative disposal options")
    important_notes: list[str] = Field(default_factory=list, description="Additional handling notes")
