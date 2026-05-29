FROM python:3.11-slim

WORKDIR /app

COPY services/shared/ /app/services/shared/
COPY services/insight-agent/ /app/services/insight-agent/
COPY data/ /app/data/

RUN pip install --no-cache-dir ./services/shared
RUN pip install --no-cache-dir "crewai>=0.80.0"
RUN pip install --no-cache-dir --no-deps ./services/insight-agent

EXPOSE 8003

CMD ["uvicorn", "insight_agent.main:app", "--host", "0.0.0.0", "--port", "8003"]
