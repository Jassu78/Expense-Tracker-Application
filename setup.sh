#!/bin/bash

echo "🚀 Setting up Remote Expense Tracker..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Docker is installed (optional)
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. You'll need to set up PostgreSQL manually."
fi

echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Create environment file
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Created .env file for backend"
fi

# Install frontend dependencies
cd ../frontend
npm install

echo "✅ Dependencies installed successfully!"

echo "🗄️  Setting up database..."

# Check if PostgreSQL is running
if command -v docker &> /dev/null; then
    echo "🐳 Starting PostgreSQL with Docker..."
    docker run --name expense-tracker-db -e POSTGRES_DB=expense_tracker -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15-alpine
    
    echo "⏳ Waiting for database to be ready..."
    sleep 10
else
    echo "⚠️  Please ensure PostgreSQL is running on localhost:5432"
    echo "   Database: expense_tracker"
    echo "   Username: postgres"
    echo "   Password: postgres"
fi

# Setup database
cd ../backend
echo "🔄 Setting up database schema..."
npm run db:setup

echo "🌱 Seeding database with sample data..."
npm run db:seed

echo "✅ Database setup complete!"

echo ""
echo "🎉 Setup complete! You can now run the application:"
echo ""
echo "Option 1: Run with Docker (recommended)"
echo "  docker-compose up -d"
echo ""
echo "Option 2: Run locally"
echo "  # Terminal 1 - Backend"
echo "  cd backend && npm run dev"
echo ""
echo "  # Terminal 2 - Frontend"
echo "  cd frontend && npm run dev"
echo ""
echo "🌐 Application will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo ""
echo "👤 Default users:"
echo "  Admin:    admin@example.com / password123"
echo "  Employee: employee@example.com / password123"
echo ""
echo "🧪 Run tests:"
echo "  npm test" 