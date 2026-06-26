#!/bin/bash
echo "Installing backend dependencies..."
cd backend && npm install --production

echo "Installing frontend dependencies..."
cd ../frontend && npm install

echo "Building Next.js..."
npm run build

echo "✅ Build complete!"