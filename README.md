# Code Snippet Manager

React + Node.js (Express) + SQLite (Prisma). Phase 1: application only (Docker / Kubernetes come next).

## Setup
```bash
cd backend && npm install && cp .env.example .env && npx prisma db push && npm run db:seed
cd ../frontend && npm install
```

## Run
**Single port (production-style):** `cd frontend && npm run build`, then `cd backend && npm start` -> http://localhost:4000

**Dev (hot reload):** `cd backend && npm run dev` and `cd frontend && npm run dev` -> http://localhost:5173

## API
`GET /api/snippets?q=&tag=&language=&favorite=` · `POST /api/snippets` · `GET|PUT|DELETE /api/snippets/:id` ·
`POST /api/snippets/:id/favorite` (toggle) · `GET /api/export` · `GET /api/meta` · `GET /health`

Config via env vars: `PORT`, `DATABASE_URL`, `CORS_ORIGIN`.
