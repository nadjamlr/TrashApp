FROM python:3.11-slim

WORKDIR /app

RUN pip install uv --no-cache-dir

COPY services/ /app/services/
COPY data/ /app/data/

WORKDIR /app/services

RUN uv sync --package locations-service --no-dev

EXPOSE 8005

CMD ["uv", "run", "--package", "locations-service", "uvicorn", "locations_service.main:app", "--host", "0.0.0.0", "--port", "8005"]
