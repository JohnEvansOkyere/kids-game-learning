# MathChampions Ghana 🇬🇭

**Math Battle Game for Ghanaian Children (KG1-P3)**

A competitive, educational platform where kids learn math through fun tug-of-war style battles and practice modes. Designed specifically for Ghanaian children with local context, colorful UI, and optimized for low-end Android devices.

## Project Status

**Phase 1: Authentication & Basic UI** ✅ **COMPLETE**

- ✅ Backend API (FastAPI + PostgreSQL + Prisma)
- ✅ Frontend (Next.js 14 + TypeScript + Tailwind CSS)
- ✅ Parent registration & login
- ✅ Student profile management
- ✅ Kid-friendly, touch-optimized UI

## Tech Stack

### Backend
- FastAPI 0.109.0
- PostgreSQL 15
- Prisma ORM (Python)
- JWT Authentication
- Redis (caching)

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Axios

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose

### 1. Start Database

```bash
cd backend
docker-compose up -d
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env

# Generate Prisma client and run migrations
prisma generate
prisma db push

# Start server
uvicorn app.main:app --reload --port 8000
```

Backend API: `http://localhost:8000`  
API Docs: `http://localhost:8000/docs`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local

# Start development server
npm run dev
```

Frontend: `http://localhost:3000`

## Project Structure

```
kids-game-learning/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py      # Application entry
│   │   ├── routers/     # API endpoints
│   │   ├── core/        # Config, security, database
│   │   └── schemas.py   # Pydantic models
│   ├── prisma/
│   │   └── schema.prisma
│   └── docker-compose.yml
│
├── frontend/            # Next.js frontend
│   ├── app/            # Pages (App Router)
│   ├── components/     # UI components
│   ├── lib/           # API client, types
│   └── tailwind.config.ts
│
└── plan.md            # Full project specification
```

## Features (Phase 1)

### Authentication
- Parent registration with email/password
- JWT token-based authentication
- Secure password hashing (bcrypt)

### Student Management
- Add up to 4 children per parent account
- Avatar selection (🦁 🐘 🐆 🐵 🦅 🐠)
- Grade levels: KG1, KG2, P1, P2, P3
- Student selection screen

### UI/UX
- Colorful, playful design
- 60px minimum touch targets
- Works on 360px width devices
- Ghana flag 🇬🇭 branding
- Smooth animations

## Upcoming Phases

- **Phase 2:** Question Bank & Practice Mode
- **Phase 3:** Real-Time Battle Mode (WebSockets)
- **Phase 4:** Rewards & Progression System
- **Phase 5:** Parent/Teacher Dashboard

See [plan.md](plan.md) for complete roadmap.

## Deployment

**Recommended:** Hetzner Cloud (€4.5/month)
- South Africa datacenter (low latency for Ghana)
- Docker-ready deployment
- See deployment guide in plan.md

## Design Principles

✅ Colorful, playful, child-friendly UI  
✅ Big touch targets (minimum 60px)  
✅ Voice narration for questions (Phase 2+)  
✅ Instant visual feedback  
✅ Ghana-specific context (cedis, local items)  
✅ Works on low-end Android devices  
✅ Minimal data usage  

## Ghana-Specific Features

- 🇬🇭 Ghana flag in branding
- Phone format: +233
- Currency: GH₵
- Local names: Kofi, Ama, Kwame, Abena
- Local context: trotro, kenkey, mangoes

## Testing

### Backend
```bash
cd backend
pytest tests/ -v
```

### Frontend
```bash
cd frontend
npm run type-check
npm run lint
```

## Contributing

This is a private educational project for Ghanaian schools and parents.

## License

MIT

---

**Built with ❤️ for Ghanaian children**
