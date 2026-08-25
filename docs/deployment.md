# Deployment Guide

This guide covers deploying Curio Wrap to a production environment.

## Architecture

- **Frontend**: Next.js 15 App Router (deployed to Vercel)
- **Backend**: Express API (deployed to Railway or Render)
- **Database**: PostgreSQL (deployed to Supabase)
- **Cache & Message Broker**: Redis (deployed to Upstash)
- **Object Storage**: Cloudinary

## Prerequisites

1. Create a [Supabase](https://supabase.com) project for PostgreSQL.
2. Create an [Upstash](https://upstash.com) Redis database.
3. Create a [Cloudinary](https://cloudinary.com) account.
4. Setup an email provider (Brevo SMTP, SendGrid, AWS SES).

## 1. Environment Configuration

Copy the `.env.example` to `.env` locally, and populate the values for production in your hosting providers.

## 2. Database Setup

1. Copy the `DATABASE_URL` and `DIRECT_URL` from Supabase (Transaction Pooler vs Session).
2. Run database migrations from your local machine to the remote database:
   ```bash
   npx prisma migrate deploy
   ```

## 3. Backend Deployment (Railway/Render)

1. Connect your GitHub repository to Railway or Render.
2. Set the Root Directory to the repository root.
3. The build command will automatically use `apps/api/Dockerfile` if deploying via Docker, or `npm ci && npm run build` for Node environments.
4. Set the Start Command to `npm run start --workspace=@dashboard/api`.
5. Populate all environment variables from your `.env.example`.

## 4. Frontend Deployment (Vercel)

1. Import the repository into Vercel.
2. Set the Root Directory to `apps/storefront` or `apps/admin` (you will create two Vercel projects).
3. The Build Command is automatically detected (`npm run build`).
4. Ensure `NEXT_PUBLIC_API_URL` points to your deployed backend URL.

## 5. Rollback Guide

If a deployment introduces a critical bug:
1. **Frontend**: Use Vercel's one-click "Instant Rollback" to revert to the previous stable deployment.
2. **Backend**: In Railway/Render, revert to the previous successful build.
3. **Database**: If a migration caused an issue, manually revert via Prisma down migrations or restore a backup from Supabase. Supabase provides point-in-time recovery for production databases.

## 6. Backup Strategy

- **PostgreSQL**: Handled natively by Supabase (daily backups and Point-in-Time Recovery).
- **Redis**: Ephemeral cache/queues; no persistent backups strictly required, but Upstash provides snapshot features if needed.
- **Media**: Handled natively by Cloudinary.
