#!/bin/bash

echo "Starting NestJS Backend..."
npm run start:prod > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

echo "Waiting for server to start..."
sleep 6

echo "Testing health endpoint..."
curl -s http://localhost:3001/api/nestjs-aws-learn/health && echo "✅ Backend is running!" || echo "⚠️  Backend not responding yet"

echo ""
echo "Backend Process ID: $BACKEND_PID"
echo "Logs saved to: /tmp/backend.log"

# Keep server running
wait $BACKEND_PID
