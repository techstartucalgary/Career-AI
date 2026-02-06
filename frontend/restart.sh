#!/bin/bash
# Quick diagnostic and restart script

echo "🔧 Career AI - Debug & Restart"
echo "================================"
echo ""

# Kill existing processes
echo "🛑 Stopping any running Expo processes..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2

# Clear caches
echo "🧹 Clearing caches..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
echo "✅ Caches cleared"
echo ""

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "🚀 Starting Expo..."
echo "================================"
echo "📋 Instructions:"
echo "   1. Wait for QR code to appear"
echo "   2. Press 'w' to open in web browser"
echo "   3. Check browser for 'Expo is Working!' message"
echo "   4. If white screen, open DevTools (F12) and check Console"
echo ""
echo "Starting in 3 seconds..."
sleep 3

npx expo start --web
