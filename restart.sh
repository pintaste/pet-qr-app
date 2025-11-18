#!/bin/bash

# Pet QR System - Restart All Services Script
# This script restarts all project services including Docker containers and development servers

set -e  # Exit on any error

PROJECT_ROOT="/Users/pin/Desktop/Pet QR App"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
BACKEND_DIR="${PROJECT_ROOT}/backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===========================================${NC}"
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local service_name=$2

    print_status "Checking for processes on port $port ($service_name)..."

    if lsof -ti:$port >/dev/null 2>&1; then
        print_warning "Killing processes on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
        print_status "Processes on port $port terminated"
    else
        print_status "No processes found on port $port"
    fi
}

# Function to clean node_modules/.vite cache
clean_vite_cache() {
    print_status "Cleaning Vite cache..."
    if [ -d "${FRONTEND_DIR}/node_modules/.vite" ]; then
        rm -rf "${FRONTEND_DIR}/node_modules/.vite" 2>/dev/null || {
            print_warning "Unable to remove Vite cache, trying with sudo..."
            sudo rm -rf "${FRONTEND_DIR}/node_modules/.vite" 2>/dev/null || {
                print_error "Failed to remove Vite cache. You may need to manually delete ${FRONTEND_DIR}/node_modules/.vite"
            }
        }
        print_status "Vite cache cleaned"
    else
        print_status "No Vite cache found"
    fi
}

# Main restart function
main() {
    print_header "🔄 Pet QR System - Restarting All Services"

    # Change to project root
    cd "$PROJECT_ROOT" || {
        print_error "Failed to change to project directory: $PROJECT_ROOT"
        exit 1
    }

    print_header "📦 Step 1: Stopping Docker Services"

    # Stop Docker containers
    print_status "Stopping Docker Compose services..."
    docker-compose down 2>/dev/null || print_warning "Docker Compose not running or failed to stop"

    print_header "⚡ Step 2: Killing Development Servers"

    # Kill processes on common development ports
    kill_port 3000 "React Dev Server"
    kill_port 3001 "Alternative React Dev Server"
    kill_port 8000 "FastAPI Backend"
    kill_port 8001 "Alternative Backend"
    kill_port 5173 "Vite Dev Server"
    kill_port 5174 "Alternative Vite Dev Server"

    print_header "🧹 Step 3: Cleaning Cache and Temporary Files"

    # Clean Vite cache
    clean_vite_cache

    # Clean Python cache if backend exists
    if [ -d "$BACKEND_DIR" ]; then
        print_status "Cleaning Python cache..."
        find "$BACKEND_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
        find "$BACKEND_DIR" -name "*.pyc" -delete 2>/dev/null || true
    fi

    print_header "🐳 Step 4: Starting Docker Services"

    # Start Docker containers
    print_status "Starting PostgreSQL and Redis..."
    docker-compose up -d postgres redis

    # Wait for services to be ready
    print_status "Waiting for database to be ready..."
    sleep 5

    # Check if PostgreSQL is ready
    for i in {1..30}; do
        if docker exec pet-qr-postgres pg_isready -U postgres >/dev/null 2>&1; then
            print_status "PostgreSQL is ready!"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "PostgreSQL failed to start within 30 seconds"
            exit 1
        fi
        sleep 1
    done

    print_header "🚀 Step 5: Starting Development Servers"

    # Start Backend (if exists and not commented in docker-compose)
    if [ -d "$BACKEND_DIR" ] && [ -f "${BACKEND_DIR}/requirements.txt" ]; then
        print_status "Starting FastAPI backend in background..."
        cd "$BACKEND_DIR"

        # Check if virtual environment exists
        if [ -d "../venv_linux" ]; then
            nohup ../venv_linux/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
            echo $! > ../logs/backend.pid
            print_status "Backend started (PID saved to logs/backend.pid)"
        else
            print_warning "Virtual environment not found, skipping backend startup"
        fi
        cd "$PROJECT_ROOT"
    fi

    # Start Frontend
    if [ -d "$FRONTEND_DIR" ] && [ -f "${FRONTEND_DIR}/package.json" ]; then
        print_status "Starting React/Vite frontend in background..."
        cd "$FRONTEND_DIR"
        nohup npm run dev > ../logs/frontend.log 2>&1 &
        echo $! > ../logs/frontend.pid
        print_status "Frontend started (PID saved to logs/frontend.pid)"
        cd "$PROJECT_ROOT"
    fi

    print_header "✅ Step 6: Service Status Check"

    # Wait a bit for services to start
    sleep 3

    # Show service status
    print_status "Checking service status..."
    echo
    echo "Docker Services:"
    docker-compose ps 2>/dev/null || echo "  Docker Compose not available"
    echo

    echo "Development Servers:"
    if pgrep -f "uvicorn.*app.main:app" >/dev/null; then
        echo "  ✅ Backend (FastAPI): Running on http://localhost:8000"
    else
        echo "  ❌ Backend (FastAPI): Not running"
    fi

    if pgrep -f "vite|npm.*dev" >/dev/null; then
        echo "  ✅ Frontend (React/Vite): Running (check logs/frontend.log for port)"
    else
        echo "  ❌ Frontend (React/Vite): Not running"
    fi

    echo
    print_status "Database: PostgreSQL should be available on localhost:5432"
    print_status "Redis: Available on localhost:6379"
    echo

    print_header "📋 Useful Commands"
    echo "  View Frontend Logs:  tail -f logs/frontend.log"
    echo "  View Backend Logs:   tail -f logs/backend.log"
    echo "  Stop All Services:   ./stop.sh  (if you create one)"
    echo "  Check Docker Status: docker-compose ps"
    echo

    print_header "🎉 All Services Restarted Successfully!"
    print_status "You can now access:"
    print_status "  🌐 Frontend: http://localhost:3001 (or check frontend log for actual port)"
    print_status "  🔗 Backend API: http://localhost:8000"
    print_status "  📊 API Docs: http://localhost:8000/docs"
}

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/logs"

# Run main function
main

# Optional: Open frontend in browser (uncomment if desired)
# sleep 2 && open "http://localhost:3001" &