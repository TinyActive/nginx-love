#!/usr/bin/env bash
################################################################################
# Nginx Love — Quick Start
# Default: Docker Compose dev profile
# Legacy host dev: bash scripts/quickstart.sh --legacy
################################################################################

set -e

USE_DOCKER=true
USE_LEGACY=false

for arg in "$@"; do
  case "$arg" in
    --docker) USE_DOCKER=true; USE_LEGACY=false ;;
    --legacy) USE_LEGACY=true; USE_DOCKER=false ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ "$USE_DOCKER" = true ] && [ "$USE_LEGACY" = false ]; then
  echo "🚀 Nginx Love — Docker dev quick start"
  echo "========================================"
  cd "${PROJECT_DIR}"
  if [ ! -f .env ]; then
    cp .env.docker.example .env
    echo "Created .env from .env.docker.example — edit secrets for production."
  fi
  exec docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env up --build
fi

# --- Legacy host-native dev flow below ---

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_DIR}/apps/api"
FRONTEND_DIR="${PROJECT_DIR}/apps/web"

# Database config
DB_NAME="nginx_love_db"
DB_USER="nginx_love_user"
DB_PASSWORD="dev_password_123"
DB_PORT=5432

echo "🚀 Nginx Love UI - Quick Start"
echo "================================"
echo ""

# Check Docker (optional)
USE_DOCKER=false
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    read -p "Use Docker for PostgreSQL? (y/n, default: y): " USE_DOCKER_INPUT
    if [ "${USE_DOCKER_INPUT}" != "n" ]; then
        USE_DOCKER=true
    fi
fi

# Setup PostgreSQL
if [ "${USE_DOCKER}" = true ]; then
    echo "🐳 Starting PostgreSQL with Docker..."
    
    # Stop existing container if any
    docker stop nginx-love-postgres 2>/dev/null || true
    docker rm nginx-love-postgres 2>/dev/null || true
    
    # Start PostgreSQL
    docker run -d \
        --name nginx-love-postgres \
        -e POSTGRES_DB="${DB_NAME}" \
        -e POSTGRES_USER="${DB_USER}" \
        -e POSTGRES_PASSWORD="${DB_PASSWORD}" \
        -p "${DB_PORT}":5432 \
        postgres:15-alpine > /dev/null
    
    echo "✅ PostgreSQL started in Docker"
    echo "   Waiting for database to be ready..."
    sleep 3
    
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}?schema=public"
else
    echo "📋 Please ensure PostgreSQL is running and update DATABASE_URL in backend/.env"
    DATABASE_URL=${DATABASE_URL:-"postgresql://user:password@localhost:5432/nginx_love_db?schema=public"}
fi

# Create backend .env from .env.example
if [ ! -f "${BACKEND_DIR}/.env" ]; then
    echo "⚠️  Backend .env not found. Creating from .env.example..."
    cp "${BACKEND_DIR}/.env.example" "${BACKEND_DIR}/.env"

    # Replace with actual values
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|g" "${BACKEND_DIR}/.env"
    sed -i.bak "s|CORS_ORIGIN=.*|CORS_ORIGIN=\"http://localhost:8080,http://localhost:5173\"|g" "${BACKEND_DIR}/.env"
    sed -i.bak "s|NODE_ENV=.*|NODE_ENV=development|g" "${BACKEND_DIR}/.env"
    rm -f "${BACKEND_DIR}/.env.bak"

    echo "✅ Created ${BACKEND_DIR}/.env"
fi

# Create frontend .env from .env.example
if [ ! -f "${FRONTEND_DIR}/.env" ]; then
    echo "⚠️  Frontend .env not found. Creating from .env.example..."
    cp "${FRONTEND_DIR}/.env.example" "${FRONTEND_DIR}/.env"

    # Replace with actual values
    sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=http://localhost:3001/api|g" "${FRONTEND_DIR}/.env"
    sed -i.bak "s|VITE_DEMO_MODE=.*|VITE_DEMO_MODE=true|g" "${FRONTEND_DIR}/.env"
    rm -f "${FRONTEND_DIR}/.env.bak"

    echo "✅ Created ${FRONTEND_DIR}/.env"
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd "${PROJECT_DIR}" && pnpm install

# Setup database
echo "🗄️  Setting up database..."
cd "${BACKEND_DIR}"
pnpm prisma:generate
pnpm exec prisma migrate deploy
pnpm prisma:seed 2>/dev/null || echo "Database already seeded"

# Start services
echo "🎯 Starting services..."
echo ""

# Start backend in background
cd "${BACKEND_DIR}" && pnpm dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: ${BACKEND_PID}) - http://localhost:3001"

# Store the process group ID for better signal handling
BACKEND_PGID=$(ps -o pgid= -p "${BACKEND_PID}" | tr -d ' ')

# Start frontend in background
cd "${FRONTEND_DIR}" && pnpm dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: ${FRONTEND_PID}) - http://localhost:8080"

# Store the process group ID for better signal handling
FRONTEND_PGID=$(ps -o pgid= -p "${FRONTEND_PID}" | tr -d ' ')

echo ""
echo "================================"
echo "✨ Quick Start Completed!"
echo "================================"
echo ""
echo "🌐 Access:"
echo "   Frontend: http://localhost:8080"
echo "   Backend:  http://localhost:3001"
echo ""
echo "🔐 Login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🛑 Stop:"
if [ "${USE_DOCKER}" = true ]; then
    echo "   kill ${BACKEND_PID} ${FRONTEND_PID} && docker stop nginx-love-postgres"
else
    echo "   kill ${BACKEND_PID} ${FRONTEND_PID}"
fi
echo ""

# Wait for services to start
sleep 3

# Health check
if curl -s http://localhost:3001/api/health | grep -q "success"; then
    echo "✅ Backend health check: PASSED"
else
    echo "⚠️  Backend health check: FAILED (check /tmp/backend.log)"
fi

echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."

    # Method 1: Kill by port (most reliable for Node.js processes)
    echo "🔍 Stopping backend on port 3001..."
    BACKEND_PORT_PIDS=$(lsof -ti:3001 2>/dev/null)
    if [ -n "${BACKEND_PORT_PIDS}" ]; then
        echo "🔍 Found backend processes: ${BACKEND_PORT_PIDS}"
        for pid in ${BACKEND_PORT_PIDS}; do
            # Get the full command to verify it's our Node.js process
            CMD=$(ps -p "${pid}" -o cmd= 2>/dev/null)
            if [[ "${CMD}" == *"node"* ]]; then
                echo "🔍 Stopping Node.js process ${pid}..."
                kill -TERM "${pid}" 2>/dev/null
                sleep 1
                # Check if still running and force kill if needed
                if kill -0 "${pid}" 2>/dev/null; then
                    echo "🔍 Process still running, sending SIGKILL..."
                    kill -KILL "${pid}" 2>/dev/null
                fi
            fi
        done
        echo "✅ Backend on port 3001 stopped"
    fi

    echo "🔍 Stopping frontend on port 8080..."
    FRONTEND_PORT_PIDS=$(lsof -ti:8080 2>/dev/null)
    if [ -n "${FRONTEND_PORT_PIDS}" ]; then
        for pid in ${FRONTEND_PORT_PIDS}; do
            kill -TERM "${pid}" 2>/dev/null
            sleep 1
            if kill -0 "${pid}" 2>/dev/null; then
                kill -KILL "${pid}" 2>/dev/null
            fi
        done
        echo "✅ Frontend on port 8080 stopped"
    fi

    # Method 2: Kill process groups (as backup)
    if [ -n "${BACKEND_PGID}" ]; then
        echo "🔍 Stopping backend process group (PGID: ${BACKEND_PGID})..."
        kill -TERM -"${BACKEND_PGID}" 2>/dev/null
        sleep 1
        if kill -0 -"${BACKEND_PGID}" 2>/dev/null; then
            kill -KILL -"${BACKEND_PGID}" 2>/dev/null
        fi
    fi

    if [ -n "${FRONTEND_PGID}" ]; then
        echo "🔍 Stopping frontend process group (PGID: ${FRONTEND_PGID})..."
        kill -TERM -"${FRONTEND_PGID}" 2>/dev/null
        sleep 1
        if kill -0 -"${FRONTEND_PGID}" 2>/dev/null; then
            kill -KILL -"${FRONTEND_PGID}" 2>/dev/null
        fi
    fi

    # Method 3: Kill parent PIDs (as final backup)
    if [ -n "${BACKEND_PID}" ]; then
        kill -TERM "${BACKEND_PID}" 2>/dev/null
        sleep 1
        if kill -0 "${BACKEND_PID}" 2>/dev/null; then
            kill -KILL "${BACKEND_PID}" 2>/dev/null
        fi
    fi

    if [ -n "${FRONTEND_PID}" ]; then
        kill -TERM "${FRONTEND_PID}" 2>/dev/null
        sleep 1
        if kill -0 "${FRONTEND_PID}" 2>/dev/null; then
            kill -KILL "${FRONTEND_PID}" 2>/dev/null
        fi
    fi

    # Final verification
    sleep 1
    REMAINING_BACKEND=$(lsof -ti:3001 2>/dev/null)
    REMAINING_FRONTEND=$(lsof -ti:8080 2>/dev/null)
    if [ -n "${REMAINING_BACKEND}" ] || [ -n "${REMAINING_FRONTEND}" ]; then
        echo "⚠️  Warning: Some processes still running:"
        [ -n "${REMAINING_BACKEND}" ] && echo "   Backend on port 3001: ${REMAINING_BACKEND}"
        [ -n "${REMAINING_FRONTEND}" ] && echo "   Frontend on port 8080: ${REMAINING_FRONTEND}"
        echo "🔍 Force killing all remaining processes..."
        for pid in ${REMAINING_BACKEND}; do
            kill -KILL "${pid}" 2>/dev/null
        done
        for pid in ${REMAINING_FRONTEND}; do
            kill -KILL "${pid}" 2>/dev/null
        done
    fi

    # Stop Docker PostgreSQL if used
    if [ "${USE_DOCKER}" = true ]; then
        docker stop nginx-love-postgres 2>/dev/null && echo "✅ PostgreSQL stopped"
    fi

    echo "👋 Goodbye!"
    exit 0
}

# Trap Ctrl+C (SIGINT) and SIGTERM
trap cleanup SIGINT SIGTERM

# Keep script running
wait