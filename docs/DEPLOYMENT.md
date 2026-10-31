# Deployment: Render (Backend) + Vercel (Frontend)

This guide gets MathChampions Ghana live with the backend on Render and the frontend on Vercel.

---

## 1. Backend on Render

### 1.1 Create a Web Service

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**.
2. Connect your Git repo (e.g. GitHub).
3. Configure:
   - **Name:** `mathchampions-api` (or any name).
   - **Root Directory:** `backend` (so Render runs from the `backend/` folder).
   - **Runtime:** Python 3.
   - **Build Command:**
     ```bash
     pip install -r requirements.txt && prisma generate && prisma db push && python -m scripts.backfill_question_skills
     ```
   - **Start Command:**
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type:** Free (or paid for always-on).

### 1.2 Add PostgreSQL

1. In the same Render project: **New** → **PostgreSQL**.
2. Create the database; note the **Internal Database URL** (or External if you need it elsewhere).
3. In your **Web Service** → **Environment**:
   - **Add** → **Link existing resource** → select the Postgres database.  
     This sets `DATABASE_URL` automatically.

### 1.3 Environment Variables (Backend)

In the Web Service **Environment** tab, add:

| Key | Value | Notes |
|-----|--------|--------|
| `DATABASE_URL` | (auto if you linked Postgres) | Otherwise paste the Postgres URL from Render. |
| `JWT_SECRET_KEY` | Long random string | e.g. `openssl rand -hex 32`. |
| `CORS_ORIGINS` | Your frontend URL(s) | e.g. `https://mathchampions.vercel.app` or `https://your-app.vercel.app`. Comma-separated for multiple. |
| `REDIS_URL` | (optional) | Omit if not using Redis; or use Upstash Redis URL. |

Do **not** commit real secrets to Git. Set them only in Render.

### 1.4 Deploy

Click **Create Web Service**. After the first deploy, note your API URL, e.g.:

`https://mathchampions-api.onrender.com`

Test: open `https://your-api-url.onrender.com/health` — should return `{"status":"healthy"}`.

---

## 2. Frontend on Vercel

### 2.1 Create a Project

1. Go to [Vercel](https://vercel.com) → **Add New** → **Project**.
2. Import the same Git repo.
3. Configure:
   - **Root Directory:** `frontend` (or leave blank if repo root is the frontend).
   - **Framework Preset:** Next.js (auto-detected).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** default.

### 2.2 Environment Variables (Frontend)

In **Settings** → **Environment Variables** add:

| Key | Value | Environment |
|-----|--------|-------------|
| `NEXT_PUBLIC_API_URL` | Your Render API URL | Production (and Preview if you want). |

Example: `https://mathchampions-api.onrender.com` (no trailing slash).

### 2.3 Deploy

Click **Deploy**. When it finishes, you get a URL like `https://your-app.vercel.app`.

---

## 3. Connect Frontend to Backend

1. **CORS:** Backend already allows origins from `CORS_ORIGINS`. You set this to your Vercel URL in Render (step 1.3). If you use a custom domain later, add it to `CORS_ORIGINS` (comma-separated).
2. **Frontend:** It calls `process.env.NEXT_PUBLIC_API_URL` (set in Vercel), so all API requests go to your Render backend.

Test: open the Vercel app → register / login → use practice or battle. Requests should go to the Render API.

---

## 4. Optional: Custom Domains

- **Vercel:** Add your domain in Project → Settings → Domains. Then add the same domain to `CORS_ORIGINS` on Render.
- **Render:** You can add a custom domain to the Web Service; update `NEXT_PUBLIC_API_URL` in Vercel to that domain if you use it.

---

## 5. Render Free Tier Notes

- The service may **spin down** after ~15 minutes of no traffic. The first request after that can take 30–60 seconds (cold start).
- For schools, consider: a paid plan for always-on, or a free uptime checker (e.g. cron-job.org) that hits `/health` every 10–15 minutes to reduce cold starts.

---

## 6. Checklist

- [ ] Render: Web Service created, Root = `backend`, build/start commands set.
- [ ] Render: Postgres created and linked (or `DATABASE_URL` set).
- [ ] Render: `JWT_SECRET_KEY` and `CORS_ORIGINS` (Vercel URL) set.
- [ ] Vercel: Project created, Root = `frontend` (if needed).
- [ ] Vercel: `NEXT_PUBLIC_API_URL` = Render API URL.
- [ ] Both deployed; health check and login flow tested.
