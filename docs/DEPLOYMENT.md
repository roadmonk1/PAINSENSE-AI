# PAINSENSE-AI Deployment Guide

## 1. Frontend Deployment (Vercel / Netlify)

The React/Vite frontend builds directly to static assets in `frontend/dist`.

### Vercel Deployment Steps:
1. Connect Git repository to Vercel.
2. Set Root Directory to `frontend`.
3. Set Build Command: `npm run build`
4. Set Output Directory: `dist`
5. Configure Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com/api`

## 2. Backend Deployment (Render / Railway)

The backend is built with FastAPI and runs with Uvicorn.

### Render / Railway Deployment Steps:
1. Set Root Directory to `backend` (or project root).
2. Python Version: `3.11`
3. Build Command: `pip install -r backend/requirements.txt`
4. Start Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
5. Configure Environment Variables:
   - `DATABASE_URL`: PostgreSQL connection string provided by Render/Supabase
   - `SECRET_KEY`: Random 32+ character secret string
   - `CORS_ORIGINS`: `https://your-frontend-app.vercel.app`
   - `ENVIRONMENT`: `production`
   - `DEBUG`: `False`
   - `ENABLE_DEMO_MODE`: `True` (or `False` in strict production)

## 3. Environment Variables Reference

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:///./painsense.db` | SQLite or PostgreSQL connection string |
| `SECRET_KEY` | (Dev string) | Secret key for JWT token hashing |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed CORS origins (comma-separated) |
| `VITE_API_BASE_URL` | `/api` | Base endpoint for frontend proxy or cloud URL |
| `EMERGENCY_DISPATCH_PHONE`| `+18005550199` | Configured local dispatch line |
