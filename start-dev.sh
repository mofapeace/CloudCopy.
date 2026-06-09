#!/bin/bash

echo "Starting Cloudkopii Services..."

# 1. Start Server
echo "Starting Backend Server on port 3000..."
cd server
node index.js &
SERVER_PID=$!

# 2. Start Client
echo "Starting Frontend Client..."
cd ../client
npm run dev &
CLIENT_PID=$!

# 3. Start Print Agent
echo "Starting Print Agent..."
cd ../print-agent
node agent.js &
AGENT_PID=$!

echo "All services started!"
echo "Press Ctrl+C to stop all services."

# Wait and catch Ctrl+C
trap "kill $SERVER_PID $CLIENT_PID $AGENT_PID; exit" INT
wait
