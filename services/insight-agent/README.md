# Insight Agent

Generates a short contextual recycling fact for a scanned item. Results are cached per item type.

**Endpoint:** `POST /insights/generate`
**Port:** 8003
**Model:** Llama 3 via Ollama

## Request

```json
{
  "label": "Dose",
  "material": "Aluminium",
  "bin": "Pfand"
}
```

## Response

```json
{
  "fact": "Recycling aluminium uses around 95% less energy than producing it from raw ore.",
  "category": "energy"
}
```

## Local start

```bash
cd services
uv run --package insight-agent --link-mode=copy uvicorn insight_agent.main:app --port 8003 --reload
```
