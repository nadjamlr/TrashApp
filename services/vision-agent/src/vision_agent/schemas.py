from pydantic import BaseModel, Field


class VisionResult(BaseModel):
    label: str = Field(description="Identified item name, e.g. 'Dose'")
    material: str = Field(description="Primary material, e.g. 'Aluminium'")
    confidence: float = Field(ge=0.0, le=1.0, description="Model confidence between 0 and 1")
