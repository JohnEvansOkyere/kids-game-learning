# MathChampions Ghana - Backend

FastAPI backend for MathChampions Ghana educational game platform.

## Features

- ✅ User authentication (JWT)
- ✅ Parent account management
- ✅ Student profile management
- ✅ PostgreSQL database with Prisma ORM
- ✅ Redis caching support
- ✅ CORS enabled for Next.js frontend

## Tech Stack

- **Framework:** FastAPI 0.109.0
- **Database:** PostgreSQL 15
- **ORM:** Prisma (Python client)
- **Authentication:** JWT (python-jose)
- **Password Hashing:** bcrypt (passlib)
- **Cache:** Redis 7

## Setup

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- pip

### Installation

1. **Start database services:**
```bash
docker-compose up -d
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Setup environment variables:**
```bash
cp .env.example .env
# Edit .env with your settings
```

5. **Generate Prisma client:**
```bash
prisma generate
```

6. **Run database migrations:**
```bash
prisma db push
```

### Running the Server

**Development mode:**
```bash
uvicorn app.main:app --reload --port 8000
```

**Production mode:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Server will be available at: `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register parent with first child
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout (client-side)

### Students

- `POST /api/students/` - Add new student profile
- `GET /api/students/` - Get all students for parent
- `GET /api/students/{id}` - Get specific student

## Database Schema

### User
- `id` (UUID)
- `email` (unique)
- `passwordHash`
- `createdAt`, `updatedAt`

### Parent
- `id` (UUID)
- `userId` (foreign key)
- `name`
- `phoneNumber`
- `createdAt`

### Student
- `id` (UUID)
- `parentId` (foreign key)
- `name`
- `avatar` (lion, elephant, cheetah, monkey, eagle, fish)
- `gradeLevel` (KG1, KG2, P1, P2, P3)
- `dateOfBirth`
- `createdAt`

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── schemas.py           # Pydantic models
│   ├── core/
│   │   ├── config.py        # Settings
│   │   ├── security.py      # JWT & password hashing
│   │   └── database.py      # Prisma client
│   └── routers/
│       ├── auth.py          # Authentication routes
│       └── students.py      # Student management routes
├── prisma/
│   └── schema.prisma        # Database schema
├── docker-compose.yml       # Local dev environment
├── requirements.txt         # Python dependencies
└── .env.example            # Environment variables template
```

## Development

### Database Management

**View database:**
```bash
docker exec -it kids-game-learning-db psql -U postgres -d mathchampions
```

**Reset database:**
```bash
prisma db push --force-reset
```

**Generate new migration:**
```bash
prisma migrate dev --name migration_name
```

### Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/ -v
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - Secret for JWT signing (use `openssl rand -hex 32`)
- `CORS_ORIGINS` - Allowed frontend origins

## License

MIT
