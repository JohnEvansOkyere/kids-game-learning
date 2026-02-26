# Testing

## Backend

Install dependencies and run:

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

### Covered

- Practice answer idempotency
- Practice completion idempotency
- Auth register/login
- Student create/list
- Admin seed endpoint

## Notes

- Tests require a running database (configured by `DATABASE_URL`).
- The test suite clears all records in a clean order before each test.
