# E-Commerce Platform

Production-ready full-stack e-commerce platform built as a monorepo with Next.js 15, Express, PostgreSQL, Redis, and Meilisearch.

## Architecture

```
apps/
  storefront/   # Customer-facing Next.js 15 app (port 3000)
  admin/        # Admin dashboard Next.js 15 app (port 3001)
  api/          # Express REST API (port 4000)
packages/
  ui/           # Shared UI components & design system
  types/        # Shared TypeScript types
  config/       # Design tokens, Tailwind preset, env config
```

## Prerequisites

- Node.js >= 20.11.0
- Docker & Docker Compose (for local infrastructure)
- PostgreSQL 16, Redis 7, Meilisearch (via Docker Compose)

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd Dashboard
cp .env.example .env
npm install
```

### 2. Start Infrastructure

```bash
docker compose up -d postgres redis meilisearch
```

### 3. Run Development Servers

```bash
npm run dev
```

| Service    | URL                     |
|------------|-------------------------|
| Storefront | http://localhost:3000   |
| Admin      | http://localhost:3001   |
| API        | http://localhost:4000   |
| API Docs   | http://localhost:4000/api/docs |

### 4. Build for Production

```bash
npm run build
```

## Scripts

| Command          | Description                    |
|------------------|--------------------------------|
| `npm run dev`    | Start all apps in dev mode     |
| `npm run build`  | Build all packages and apps    |
| `npm run test`   | Run all tests                  |
| `npm run lint`   | Lint all packages              |
| `npm run typecheck` | TypeScript type checking    |

## Design System

Premium light/dark theme with luxury gold accent. Design tokens are centralized in `packages/config` and consumed by all apps via `packages/ui`.

## Development Milestones

| Milestone | Status | Description |
|-----------|--------|-------------|
| M1 | ✅ | Monorepo foundation, design system, health checks |
| M2 | 🔲 | Database schema, Prisma, seed data |
| M3 | 🔲 | Authentication (JWT, OAuth, RBAC) |
| M4 | 🔲 | Product catalog & inventory |
| M5 | 🔲 | Storefront (listing, search, details) |
| M6 | 🔲 | Cart, checkout, payments |
| M7 | 🔲 | Orders & shipping |
| M8 | 🔲 | Admin dashboard CRUD |
| M9 | 🔲 | CMS & media library |
| M10 | 🔲 | Analytics & notifications |
| M11 | 🔲 | Performance (Redis cache, rate limiting) |
| M12 | 🔲 | Production deployment |

## Deployment

- **Frontend (Storefront & Admin):** Vercel
- **API:** Railway or Render
- **Database:** Managed PostgreSQL
- **Redis:** Managed Redis (Upstash, Railway)
- **Search:** Meilisearch Cloud

See `.env.example` for all required environment variables.

## License

Private — All rights reserved.
# curiowraps
