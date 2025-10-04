#!/bin/bash

# 🚀 Quick Start Script - Nginx WAF Admin Portal

echo "================================================"
echo "🚀 Starting Nginx WAF Admin Portal"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_DIR}/apps/api"
FRONTEND_DIR="${PROJECT_DIR}/apps/web"

# Check if backend directory exists
if [ ! -d "${BACKEND_DIR}" ]; then
    echo "❌ Backend directory not found at ${BACKEND_DIR}!"
    exit 1
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"
cd "${PROJECT_DIR}" && pnpm install

echo ""
echo -e "${BLUE}🗄️  Setting up database...${NC}"
cd "${BACKEND_DIR}"
pnpm prisma:generate
pnpm exec prisma migrate deploy
pnpm prisma:seed

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "================================================"
echo "📋 Test Credentials:"
echo "================================================"
echo ""
echo "Admin:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Operator:"
echo "  Username: operator"
echo "  Password: operator123"
echo ""
echo "Viewer:"
echo "  Username: viewer"
echo "  Password: viewer123"
echo ""
echo "================================================"
echo "🚀 Starting services..."
echo "================================================"
echo ""
echo -e "${YELLOW}Starting backend on port 3001...${NC}"
cd "${BACKEND_DIR}"
pnpm dev &
BACKEND_PID=$!

# Store the process group ID for better signal handling
BACKEND_PGID=$(ps -o pgid= -p "${BACKEND_PID}" | tr -d ' ')

sleep 3

echo -e "${YELLOW}Starting frontend on port 5173...${NC}"
cd "${FRONTEND_DIR}"
pnpm dev &
FRONTEND_PID=$!

# Store the process group ID for better signal handling
FRONTEND_PGID=$(ps -o pgid= -p "${FRONTEND_PID}" | tr -d ' ')

echo ""
echo "================================================"
echo -e "${GREEN}✅ All services started!${NC}"
echo "================================================"
echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:5173"
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

    echo "🔍 Stopping frontend on port 5173..."
    FRONTEND_PORT_PIDS=$(lsof -ti:5173 2>/dev/null)
    if [ -n "${FRONTEND_PORT_PIDS}" ]; then
        for pid in ${FRONTEND_PORT_PIDS}; do
            kill -TERM "${pid}" 2>/dev/null
            sleep 1
            if kill -0 "${pid}" 2>/dev/null; then
                kill -KILL "${pid}" 2>/dev/null
            fi
        done
        echo "✅ Frontend on port 5173 stopped"
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
    if [ -n "${REMAINING_BACKEND}" ]; then
        echo "⚠️  Warning: Some processes still running on port 3001: ${REMAINING_BACKEND}"
        echo "🔍 Force killing all remaining processes..."
        for pid in ${REMAINING_BACKEND}; do
            kill -KILL "${pid}" 2>/dev/null
        done
    fi

    echo "👋 Goodbye!"
    exit 0
}

# Trap Ctrl+C (SIGINT) and SIGTERM
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait "${BACKEND_PID}" "${FRONTEND_PID}"