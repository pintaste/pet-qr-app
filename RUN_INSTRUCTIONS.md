# 🚀 How to Run the Pet QR System

## Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.9+

## 1. Start Database Services

```bash
# Start PostgreSQL and Redis
docker-compose up postgres redis -d

# Verify services are running
docker-compose ps
```

## 2. Backend Setup & Run

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source venv_linux/bin/activate

# Install dependencies (if needed)
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**

## 3. Frontend Setup & Run

```bash
# Open new terminal, navigate to frontend
cd frontend

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:5173**

## 4. Quick Start Commands

**Full Development Environment:**
```bash
# Terminal 1: Start databases
docker-compose up postgres redis -d

# Terminal 2: Start backend
cd backend && source venv_linux/bin/activate && uvicorn app.main:app --reload

# Terminal 3: Start frontend
cd frontend && npm run dev
```

## 5. Production Build

**Frontend Production Build:**
```bash
cd frontend
npm run build
# Build files will be in dist/ directory
```

**Backend Production:**
```bash
cd backend
source venv_linux/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 6. Testing the System

1. **Open Frontend:** http://localhost:5173
2. **Select Language:** Choose from EN/ZH/ES/FR
3. **Test QR Flow:** Use demo QR codes (if available)
4. **API Documentation:** http://localhost:8000/docs

## Environment Variables

Make sure you have `.env` files configured:

**Backend (.env):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/pet_qr_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:8000
```

## Troubleshooting

**Database Connection Issues:**
```bash
# Check if PostgreSQL is running
docker-compose logs postgres

# Reset database
docker-compose down
docker-compose up postgres redis -d
```

**Dependencies Issues:**
```bash
# Backend
cd backend && pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

## Quick Reference

### Key URLs
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Database:** localhost:5432 (PostgreSQL)
- **Cache:** localhost:6379 (Redis)

### Key Commands
```bash
# Start all services
docker-compose up postgres redis -d

# Backend dev server
cd backend && source venv_linux/bin/activate && uvicorn app.main:app --reload

# Frontend dev server
cd frontend && npm run dev

# Database migrations
cd backend && source venv_linux/bin/activate && alembic upgrade head

# Production build
cd frontend && npm run build
```

## System Status

✅ **MVP Complete** - All core features implemented
✅ **Production Ready** - TypeScript errors resolved, builds successful
✅ **Multi-tenant** - B2B2C SaaS architecture with schema isolation
✅ **Mobile-First** - Responsive design optimized for 420px containers
✅ **Multi-language** - EN/ZH/ES/FR support with complete translations

The Pet QR System is ready for development and production deployment! 🎯