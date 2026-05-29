# Rules Agent

Classifies a scanned item into the correct Munich disposal bin and returns reasoning, deposit info, and notes.

**Endpoint:** `POST /rules/classify`
**Port:** 8002
**Model:** Llama 3 via Ollama

## Request

```json
{
  "label": "Dose",
  "material": "Aluminium",
  "city": "munich"
}
```

## Response

```json
{
  "bin": "Pfand",
  "reasoning": "Aluminium cans with deposit marking belong in the Pfand return system.",
  "deposit": "0.25 EUR",
  "alternatives": ["Gelbe Tonne"],
  "important_notes": []
}
```

## Local start

```bash
cd services
uv run --package rules-agent --link-mode=copy uvicorn rules_agent.main:app --port 8002 --reload
```
