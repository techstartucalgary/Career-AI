#!/bin/bash
# Quick start - no checks, just run

echo "🚀 Starting Backend (Quick Start)"
echo "================================"

cd /Users/abdu/PycharmProjects/Career-AI/backend

# Kill any existing process on port 8000
echo "🔍 Checking for existing processes on port 8000..."
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "⚠️  Port 8000 is in use. Killing existing process..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 2
    echo "✅ Port cleared"
else
    echo "✅ Port 8000 is available"
fi

# Load .env if exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
fi

echo ""
echo "🎯 Starting FastAPI server on http://localhost:8000"
echo "   Press Ctrl+C to stop"
echo ""

# Start server
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
