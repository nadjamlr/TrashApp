FROM python:3.11-slim

WORKDIR /app

RUN pip install uv --no-cache-dir

COPY services/ /app/services/
COPY data/ /app/data/

WORKDIR /app/services

RUN uv sync --package vision-agent --no-dev

EXPOSE 8001

CMD ["uv", "run", "--package", "vision-agent", "uvicorn", "vision_agent.main:app", "--host", "0.0.0.0", "--port", "8001"]
