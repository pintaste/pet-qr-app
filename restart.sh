#!/bin/bash

# Pet QR System - Unified Restart Script
# Usage: ./restart.sh [dev|full]
#   dev  - Restart development servers only (default)
#   full - Restart Docker services + development servers

set -e  # Exit on any error

PROJECT_ROOT="/Users/pin/Desktop/Pet QR App"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
BACKEND_DIR="${PROJECT_ROOT}/backend"

# Parse mode argument
MODE="${1:-dev}"

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

# Function to stop Docker services
stop_docker_services() {
    print_header "📦 Stopping Docker Services"
    print_status "Stopping Docker Compose services..."
    docker-compose down 2>/dev/null || print_warning "Docker Compose not running or failed to stop"
}

# Function to start Docker services
start_docker_services() {
    print_header "🐳 Starting Docker Services"

    print_status "Starting PostgreSQL and Redis..."
    docker-compose up -d postgres redis

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
}

# Function to stop development servers
stop_dev_servers() {
    print_header "⚡ Stopping Development Servers"

    # Kill processes on common development ports
    kill_port 3000 "React Dev Server"
    kill_port 3001 "Alternative React Dev Server"
    kill_port 8000 "FastAPI Backend"
    kill_port 8001 "Alternative Backend"
    kill_port 5173 "Vite Dev Server"
    kill_port 5174 "Alternative Vite Dev Server"

    # Kill by process name
    print_status "Killing development processes by name..."
    pkill -f "uvicorn.*app.main:app" 2>/dev/null || true
    pkill -f "npm.*dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
}

# Function to clean caches
clean_caches() {
    print_header "🧹 Cleaning Cache and Temporary Files"

    # Clean Vite cache
    clean_vite_cache

    # Clean Python cache if backend exists
    if [ -d "$BACKEND_DIR" ]; then
        print_status "Cleaning Python cache..."
        find "$BACKEND_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
        find "$BACKEND_DIR" -name "*.pyc" -delete 2>/dev/null || true
    fi
}

# Function to start development servers
start_dev_servers() {
    print_header "🚀 Starting Development Servers"

    # Create logs directory
    mkdir -p "$PROJECT_ROOT/logs"

    # Start Backend
    if [ -d "$BACKEND_DIR" ] && [ -f "${BACKEND_DIR}/requirements.txt" ]; then
        print_status "Starting FastAPI backend..."
        cd "$BACKEND_DIR"

        # Check if virtual environment exists
        if [ -d "../venv_linux" ]; then
            # Use python -m uvicorn to avoid hardcoded shebang path issues
            # Set NO_PROXY to avoid proxy interference with localhost
            nohup env NO_PROXY=localhost,127.0.0.1 ../venv_linux/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
            echo $! > ../logs/backend.pid
            print_status "✅ Backend started on http://localhost:8000 (PID: $(cat ../logs/backend.pid))"
        else
            print_warning "Virtual environment not found at ../venv_linux, skipping backend startup"
        fi
        cd "$PROJECT_ROOT"
    else
        print_warning "Backend directory or requirements.txt not found, skipping backend startup"
    fi

    # Start Frontend
    if [ -d "$FRONTEND_DIR" ] && [ -f "${FRONTEND_DIR}/package.json" ]; then
        print_status "Starting React/Vite frontend..."
        cd "$FRONTEND_DIR"

        # Check if node_modules exists
        if [ -d "node_modules" ]; then
            # Set NO_PROXY to avoid proxy interference with localhost backend
            nohup env NO_PROXY=localhost,127.0.0.1 npm run dev > ../logs/frontend.log 2>&1 &
            echo $! > ../logs/frontend.pid
            print_status "✅ Frontend started (PID: $(cat ../logs/frontend.pid))"
        else
            print_warning "node_modules not found, please run 'npm install' in frontend directory first"
        fi
        cd "$PROJECT_ROOT"
    else
        print_warning "Frontend directory or package.json not found, skipping frontend startup"
    fi
}

# Function to show service status
show_status() {
    print_header "📋 Service Status"

    # Wait for services to initialize
    print_status "Waiting 3 seconds for services to initialize..."
    sleep 3

    if [ "$MODE" = "full" ]; then
        echo "Docker Services:"
        docker-compose ps 2>/dev/null || echo "  Docker Compose not available"
        echo
    fi

    echo "Development Servers:"
    if pgrep -f "uvicorn.*app.main:app" >/dev/null; then
        echo "  ✅ Backend (FastAPI): Running on http://localhost:8000"
        echo "     📊 API Documentation: http://localhost:8000/docs"
    else
        echo "  ❌ Backend (FastAPI): Not running"
    fi

    if pgrep -f "vite|npm.*dev" >/dev/null; then
        # Try to get the actual port from the log
        if [ -f "logs/frontend.log" ]; then
            sleep 1
            PORT=$(grep -o "http://localhost:[0-9]*" logs/frontend.log | head -1 | cut -d: -f3 || echo "3000")
            echo "  ✅ Frontend (React/Vite): Running on http://localhost:${PORT}"
        else
            echo "  ✅ Frontend (React/Vite): Running (check logs/frontend.log for port)"
        fi
    else
        echo "  ❌ Frontend (React/Vite): Not running"
    fi

    if [ "$MODE" = "full" ]; then
        echo
        print_status "Database: PostgreSQL available on localhost:5432"
        print_status "Redis: Available on localhost:6379"
    fi

    echo
    print_header "📋 Useful Commands"
    echo "  View Frontend Logs:  tail -f logs/frontend.log"
    echo "  View Backend Logs:   tail -f logs/backend.log"
    echo "  Stop Frontend:       kill \$(cat logs/frontend.pid 2>/dev/null) 2>/dev/null"
    echo "  Stop Backend:        kill \$(cat logs/backend.pid 2>/dev/null) 2>/dev/null"
    if [ "$MODE" = "full" ]; then
        echo "  Stop Docker:         docker-compose down"
        echo "  Dev Mode Restart:    ./restart.sh dev"
    else
        echo "  Full Restart:        ./restart.sh full"
    fi
    echo

    print_header "🎉 Services Restarted Successfully!"

    # Show final URLs
    if [ -f "logs/frontend.log" ]; then
        sleep 1
        FRONTEND_URL=$(grep -o "http://localhost:[0-9]*" logs/frontend.log | head -1 || echo "http://localhost:3000")
        print_status "🌐 Frontend: $FRONTEND_URL"
    fi
    print_status "🔗 Backend API: http://localhost:8000"
    echo
}

# Main function
main() {
    # Validate mode
    if [ "$MODE" != "dev" ] && [ "$MODE" != "full" ]; then
        print_error "Invalid mode: $MODE"
        echo "Usage: $0 [dev|full]"
        echo "  dev  - Restart development servers only (default)"
        echo "  full - Restart Docker services + development servers"
        exit 1
    fi

    # Change to project root
    cd "$PROJECT_ROOT" || {
        print_error "Failed to change to project directory: $PROJECT_ROOT"
        exit 1
    }

    if [ "$MODE" = "full" ]; then
        print_header "🔄 Pet QR System - Full Restart (Docker + Dev Servers)"
        stop_docker_services
        stop_dev_servers
        clean_caches
        start_docker_services
        start_dev_servers
        show_status
    else
        print_header "🔄 Pet QR System - Dev Mode Restart (Servers Only)"
        stop_dev_servers
        clean_caches
        start_dev_servers
        show_status
    fi
}

# Run main function
main
