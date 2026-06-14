from fastapi import File, UploadFile

from trashapp_shared.fastapi_app import create_app
from vision_agent.agent import identify_item
from vision_agent.schemas import VisionResult

app = create_app("vision-agent")


@app.post("/vision/identify", response_model=VisionResult)
async def identify(image: UploadFile = File(...)) -> VisionResult:
    image_bytes = await image.read()
    return await identify_item(image_bytes)
