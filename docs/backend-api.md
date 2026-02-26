# Backend API

Base URL: `http://localhost:8000`

## Auth

- `POST /api/auth/register`
  - Creates user, parent, and first student
  - Returns JWT token

- `POST /api/auth/login`
  - Returns JWT token and student list

- `GET /api/auth/me`
  - Returns user, parent, and students

- `POST /api/auth/logout`
  - Client-side token removal

## Students

- `POST /api/students/`
  - Create a student profile
  - Max 4 students per parent

- `GET /api/students/`
  - List students for current parent

- `GET /api/students/{studentId}`
  - Fetch a specific student

## Questions

- `GET /api/questions/random`
  - Query params: `topic`, `gradeLevel`, `count`
  - Returns random questions

- `POST /api/questions/seed`
  - Admin only (header: `X-Admin-Token`)
  - Query param: `force=true` to clear existing questions
  - Seeds the database with 100+ questions

## Practice

- `POST /api/game/practice/start`
  - Body: `studentId`, `topic`, `gradeLevel`
  - Returns `sessionId` and 10 questions
  - Includes `correctAnswer` to support offline play

- `POST /api/game/practice/answer`
  - Body: `sessionId`, `questionId`, `answer`, `timeSpent`
  - Idempotent per `sessionId + questionId`
  - Updates session stats only once

- `POST /api/game/practice/complete`
  - Body: `sessionId`
  - Idempotent, returns summary

- `GET /api/game/sessions/{studentId}`
  - Returns a student’s practice history

## Health

- `GET /health`
  - Returns API health status
