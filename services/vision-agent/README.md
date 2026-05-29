# Vision Agent

Identifies a household item from a photo and returns its label, material, and confidence score.

**Endpoint:** `POST /vision/identify`
**Port:** 8001
**Model:** LLaVA via Ollama

## Request

Multipart file upload with field name `image`.

## Response

```json
{
  "label": "Dose",
  "material": "Aluminium",
  "confidence": 0.87
}
```

## Local start

```bash
cd services
uv run --package vision-agent --link-mode=copy uvicorn vision_agent.main:app --port 8001 --reload
```
