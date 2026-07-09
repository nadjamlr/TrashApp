FROM python:3.11-slim

WORKDIR /app

COPY services/shared/ /app/services/shared/
COPY services/locations-service/ /app/services/locations-service/
COPY data/ /app/data/

RUN pip install --no-cache-dir ./services/shared
RUN pip install --no-cache-dir "httpx>=0.27.0"
RUN pip install --no-cache-dir --no-deps ./services/locations-service

EXPOSE 8005

CMD ["uvicorn", "locations_service.main:app", "--host", "0.0.0.0", "--port", "8005"]
