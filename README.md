# Self Examination Portal

Provide learning content → AI generates an MCQ exam → conduct exams → get scored results with correct answers for wrong ones. Attempts are saved for history.

Mono-repo: NestJS API + React (Vite) web + Prisma/PostgreSQL. AI via Claude Agent SDK.

## Prerequisites

- Node 18+ and npm
- A running PostgreSQL database
- A Claude Code OAuth token (run `claude setup-token`, or `npx @anthropic-ai/claude-code setup-token`)

## Setup

```bash
npm install

# API env
cp apps/api/.env.example apps/api/.env
#   edit DATABASE_URL and CLAUDE_CODE_OAUTH_TOKEN

# create the schema
npm run prisma:migrate -w api

# run both apps
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:3001/api

## Notes

- `CLAUDE_CODE_OAUTH_TOKEN` is what the Agent SDK reads. `CLAUDE_OAUTH_TOKEN` is also accepted and mapped to it.
- No auth/login (single-user). No exam timer.
- Correct answers are stored but never sent to the client until a result is declared.
