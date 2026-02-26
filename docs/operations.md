# Operations

## Health Check

- `GET /health` returns `{ "status": "healthy" }`

## Logging

- Backend uses standard Python logging
- Consider adding structured logs before production

## Production Notes

- Use a strong `JWT_SECRET_KEY`
- Keep `ADMIN_SEED_TOKEN` private and rotate if leaked
- Configure CORS origins for your deployed frontend
- Enable HTTPS at the reverse proxy
- Run DB backups daily

## Recommended Monitoring

- Uptime monitoring on `/health`
- Error tracking (Sentry or equivalent)
- DB metrics and slow query monitoring
