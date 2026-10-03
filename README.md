# Project LOOP — AI Customer Feedback Intelligence Platform

Built for the Zidio Development internship (Web Development track).

Project LOOP is a multi-tenant SaaS platform that lets a company collect customer
feedback from multiple channels, automatically classify it with AI (sentiment,
theme), explore it on an analytics dashboard, ask natural-language questions about
it, and generate AI-written Voice-of-Customer reports.

## Features

- **Multi-channel feedback ingestion** — Email, Survey, App Review, Support
  Ticket, Social, Other, each classified by Claude on submission.
- **AI classification** — sentiment (positive/neutral/negative), an auto-detected
  theme, and a one-line summary, generated per item.
- **Analytics dashboard** — sentiment trend over 14 days, top themes by volume,
  totals by sentiment.
- **AI Q&A ("Ask LOOP")** — plain-English questions answered from the tenant's
  own feedback (RAG-lite: recent rows as context).
- **Voice-of-Customer reports** — generate a markdown report (summary, sentiment
  breakdown, top themes, notable quotes, recommended actions) for any date range.
- **Multi-tenant, role-based access control** — every business row is scoped by
  `tenantId`; three roles (Admin / Manager / Viewer) gate team management and
  report generation.

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · PostgreSQL · Prisma ·
NextAuth (credentials + JWT sessions) · Anthropic Claude API (`claude-sonnet-5`)
· Recharts · Zod · deployed on Vercel

## Architecture

```
Browser
  │
  ▼
Next.js App Router (Server Components + API routes)
  │
  ├── NextAuth (JWT session: userId, tenantId, role)
  │
  ├── src/lib/tenant.ts  ── requireTenantContext() / requireRole()
  │     └─ the ONLY source of tenantId for any query — never trusted
  │        from a request body or query param
  │
  ├── src/lib/claude.ts  ── classifyFeedback / answerQuestion / generateVocReport
  │     └─ all calls to the Anthropic API go through here
  │
  └── Prisma ── PostgreSQL
        Tenant ─┬─ User (role: ADMIN | MANAGER | VIEWER)
                 ├─ Feedback (channel, sentiment, theme, summary)
                 ├─ Theme
                 └─ Report (generated VoC reports)
```

Every table that holds business data carries a `tenantId`, and every query is
scoped through `requireTenantContext()` — this is what makes it safe for
multiple companies to share one deployment without seeing each other's data.

## Getting started locally

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, NEXTAUTH_SECRET, ANTHROPIC_API_KEY
npx prisma migrate dev --name init
npm run seed               # optional: loads a demo tenant with sample feedback
npm run dev
```

Then open http://localhost:3000 — sign up to create a new company workspace
(you become its first Admin), or if you ran the seed script, log in as:

| Role    | Email                | Password    |
|---------|-----------------------|-------------|
| Admin   | admin@acmedemo.io     | Demo1234!   |
| Manager | manager@acmedemo.io   | Demo1234!   |
| Viewer  | viewer@acmedemo.io    | Demo1234!   |

## Deploying

1. Push this repo to GitHub.
2. Create a Postgres database (e.g. [Neon](https://neon.tech) or
   [Supabase](https://supabase.com) free tier) and copy its connection string.
3. Import the repo into [Vercel](https://vercel.com/new).
4. Add environment variables in Vercel: `DATABASE_URL`, `NEXTAUTH_SECRET`
   (`openssl rand -base64 32`), `NEXTAUTH_URL` (your deployed URL),
   `ANTHROPIC_API_KEY`.
5. Deploy. Then run `npx prisma migrate deploy` (and optionally `npm run seed`)
   against the production `DATABASE_URL` before demoing.

## Project structure

```
src/
  app/
    (app)/              protected routes — dashboard, feedback, reports, team
    api/                 REST endpoints (feedback, qa, voc-report, team, auth)
    login/ signup/       public auth pages
  components/             client components (forms, charts, nav)
  lib/                    auth.ts, tenant.ts (RBAC + tenant scoping), claude.ts
prisma/
  schema.prisma           data model
  seed.ts                 demo data loader
```
