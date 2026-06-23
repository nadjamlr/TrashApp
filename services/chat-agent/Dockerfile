FROM python:3.11-slim

WORKDIR /app

COPY services/shared/ /app/services/shared/
COPY services/chat-agent/ /app/services/chat-agent/
COPY data/ /app/data/

RUN pip install --no-cache-dir ./services/shared
RUN pip install --no-cache-dir "crewai[litellm]>=0.80.0"
RUN pip install --no-cache-dir --no-deps ./services/chat-agent

EXPOSE 8004

CMD ["uvicorn", "chat_agent.main:app", "--host", "0.0.0.0", "--port", "8004"]
