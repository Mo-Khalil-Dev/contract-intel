#!/bin/bash

echo "🚀 Setting up Contract Analysis Platform..."

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js version 20 or higher is required"
  exit 1
fi

echo "✅ Node.js version check passed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd apps/backend
npm install
cd ../..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd apps/frontend
npm install
cd ../..

echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "  npm run dev"
echo ""
echo "Backend will run on: http://localhost:3000"
echo "Frontend will run on: http://localhost:5173"
echo "API docs: http://localhost:3000/api/docs"
