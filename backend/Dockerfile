# Production Dockerfile for UrjaRakshak Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ ./app/

# Create non-root user
RUN useradd -m -u 1000 urjarakshak && chown -R urjarakshak:urjarakshak /app
USER urjarakshak

# Railway will provide PORT dynamically
EXPOSE 8000

# Run application (IMPORTANT: use shell form so $PORT expands)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
