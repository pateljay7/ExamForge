# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Self-examination portal: users paste study content, Claude (via the Agent SDK) generates an MCQ exam, they take it, and get scored results with the correct answers revealed only afterward. Attempts are saved as history.

npm-workspaces monorepo: `apps/api` (NestJS + Prisma/PostgreSQL) and `apps/web` (React + Vite). Note: `README.md` is partly stale — it says "No auth/login" and "No exam timer", but both now exist.

## Commands

Run from repo root:
- `npm run dev` — starts API (`:3001`) and web (`:5173`) together via `concurrently`. Web proxies `/api` → `:3001` (see `apps/web/vite.config.ts`).
- `npm run build` — builds api then web.

API-only (`-w api`):
- `npm run dev -w api` — Nest watch mode.
- `npm run prisma:migrate -w api` — create/apply a migration in dev (`prisma migrate dev`).
- `npm run prisma:deploy -w api` — apply migrations without generating (prod).
- `npm run prisma:generate -w api` — regenerate the Prisma client after editing `schema.prisma`.

No test suite or linter is configured.

## Environment

Copy `apps/api/.env.example` → `apps/api/.env`. Required: `DATABASE_URL` (PostgreSQL), `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`), `JWT_SECRET`. `CLAUDE_OAUTH_TOKEN` is also accepted — `AiService`'s constructor maps it to `CLAUDE_CODE_OAUTH_TOKEN`, which is what the SDK actually reads.

## Architecture

**AI generation** (`apps/api/src/ai.service.ts`): `generateForSections` splits the requested question count across weighted sections (`distribute` — proportional, remainder to heaviest weight), then calls `generateQuestions` once per section. Each call uses the Agent SDK `query()` with `maxTurns: 1` and `allowedTools: []` (no file/tool access — pure one-shot text generation). `parse` is defensive: strips markdown fences, slices out the `[...]` array, and filters to well-formed MCQs (exactly 4 options, integer `correctIndex` in 0–3). Malformed items are dropped silently; empty result throws.

**Answer secrecy** (`apps/api/src/exams.service.ts`): `Question.correctIndex` is the sensitive field. `getForTaking` deliberately omits it from its `select`. It is only returned by `getResult`, and only after an attempt exists. When touching exam/question serialization, preserve this — never leak `correctIndex` on the take path.

**Ownership scoping**: every service method takes `userId` and filters by it (`findFirst({ where: { id, userId } })`). This is the authorization boundary — a user can only read/submit their own exams and attempts. Keep this on any new query.

**Auth** (`apps/api/src/auth/`): email/password, bcrypt-hashed, JWT (`sub` = user id, 7-day expiry). `JwtModule` is registered `global: true`. `JwtAuthGuard` guards the entire `ExamsController` (`@UseGuards` at class level); `AuthController` is open. The `@UserId()` param decorator pulls `req.user.sub` — use it instead of reading the request directly.

**Timer model**: two mutually exclusive modes on `Exam`. `timeLimitSec` (a countdown, from `timeLimitMinutes * 60`) OR `timerEnabled` (a reference stopwatch). `create` enforces exclusivity: if a limit is set, `timerEnabled` is forced false. `Attempt.timeTakenSec` records elapsed time on submit.

**DTO validation**: `main.ts` uses a global `ValidationPipe({ whitelist: true, transform: true })`, so all input shaping lives in class-validator decorators in `dto.ts` / `auth/auth.dto.ts`. `whitelist` strips unknown properties — add a decorated field to the DTO or it won't reach the handler.

**Prisma `Json` columns**: `Exam.sections`, `Question.options`, `Attempt.answers` are `Json`. TypeScript can't type them, so casts (`as any`) and manual shaping appear at those boundaries — the shapes are documented in inline comments in `schema.prisma`.

**Web** (`apps/web/src/`): React Router. `main.tsx` wraps protected routes in `<Protected>` (redirects to `/login` if no user) + `<Layout>`. `auth.tsx` holds auth context, persisting token + user to `localStorage`. `api.ts` centralizes all fetches: attaches the Bearer token, and on any `401` clears storage and hard-redirects to `/login`. All server calls go through the `api` object — add new endpoints there.

## Conventions

- API routes are under a global `/api` prefix (`main.ts` `setGlobalPrefix('api')`).
- After changing `schema.prisma`, run a migration (`prisma:migrate`) — don't hand-edit generated client or SQL. Migrations live in `apps/api/prisma/migrations/`.
