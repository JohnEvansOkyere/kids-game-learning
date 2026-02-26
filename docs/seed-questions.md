# Seeding Questions

The seed script generates 100+ questions across KG1–P3 with Ghana-specific context.

## Script

- `backend/scripts/seed_questions.py`

## Run

```bash
cd backend
python scripts/seed_questions.py
```

## API (Admin Only)

```
POST /api/questions/seed?force=true
X-Admin-Token: <ADMIN_SEED_TOKEN>
```

This endpoint seeds the database without needing shell access.

## Notes

- The script clears existing questions before inserting new ones.
- It generates options with plausible distractors.
