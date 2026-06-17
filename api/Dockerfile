# Portable container for the HumQadam backend (works on Render, Railway, Fly.io,
# Hugging Face Spaces, etc.). Reads $PORT at runtime (defaults to 8000 locally).
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
