# Setup

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker + Docker Compose
- PostgreSQL 15 if not using Docker

## Backend

```bash
cd backend

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Database (Docker)
docker-compose up -d

# Prisma client + DB sync
prisma generate
prisma db push

# Start API
uvicorn app.main:app --reload --port 8000
```

## Frontend

```bash
cd frontend

npm install
cp .env.local.example .env.local

npm run dev
```

Frontend runs at `http://localhost:3000` and backend at `http://localhost:8000`.

## Seed Questions

```bash
cd backend
python scripts/seed_questions.py
```

## Prisma Migration Note

When you pull schema changes (like new constraints), run:

```bash
prisma generate
prisma db push
```
