# 🚀 Deployment Checklist

Quick reference checklist for deploying your Financial Backtesting Platform.

## Pre-Deployment

- [x] Backend deployed on Railway
- [ ] Get Alpha Vantage API key: https://www.alphavantage.co/support/#api-key
- [ ] Generate secure SECRET_KEY: `openssl rand -hex 32`

## Railway Setup

### 1. Database (PostgreSQL)

- [ ] Add PostgreSQL service to Railway project
- [ ] Copy `DATABASE_URL` from PostgreSQL service
- [ ] Add to backend variables as `DATABASE_URL` (with `+asyncpg` prefix)
- [ ] Verify format: `postgresql+asyncpg://user:pass@host:port/database`

### 2. Redis Cache

- [ ] Add Redis service to Railway project
- [ ] Copy `REDIS_URL` from Redis service
- [ ] Add to backend variables as `REDIS_URL`

### 3. Backend Environment Variables

Go to backend service → Variables tab:

**Required:**
- [ ] `DATABASE_URL` - From PostgreSQL (with `+asyncpg`)
- [ ] `REDIS_URL` - From Redis
- [ ] `SECRET_KEY` - Generate with `openssl rand -hex 32`
- [ ] `ENVIRONMENT` - Set to `production`
- [ ] `DEBUG` - Set to `False`

**Recommended:**
- [ ] `ALPHA_VANTAGE_API_KEY` - Your API key
- [ ] `CORS_ORIGINS` - Will add frontend URL later

### 4. Frontend Deployment

- [ ] Create new service from GitHub repo
- [ ] Set root directory: `frontend`
- [ ] Set build command: `npm run build`
- [ ] Add script to `frontend/package.json`:
  ```json
  "preview:prod": "vite preview --host 0.0.0.0 --port $PORT"
  ```
- [ ] Set start command: `npm run preview:prod`
- [ ] Generate public domain
- [ ] Add environment variable:
  - `VITE_API_URL` = `https://your-backend-url.railway.app/api/v1`

### 5. Update CORS

- [ ] Copy frontend URL from Railway
- [ ] Go to backend variables
- [ ] Update `CORS_ORIGINS`:
  ```
  '["https://your-frontend-url.railway.app","http://localhost:5173"]'
  ```
- [ ] Wait for auto-redeploy

### 6. Database Migrations

- [ ] Install Railway CLI (optional): `npm install -g @railway/cli`
- [ ] Run migrations:
  ```bash
  railway run alembic upgrade head
  ```
  Or locally:
  ```bash
  export DATABASE_URL="postgresql+asyncpg://..."
  cd backend
  alembic upgrade head
  ```

## Testing

### Backend
- [ ] Visit: `https://your-backend-url.railway.app/health`
- [ ] Should return: `{"status": "healthy"}`
- [ ] Visit: `https://your-backend-url.railway.app/api/v1/docs`
- [ ] Should show Swagger API documentation

### Frontend
- [ ] Visit: `https://your-frontend-url.railway.app`
- [ ] Check browser console for errors
- [ ] Verify API calls work (Network tab)

### End-to-End
- [ ] Create a test backtest
- [ ] Verify data fetches correctly
- [ ] Check results display properly

## Post-Deployment (Optional)

- [ ] Set up custom domain
- [ ] Get additional API keys (Polygon, IEX Cloud)
- [ ] Set up monitoring (UptimeRobot, etc.)
- [ ] Configure database backups
- [ ] Review and optimize Railway plan

## Quick Commands

```bash
# Generate SECRET_KEY
openssl rand -hex 32

# Run migrations
railway run alembic upgrade head

# Check backend health
curl https://your-backend-url.railway.app/health

# View logs
railway logs
```

## URLs to Save

- Backend: `https://your-backend-url.railway.app`
- Frontend: `https://your-frontend-url.railway.app`
- API Docs: `https://your-backend-url.railway.app/api/v1/docs`
- Health: `https://your-backend-url.railway.app/health`

---

**For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**
