FROM python:3.11-slim

# Install system dependencies needed for node/prisma engine
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definitions
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Prisma schema and generate client
COPY prisma/ ./prisma/
RUN prisma generate --schema=./prisma/schema.prisma

# Copy source code
COPY main.py .

EXPOSE 8000

# Run FastAPI with production uvicorn worker
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
