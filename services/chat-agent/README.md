# Chat Agent

Answers free-text waste disposal questions grounded in munich_rules.yaml. Supports multi-turn conversations and returns an optional suggested recycling site location.

**Endpoint:** `POST /chat/ask`
**Port:** 8004
**Model:** Llama 3 via Ollama

## Request

```json
{
  "message": "Was mache ich mit kaputten Kopfhörern?",
  "conversation_history": [
    { "role": "user", "content": "Hallo" },
    { "role": "assistant", "content": "Hallo! Wie kann ich helfen?" }
  ]
}
```

## Response

```json
{
  "response": "Kaputte Kopfhörer gehören zum Elektroschrott ...",
  "suggested_location": { "lat": 48.137, "lng": 11.575 }
}
```

## Local start

```bash
cd services
uv run --package chat-agent --link-mode=copy uvicorn chat_agent.main:app --port 8004 --reload
```
