# Use a fixed, slim python base image
FROM python:3.11-slim

# Install uv package manager inside the container
COPY --from=ghcr.io/astral-sh/uv:0.11.27 /uv /uvx /bin/

WORKDIR /app

# Copy Python services workspace configuration and source code
COPY services/ /app/services/
COPY data/ /app/data/

# Sync workspace dependencies frozen for the insight-agent package
WORKDIR /app/services
RUN uv sync --frozen --package insight-agent

EXPOSE 8003

# Execute the FastAPI application via uvicorn inside the uv environment
CMD ["uv", "run", "--package", "insight-agent", "uvicorn", "insight_agent.main:app", "--host", "0.0.0.0", "--port", "8003"]
