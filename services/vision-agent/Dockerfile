FROM python:3.11-slim

WORKDIR /app

COPY services/shared/ /app/services/shared/
COPY services/vision-agent/ /app/services/vision-agent/
COPY data/ /app/data/

RUN pip install --no-cache-dir ./services/shared
RUN pip install --no-cache-dir python-multipart>=0.0.9
RUN pip install --no-cache-dir --no-deps ./services/vision-agent

EXPOSE 8001

CMD ["uvicorn", "vision_agent.main:app", "--host", "0.0.0.0", "--port", "8001"]
