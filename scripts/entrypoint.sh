#!/bin/sh
set -e

MODE="$1"

if [ "$MODE" = "migrate" ]; then
  echo "Running migrations..."
  npx prisma migrate deploy

else
  echo "Starting server..."
  npm run server
fi
