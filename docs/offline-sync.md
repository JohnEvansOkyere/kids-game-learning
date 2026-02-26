# Offline Sync

## Goal

Allow practice mode to work when the device loses connectivity.

## Strategy

- Cache up to 50 questions per topic and grade in `localStorage`.
- If the start request fails, reuse cached questions.
- Queue answer submissions in `localStorage` under `pendingAnswers`.
- Queue completion calls in `localStorage` under `pendingCompletions`.
- Flush queues when the browser goes back online.

## Idempotency

- Backend enforces unique `Answer(sessionId, questionId)`.
- Duplicate submissions return the original result.
- Completion is idempotent and returns the saved session summary.

## Current Limits

- No background sync when the browser is closed.
- Offline sessions use an `offline-` session id and are not persisted to the DB.
