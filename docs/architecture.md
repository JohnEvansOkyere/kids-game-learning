# Architecture

## Overview

MathChampions Ghana is a client-server educational game platform for kids. It consists of:

- Frontend: Next.js 14 App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Prisma ORM, PostgreSQL
- Optional: Redis (configured, not fully used yet)

## Data Flow

1. Parent registers and creates a first child profile.
2. Parent logs in and selects a student profile.
3. Practice mode starts a new game session for the student.
4. Client receives a set of questions and submits answers one by one.
5. Backend persists answers and updates session stats.
6. Completion endpoint finalizes the session and returns a summary.

## Key Domains

- User: authentication record
- Parent: user profile tied to children
- Student: child profile used for gameplay
- Question: question bank
- GameSession: practice or battle (battle not implemented yet)
- Answer: per-question response

## Security Model

- JWT access token stored on the client
- Authorization via `Authorization: Bearer <token>`
- Parent access scoped to their own students

## Idempotency

Answer submission is idempotent by a unique constraint on `Answer(sessionId, questionId)`.
Completion is idempotent; repeated calls return the same results.

## Notes

- Real-time battle mode is planned for Phase 3.
- Rewards, achievements, and parent/teacher dashboards are planned for later phases.
