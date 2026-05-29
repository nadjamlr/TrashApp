from pydantic import BaseModel, Field


class InsightRequest(BaseModel):
    label: str
    material: str
    bin: str


class InsightResult(BaseModel):
    fact: str = Field(description="A single contextual fact about recycling this item")
    category: str = Field(description="Fact category, e.g. 'energy', 'co2', 'material', 'water'")
