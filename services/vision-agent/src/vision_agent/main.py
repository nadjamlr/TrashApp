from fastapi import File, HTTPException, UploadFile, status

from trashapp_shared.fastapi_app import create_app
from vision_agent.schemas import VisionResult

app = create_app("vision-agent")


@app.post("/vision/identify", response_model=VisionResult)
async def identify(image: UploadFile = File(...)) -> VisionResult:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")
