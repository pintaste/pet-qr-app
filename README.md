# Pet QR System

A B2B2C SaaS platform for pet information management via QR codes. Pet owners scan a QR tag to view their pet's profile, contact the owner, and share a safe meeting location — no app required.

Built with a multi-tenant architecture to support multiple pet shops and brands on a single deployment.

---

## Features

- **QR-based pet profiles** — scan a tag to view name, breed, medical info, and owner contact
- **PIN-protected access** — dual-verification before revealing contact details
- **Location sharing** — suggest public meeting spots (schools, cafes, transit) without exposing home address, powered by OpenStreetMap
- **Multi-tenant SaaS** — each pet shop gets its own branded subdomain and schema-isolated database
- **Tier 1 / Tier 2 tenants** — dedicated RDS instance (enterprise) vs. shared schema isolation (standard)
- **Bilingual UI** — English and Chinese, runtime switchable
- **Dark mode** — full system-preference detection and persistence

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Backend** | Python · FastAPI · SQLModel · Alembic · PostgreSQL 15 |
| **Frontend** | React 18 · TypeScript · Vite · Tailwind CSS · Zustand · TanStack Query |
| **Auth** | JWT + Refresh Token · bcrypt |
| **Cloud** | AWS (S3 · SES · CloudFront) |
| **Maps** | Leaflet · OpenStreetMap Overpass API |
| **DevOps** | Docker · Docker Compose · Redis 7 |

## Architecture

```
┌─────────────────────────────────────┐
│          Multi-Tenant Router        │
│  (subdomain → tenant schema lookup) │
└──────────┬──────────────────────────┘
           │
    ┌──────▼──────┐     ┌─────────────┐
    │  FastAPI    │────▶│  PostgreSQL  │
    │  Backend    │     │  shared +    │
    │  :8000      │     │  tenant_*    │
    └──────┬──────┘     │  schemas     │
           │            └─────────────┘
    ┌──────▼──────┐     ┌─────────────┐
    │  React SPA  │     │    Redis     │
    │  Frontend   │     │  (tenant     │
    │  :3000      │     │   cache)     │
    └─────────────┘     └─────────────┘
```

**Database schema strategy:**
- `shared` schema → tenant registry, global users
- `tenant_{name}` schema → per-tenant pets, QR codes, users (full isolation)

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### 1. Clone and configure

```bash
git clone https://github.com/pintaste/Pet-QR-App.git
cd Pet-QR-App
cp .env.example .env
# Edit .env — set DATABASE_URL, SECRET_KEY, and AWS credentials
```

### 2. Start services

```bash
docker-compose up -d postgres redis
```

### 3. Run backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 4. Run frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

## Project Structure

```
Pet-QR-App/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # Auth, pets, QR codes, tenant admin, super admin
│   │   ├── core/            # Config, security, dependencies
│   │   ├── models/          # SQLModel ORM models
│   │   ├── services/        # Business logic
│   │   └── middleware/      # Tenant routing middleware
│   ├── migrations/          # Alembic migration history
│   └── tests/               # pytest test suite
├── frontend/
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route pages
│       ├── hooks/           # Custom React hooks
│       ├── services/        # API client layer
│       └── stores/          # Zustand state
├── shared/                  # Shared TypeScript types + Zod schemas
├── docs/                    # Architecture and deployment docs
└── docker-compose.yml
```

## License

MIT
