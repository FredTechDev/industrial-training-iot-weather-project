#!/bin/sh
set -e

echo "────────────────────────────────────────"
echo "  IoT Weather System - Backend"
echo "  Environment: ${NODE_ENV:-development}"
echo "────────────────────────────────────────"

echo ""
echo "[1/3] Generating Prisma client..."
npx prisma generate

echo ""
echo "[2/3] Syncing database schema to Supabase..."
echo "  (This may fail if Supabase project is paused — the app will retry later)"
DATABASE_URL="${DATABASE_URL/6543/5432}" timeout 60 npx prisma db push --accept-data-loss 2>&1 || echo "  [WARN] DB sync failed — app will retry at runtime"

echo ""
echo "[3/3] Starting: $@"
echo ""

exec "$@"
