# Frontend UI

## Routes

- `/login` — parent login
- `/register` — parent registration (2 steps)
- `/student/select` — choose child profile
- `/student/add` — create additional child profile
- `/dashboard` — main hub
- `/practice` — practice mode

## State Storage

- `localStorage.token` — JWT token
- `localStorage.user` — user profile
- `localStorage.parent` — parent profile
- `localStorage.students` — cached student list
- `localStorage.selectedStudent` — current student

## Practice Mode Flow

1. User picks a topic.
2. App requests questions from `/api/game/practice/start`.
3. App shows 10 questions with timer.
4. Each answer is submitted to `/api/game/practice/answer`.
5. Session ends with `/api/game/practice/complete`.

## UI Components

- Button, Input, Card, Avatar
- Global theme in `frontend/app/globals.css`
- Header with Ghana branding
