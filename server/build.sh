#!/bin/bash
set -e

echo "Running database migrations..."
npx prisma migrate deploy || npx prisma db push

echo "Seeding database..."
node prisma/seed.js || true

echo "Build complete!"
