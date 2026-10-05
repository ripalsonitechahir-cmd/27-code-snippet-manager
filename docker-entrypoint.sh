#!/bin/sh
set -e
# Create/upgrade the SQLite schema, seed sample data only if the DB is empty
npx prisma db push --skip-generate
if [ "${SEED_DB:-true}" = "true" ]; then node prisma/seed.js; fi
exec "$@"
