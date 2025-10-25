#!/bin/sh
set -e

MODE="$1"

if [ "$MODE" = "migrate" ]; then
  echo "Running migrations..."
  npx prisma migrate deploy
  echo "Starting server..."
  npm run server

else
  echo "Running migrations..."
  npx prisma migrate deploy
  echo "Starting server..."
  npm run server
fi
