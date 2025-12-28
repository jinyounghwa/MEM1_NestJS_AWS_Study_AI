#!/bin/bash

# NestJS AWS Learning System - Database Setup Script

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-nestjs_aws_learn}

echo "=========================================="
echo "🗄️  Database Setup for NestJS AWS Learn"
echo "=========================================="
echo ""
echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Username: $DB_USERNAME"
echo "  Database: $DB_NAME"
echo ""

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" > /dev/null 2>&1; then
  echo "❌ PostgreSQL is not running or not accessible."
  echo "   Please ensure PostgreSQL is running on $DB_HOST:$DB_PORT"
  exit 1
fi

echo "✅ PostgreSQL is accessible"
echo ""

# Create database if it doesn't exist
echo "Creating database if it doesn't exist..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -tc \
  "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" \
  -c "CREATE DATABASE $DB_NAME"

echo "✅ Database '$DB_NAME' is ready"
echo ""

echo "=========================================="
echo "✨ Database setup completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start the backend: npm run start:dev"
echo "2. TypeORM will automatically create tables"
echo ""
