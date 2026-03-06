#!/bin/bash

# Screen Reader Testing Setup Script
# Usage: ./start-screen-reader-tests.sh

set -e

echo "🎙️ Screen Reader Testing Setup"
echo "=============================="
echo ""

# Check if frontend build exists
if [ ! -d "frontend/build" ]; then
    echo "📦 Building frontend..."
    cd frontend
    npm run build
    cd ..
fi

# Get available port
PORT=3000
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    PORT=$((PORT + 1))
done

echo "🚀 Starting test server on http://localhost:$PORT"
echo ""
echo "Test Server Info:"
echo "  URL: http://localhost:$PORT"
echo "  Build: $(date)"
echo ""

# Start server
cd frontend
npx serve -s build -p $PORT &
SERVER_PID=$!

sleep 2

# Print instructions
echo "════════════════════════════════════════════════════"
echo "✅ Server is running!"
echo "════════════════════════════════════════════════════"
echo ""
echo "📖 TESTING GUIDE:"
echo ""
echo "1️⃣ macOS VoiceOver:"
echo "   • Enable: Cmd+F5"
echo "   • Navigate: Ctrl+Option + Arrow Keys"
echo "   • Read: Ctrl+Option + Space"
echo "   • See: SCREEN_READER_TESTING.md for detailed steps"
echo ""
echo "2️⃣ Windows NVDA (if testing):"
echo "   • Download: https://www.nvaccess.org/download/"
echo "   • Start: Insert+N or Capslock+N"
echo "   • Navigate: Arrow Keys"
echo "   • See: SCREEN_READER_TESTING.md for detailed steps"
echo ""
echo "3️⃣ Test Checklist:"
echo "   • Open: $SCREEN_READER_TESTING.md"
echo "   • Follow: Test Suite 1-6"
echo "   • Document: Issues in template"
echo ""
echo "════════════════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Keep server running
wait $SERVER_PID
