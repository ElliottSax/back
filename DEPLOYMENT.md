# Production Deployment Guide

This guide walks you through deploying the Financial Backtesting Platform to production on Railway.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Backend Deployment](#backend-deployment)
4. [Database Setup](#database-setup)
5. [Redis Setup](#redis-setup)
6. [Frontend Deployment](#frontend-deployment)
7. [Environment Variables](#environment-variables)
8. [Testing Your Deployment](#testing-your-deployment)
9. [Post-Deployment Configuration](#post-deployment-configuration)
10. [Troubleshooting](#troubleshooting)

---

## Overview

**Architecture:**
- **Backend**: FastAPI (Python 3.13) on Railway
- **Frontend**: React + Vite on Railway  
- **Database**: PostgreSQL on Railway
- **Cache**: Redis on Railway

**Current Status:**
- ✅ Backend is deployed and running
- ⏳ Need to set up database
- ⏳ Need to set up Redis
- ⏳ Need to deploy frontend
- ⏳ Need to configure environment variables

---

## Prerequisites

- [x] Railway account (free tier works)
- [ ] Alpha Vantage API key (free): https://www.alphavantage.co/support/#api-key
- [ ] (Optional) Polygon.io API key: https://polygon.io/
- [ ] (Optional) IEX Cloud API key: https://iexcloud.io/

---

## Backend Deployment

### ✅ Already Deployed!

Your backend is already running on Railway. You can access it at:
- **Backend URL**: Check your Railway dashboard for the public URL
- **API Docs**: `https://your-backend-url.railway.app/api/v1/docs`
- **Health Check**: `https://your-backend-url.railway.app/health`

### Current Configuration

The backend uses these key files:
- `runtime.txt` - Forces Python 3.11.9
- `.python-version` - Python version specification
- `railway.toml` - Railway build configuration
- `backend/requirements.txt` - Python dependencies

---

## Database Setup

### Step 1: Add PostgreSQL to Railway

1. Go to your Railway project dashboard
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a PostgreSQL database and provide connection credentials

### Step 2: Get Database URL

1. Click on your PostgreSQL service
2. Go to the **"Variables"** tab
3. Copy the `DATABASE_URL` value (it looks like: `postgresql://user:pass@host:port/database`)

### Step 3: Update Backend Environment Variables

1. Go to your **backend service** in Railway
2. Go to **"Variables"** tab
3. Add a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste the PostgreSQL URL but **change the prefix**:
     ```
     # Railway gives you:
     postgresql://user:pass@host:port/database
     
     # Change it to:
     postgresql+asyncpg://user:pass@host:port/database
     ```
     (Add `+asyncpg` after `postgresql`)

### Step 4: Run Database Migrations

Once the database is connected, you'll need to run Alembic migrations:

```bash
# On your local machine (connected to Railway database)
cd backend
alembic upgrade head
```

Or via Railway CLI:
```bash
railway run alembic upgrade head
```

---

## Redis Setup

### Step 1: Add Redis to Railway

1. Go to your Railway project dashboard
2. Click **"+ New"** → **"Database"** → **"Add Redis"**
3. Railway will create a Redis instance

### Step 2: Get Redis URL

1. Click on your Redis service
2. Go to the **"Variables"** tab
3. Copy the `REDIS_URL` value

### Step 3: Add to Backend Variables

1. Go to your **backend service**
2. Go to **"Variables"** tab
3. Add a new variable:
   - **Name**: `REDIS_URL`
   - **Value**: Paste the Redis URL from step 2

---

## Frontend Deployment

### Step 1: Create Frontend Service on Railway

1. In your Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Railway will detect it's a monorepo

### Step 2: Configure Frontend Build

1. Click on the new service
2. Go to **"Settings"** tab
3. Configure the build:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run preview` or use a static server

**Alternative: Use Vite's preview server**
Create a `package.json` script:
```json
"scripts": {
  "preview:prod": "vite preview --host 0.0.0.0 --port $PORT"
}
```

Then set:
- **Start Command**: `npm run preview:prod`

### Step 3: Set Frontend Environment Variables

1. In the frontend service, go to **"Variables"** tab
2. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.railway.app/api/v1`
     (Use your actual backend URL from Railway)

### Step 4: Enable Public Networking

1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"** to get a public URL

---

## Environment Variables

### Backend Environment Variables (Complete List)

Go to your backend service → **Variables** tab and add:

#### Required Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `ENVIRONMENT` | `production` | |
| `DEBUG` | `False` | Set to False in production |
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@host:port/db` | From Railway PostgreSQL |
| `REDIS_URL` | `redis://...` | From Railway Redis |
| `SECRET_KEY` | Generate using `openssl rand -hex 32` | **IMPORTANT: Change this!** |
| `CORS_ORIGINS` | `'["https://your-frontend-url.railway.app"]'` | Add your frontend URL |

#### Optional But Recommended

| Variable | Value | Notes |
|----------|-------|-------|
| `ALPHA_VANTAGE_API_KEY` | Your API key | For stock data |
| `POLYGON_API_KEY` | Your API key | For enhanced market data |
| `IEX_CLOUD_API_KEY` | Your API key | For market data |

#### Optional Configuration

| Variable | Default | Notes |
|----------|---------|-------|
| `APP_NAME` | `Financial Backtesting Platform` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT token expiration |
| `RATE_LIMIT_PER_MINUTE` | `60` | API rate limiting |
| `DATA_CACHE_TTL` | `3600` | Cache TTL in seconds |

### Frontend Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://your-backend-url.railway.app/api/v1` | Your backend URL |

---

## Testing Your Deployment

### 1. Test Backend

```bash
# Health check
curl https://your-backend-url.railway.app/health

# API docs (open in browser)
open https://your-backend-url.railway.app/api/v1/docs
```

Expected response from `/health`:
```json
{"status": "healthy"}
```

### 2. Test Database Connection

Check the backend logs in Railway:
- Look for "Starting Financial Backtesting Platform"
- Should NOT see database connection errors

### 3. Test Frontend

1. Open your frontend URL in a browser
2. Check browser console for errors
3. Verify API calls are reaching the backend

### 4. Test End-to-End

1. Open the frontend
2. Try creating a backtest
3. Check that data is being fetched from the backend
4. Verify results are displayed correctly

---

## Post-Deployment Configuration

### 1. Update CORS Origins

After deploying frontend, update your backend CORS settings:

1. Go to backend service → **Variables**
2. Update `CORS_ORIGINS` to include your frontend URL:
   ```
   '["https://your-frontend-url.railway.app","http://localhost:5173"]'
   ```
3. Redeploy backend (Railway will auto-redeploy when you change variables)

### 2. Set Up Custom Domains (Optional)

1. In Railway, go to your service → **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Add your domain and configure DNS

### 3. Set Up API Keys

Get free API keys for financial data:

1. **Alpha Vantage** (Free, recommended):
   - Go to: https://www.alphavantage.co/support/#api-key
   - Sign up and get your API key
   - Add to backend variables as `ALPHA_VANTAGE_API_KEY`

2. **Polygon.io** (Optional, paid tiers available):
   - https://polygon.io/
   
3. **IEX Cloud** (Optional):
   - https://iexcloud.io/

### 4. Generate Secure SECRET_KEY

```bash
# On your local machine, run:
openssl rand -hex 32
```

Copy the output and set it as `SECRET_KEY` in your backend variables.

---

## Monitoring & Maintenance

### View Logs

1. Go to your service in Railway
2. Click on the **"Deployments"** tab
3. Click on a deployment to see logs

### Monitor Health

Set up health check monitoring:
- Use UptimeRobot or similar
- Monitor: `https://your-backend-url.railway.app/health`

### Database Backups

Railway automatically backs up your PostgreSQL database daily on paid plans.

---

## Troubleshooting

### Backend Won't Start

**Check logs for:**
- Database connection errors → Verify `DATABASE_URL` is correct and includes `+asyncpg`
- Redis connection errors → Verify `REDIS_URL` is correct
- Import errors → Check that all packages deployed correctly

### Frontend Can't Connect to Backend

1. **Check CORS**: Make sure backend `CORS_ORIGINS` includes your frontend URL
2. **Check `VITE_API_URL`**: Must match your backend URL exactly
3. **Check Network tab**: Look for 404 or 500 errors

### Database Connection Errors

```
asyncpg.exceptions.InvalidCatalogNameError: database "xxx" does not exist
```

**Solution**: Run database migrations:
```bash
railway run alembic upgrade head
```

### CORS Errors

```
Access to XMLHttpRequest at '...' has been blocked by CORS policy
```

**Solution**: 
1. Update backend `CORS_ORIGINS` variable
2. Include your frontend URL in the JSON array
3. Railway will auto-redeploy

### 502 Bad Gateway

**Possible causes:**
- Backend is starting up (wait 30-60 seconds)
- Backend crashed (check logs)
- Wrong start command (verify `railway.toml`)

---

## Quick Reference Commands

### Generate SECRET_KEY
```bash
openssl rand -hex 32
```

### Run Database Migrations
```bash
# Local with Railway database
railway run alembic upgrade head

# Or set DATABASE_URL locally
export DATABASE_URL="postgresql+asyncpg://..."
alembic upgrade head
```

### Check Backend Health
```bash
curl https://your-backend-url.railway.app/health
```

### View Railway Logs
```bash
railway logs
```

---

## Next Steps

- [ ] Set up PostgreSQL database
- [ ] Set up Redis cache
- [ ] Configure all environment variables
- [ ] Deploy frontend
- [ ] Get API keys for financial data
- [ ] Run database migrations
- [ ] Test end-to-end functionality
- [ ] Set up custom domain (optional)
- [ ] Enable monitoring

---

## Support

For issues:
1. Check the logs in Railway dashboard
2. Verify all environment variables are set
3. Review this deployment guide
4. Check Railway documentation: https://docs.railway.app/

**Common Issues & Solutions**: See [Troubleshooting](#troubleshooting) section above.
