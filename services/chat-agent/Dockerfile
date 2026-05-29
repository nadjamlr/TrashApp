FROM python:3.11-slim

WORKDIR /app

RUN pip install uv --no-cache-dir

COPY services/ /app/services/
COPY data/ /app/data/

WORKDIR /app/services

RUN uv sync --package chat-agent --no-dev

EXPOSE 8004

CMD ["uv", "run", "--package", "chat-agent", "uvicorn", "chat_agent.main:app", "--host", "0.0.0.0", "--port", "8004"]
