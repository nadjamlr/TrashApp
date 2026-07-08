# Chat Agent

The chat agent answers free-text waste disposal questions for Munich. It is the conversation layer between the mobile chatbot UI and the backend waste-disposal logic.

**Endpoint:** `POST /chat/ask`
**Port:** `8004`

## How It Works

The chat agent does not classify waste only from general LLM knowledge. It uses a layered flow:

1. Ask the rules agent first via `/rules/classify`.
2. If the rules agent returns a confident result, format that verified result for the user.
3. If the rules agent is unavailable or low-confidence, try local direct rule matching against `munich_rules.yaml`.
4. If there is no direct match, use compact local fallback guidance for common disposal methods.
5. If the item is still unclear, ask a clarifying question instead of guessing.
6. If `GROQ_API_KEY` is configured, polish/translate the verified answer with Groq.
7. If no Groq key is configured, return the verified local/rules answer directly.
8. The CrewAI/Ollama path remains as a final fallback for broader free-text handling.

The answer language follows the first user message in the conversation. German is the default when the language is unclear.

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
  "response": "Kaputte Kopfhörer gehören in München zum Wertstoffhof, weil elektronische Geräte nicht in die Restmülltonne dürfen.",
  "suggested_location": null
}
```

## Configuration

Environment variables are read through `trashapp_shared.settings`.

```env
RULES_AGENT_URL=http://rules-agent:8002
GROQ_API_KEY=
OLLAMA_HOST=http://host.docker.internal:11434
OLLAMA_MODEL_TEXT=llama3
RULES_PATH=/data/munich_rules.yaml
```

Notes:

- `RULES_AGENT_URL` points to the rules agent used for classification.
- `GROQ_API_KEY` is optional. When present, Groq is used to polish and translate verified answers.
- Ollama is used by the CrewAI fallback path.
- `RULES_PATH` points to the Munich rules dataset used for local rule retrieval.

## Local Start

```bash
cd services
uv run --package chat-agent --link-mode=copy uvicorn chat_agent.main:app --port 8004 --reload
```

## Test

```bash
cd services
uv run --package chat-agent python -m pytest chat-agent/tests
```

## Mobile Client

The mobile app calls this service through:

```text
apps/mobile/services/chatService.ts
```

The chatbot screen itself lives in:

```text
apps/mobile/app/(tabs)/chatbot.tsx
```

Reusable chat UI pieces are in:

```text
apps/mobile/components/chat/
```
