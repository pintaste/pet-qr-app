#!/bin/bash

# Pet QR System - Restart Development Servers Only
# This script only restarts frontend and backend development servers (no Docker services)

set -e  # Exit on any error

PROJECT_ROOT="/Users/pin/Desktop/Context-Engineering-Intro"
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
    print_header "🔄 Pet QR System - Restarting Development Servers"

    # Change to project root
    cd "$PROJECT_ROOT" || {
        print_error "Failed to change to project directory: $PROJECT_ROOT"
        exit 1
    }

    print_header "⚡ Step 1: Stopping Development Servers"

    # Kill development server processes
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

    print_header "🧹 Step 2: Cleaning Cache"

    # Clean Vite cache
    clean_vite_cache

    # Clean Python cache if backend exists
    if [ -d "$BACKEND_DIR" ]; then
        print_status "Cleaning Python cache..."
        find "$BACKEND_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
        find "$BACKEND_DIR" -name "*.pyc" -delete 2>/dev/null || true
    fi

    print_header "🚀 Step 3: Starting Development Servers"

    # Create logs directory
    mkdir -p "$PROJECT_ROOT/logs"

    # Start Backend
    if [ -d "$BACKEND_DIR" ] && [ -f "${BACKEND_DIR}/requirements.txt" ]; then
        print_status "Starting FastAPI backend..."
        cd "$BACKEND_DIR"

        # Check if virtual environment exists
        if [ -d "../venv_linux" ]; then
            nohup ../venv_linux/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
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
            nohup npm run dev > ../logs/frontend.log 2>&1 &
            echo $! > ../logs/frontend.pid
            print_status "✅ Frontend started (PID: $(cat ../logs/frontend.pid))"
        else
            print_warning "node_modules not found, please run 'npm install' in frontend directory first"
        fi
        cd "$PROJECT_ROOT"
    else
        print_warning "Frontend directory or package.json not found, skipping frontend startup"
    fi

    print_header "⏳ Step 4: Waiting for Services to Start"

    # Wait for services to initialize
    print_status "Waiting 5 seconds for services to initialize..."
    sleep 5

    print_header "📋 Step 5: Service Status"

    echo "Development Servers Status:"
    if pgrep -f "uvicorn.*app.main:app" >/dev/null; then
        echo "  ✅ Backend (FastAPI): Running on http://localhost:8000"
        echo "     📊 API Documentation: http://localhost:8000/docs"
    else
        echo "  ❌ Backend (FastAPI): Not running"
    fi

    if pgrep -f "vite|npm.*dev" >/dev/null; then
        # Try to get the actual port from the log
        if [ -f "logs/frontend.log" ]; then
            PORT=$(grep -o "http://localhost:[0-9]*" logs/frontend.log | head -1 | cut -d: -f3 || echo "3001")
            echo "  ✅ Frontend (React/Vite): Running on http://localhost:${PORT}"
        else
            echo "  ✅ Frontend (React/Vite): Running (check logs/frontend.log for port)"
        fi
    else
        echo "  ❌ Frontend (React/Vite): Not running"
    fi

    echo
    print_header "📋 Useful Commands"
    echo "  View Frontend Logs:  tail -f logs/frontend.log"
    echo "  View Backend Logs:   tail -f logs/backend.log"
    echo "  Stop Frontend:       kill \$(cat logs/frontend.pid 2>/dev/null) 2>/dev/null"
    echo "  Stop Backend:        kill \$(cat logs/backend.pid 2>/dev/null) 2>/dev/null"
    echo "  Full System Restart: ./restart.sh"
    echo

    print_header "🎉 Development Servers Restarted!"

    # Show final URLs
    if [ -f "logs/frontend.log" ]; then
        sleep 2
        print_status "Checking frontend URL from logs..."
        FRONTEND_URL=$(grep -o "http://localhost:[0-9]*" logs/frontend.log | head -1 || echo "http://localhost:3001")
        print_status "🌐 Frontend URL: $FRONTEND_URL"
    fi

    print_status "🔗 Backend API: http://localhost:8000"
    echo
}

# Run main function
main