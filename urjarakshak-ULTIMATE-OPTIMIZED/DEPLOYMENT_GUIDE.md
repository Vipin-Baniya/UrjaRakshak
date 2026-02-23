# 🚀 Complete Deployment Guide - Render + Vercel + Supabase

**Total Time**: 10-15 minutes  
**Cost**: $0/month  
**Difficulty**: Beginner-friendly

---

## 🎯 What We're Deploying

```
User Browser
    ↓
Vercel (Frontend) - Next.js app with beautiful UI
    ↓ API calls
Render (Backend) - FastAPI + Physics Engine
    ↓ Database queries
Supabase (Database) - PostgreSQL + Backups
```

**All services are FREE** and production-ready!

---

## PART 1: DATABASE (Supabase) - 3 minutes

### Step 1.1: Create Account
1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with GitHub/Email (no credit card)
4. Verify email

### Step 1.2: Create Project
1. Click **"New project"**
2. **Organization**: Select your personal org
3. **Name**: `urjarakshak` (or your choice)
4. **Database Password**: Click "Generate" → **SAVE THIS PASSWORD**
5. **Region**: Choose closest (e.g., US East)
6. **Pricing**: Free (already selected)
7. Click **"Create new project"**
8. ⏱️ Wait 2 minutes for provisioning

### Step 1.3: Run Database Schema
1. Left sidebar → Click **"SQL Editor"**
2. Click **"New query"**
3. Open file: `deployment/supabase/schema.sql`
4. Copy ALL the SQL
5. Paste into Supabase SQL Editor
6. Click **"Run"** (or Ctrl+Enter)
7. Should see: ✅ "Success. No rows returned"

### Step 1.4: Get Connection String
1. Click **Settings** (gear icon, bottom left)
2. Click **"Database"** in sidebar
3. Scroll to **"Connection string"** section
4. Select **"URI"** tab
5. Copy the string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
6. **Replace `[YOUR-PASSWORD]`** with the password you saved in Step 1.2

Example:
```
# Before:
postgresql://postgres:[YOUR-PASSWORD]@db.abcd1234.supabase.co:5432/postgres

# After:
postgresql://postgres:MySecure123Pass@db.abcd1234.supabase.co:5432/postgres
```

⚠️ **SAVE THIS COMPLETE URL** - you'll need it for Render!

✅ **Database Ready!**

---

## PART 2: BACKEND (Render) - 5 minutes

### Step 2.1: Create Account
1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended) or Email
4. No credit card required!

### Step 2.2: Deploy Backend

**Option A: From GitHub (Recommended)**

1. Push your code to GitHub first:
   ```bash
   cd urjarakshak-ULTIMATE-OPTIMIZED
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR-USERNAME/urjarakshak.git
   git push -u origin main
   ```

2. In Render dashboard:
   - Click **"New +"** → **"Web Service"**
   - Click **"Connect GitHub"** → Authorize Render
   - Select your `urjarakshak` repository
   - Click **"Connect"**

**Option B: Manual Upload**

1. Create ZIP of backend folder:
   ```bash
   cd backend
   zip -r backend.zip .
   ```
2. In Render dashboard:
   - Click **"New +"** → **"Web Service"**
   - Select **"Deploy from ZIP"**
   - Upload `backend.zip`

### Step 2.3: Configure Service

Fill in these settings:

**Basic Settings:**
- **Name**: `urjarakshak-backend` (or your choice)
- **Region**: US East (or closest to you)
- **Branch**: `main` (if from GitHub)
- **Root Directory**: `backend` (if from GitHub)
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Plan:**
- Select **"Free"** plan

**Advanced:**
- **Auto-Deploy**: Yes (if from GitHub)

### Step 2.4: Add Environment Variables

Scroll to **"Environment"** section, click **"Add Environment Variable"**:

Add these variables:

1. **DATABASE_URL**
   - Value: Your Supabase URL from Part 1, Step 1.4
   - Example: `postgresql://postgres:MySecure123Pass@db.abcd1234.supabase.co:5432/postgres`

2. **SECRET_KEY**
   - Click **"Generate"** to create random 32+ character string
   - Or create manually: visit https://www.random.org/strings/
   - Generate 1 string, 64 characters long, a-z A-Z 0-9
   - Copy and paste

3. **ENVIRONMENT**
   - Value: `production`

4. **DEBUG**
   - Value: `false`

5. **ENABLE_STRICT_ETHICS**
   - Value: `true`

### Step 2.5: Deploy

1. Click **"Create Web Service"**
2. ⏱️ Wait 3-5 minutes for:
   - Building (installing dependencies)
   - Starting service
   - Health check

You'll see build logs in real-time.

### Step 2.6: Get Your Backend URL

Once deployed (status shows "Live"):
1. Top of page shows your URL: `https://urjarakshak-backend.onrender.com`
2. Or click the URL next to your service name
3. **Copy this URL** - you'll need it for frontend!

### Step 2.7: Test Backend

Open in browser:
```
https://YOUR-SERVICE-NAME.onrender.com/health
```

Should see:
```json
{
  "status": "healthy",
  "components": {
    "database": {"status": "healthy"},
    "physics_engine": {"status": "active"}
  }
}
```

✅ **Backend Live!**

---

## PART 3: FRONTEND (Vercel) - 4 minutes

### Step 3.1: Create Account
1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended)
4. Authorize Vercel
5. No credit card required!

### Step 3.2: Deploy Frontend

**Option A: From GitHub (Recommended)**

1. Make sure your code is on GitHub (see Part 2, Step 2.2)
2. In Vercel dashboard:
   - Click **"Add New..."** → **"Project"**
   - Click **"Import Git Repository"**
   - Select your `urjarakshak` repository
   - Click **"Import"**

**Option B: Manual Upload**

1. Vercel dashboard → **"Add New..."** → **"Project"**
2. Drag and drop your `frontend` folder

### Step 3.3: Configure Project

**Framework Preset:** Next.js (auto-detected)

**Build Settings:**
- **Framework**: Next.js
- **Root Directory**: `frontend` (if deploying from repo root)
- **Build Command**: `npm run build` (auto-filled)
- **Output Directory**: `out` (auto-filled)
- **Install Command**: `npm install` (auto-filled)

**Environment Variables:**

Click **"Add"** and add:

1. **NEXT_PUBLIC_API_URL**
   - Value: Your Render backend URL from Part 2, Step 2.6
   - Example: `https://urjarakshak-backend.onrender.com`
   - ⚠️ No trailing slash!

### Step 3.4: Deploy

1. Click **"Deploy"**
2. ⏱️ Wait 2-3 minutes for:
   - Installing dependencies
   - Building Next.js app
   - Deploying to edge network

You'll see build logs in real-time.

### Step 3.5: Get Your Frontend URL

Once deployed:
1. You'll see: 🎉 "Your project is ready!"
2. URL shown: `https://urjarakshak.vercel.app` (or similar)
3. Click **"Visit"** to open your site
4. **Copy this URL** - you'll need it for CORS!

✅ **Frontend Live!**

---

## PART 4: CONFIGURE CORS - 2 minutes

Your backend needs to allow requests from your frontend.

### Step 4.1: Add Frontend URL to Backend

1. Go to **Render dashboard**
2. Click on your backend service
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"**

Add:
- **Key**: `ALLOWED_ORIGINS`
- **Value**: Your Vercel URL from Part 3, Step 3.5
  - Example: `https://urjarakshak.vercel.app`
  - Include `http://localhost:3000` for local dev:
    ```
    https://urjarakshak.vercel.app,http://localhost:3000
    ```

5. Click **"Save Changes"**

### Step 4.2: Redeploy Backend

Render will automatically redeploy with new env variable.

Wait 1-2 minutes, then verify.

✅ **CORS Configured!**

---

## 🎉 DEPLOYMENT COMPLETE!

### Your Live URLs

**Frontend (Website):**
```
https://your-app.vercel.app
```

**Backend (API):**
```
https://your-backend.onrender.com
```

**API Documentation:**
```
https://your-backend.onrender.com/api/docs
```

**Database Dashboard:**
```
https://app.supabase.com
```

---

## ✅ Verification Tests

### Test 1: Frontend Loads
Open: `https://your-app.vercel.app`

Should see:
- ⚡ UrjaRakshak branding
- Hero section with "Physics-Based Grid Intelligence"
- Features grid
- "Launch Dashboard" button

### Test 2: Backend Health
```bash
curl https://your-backend.onrender.com/health
```

Should return:
```json
{"status": "healthy", "components": {...}}
```

### Test 3: Physics Engine
```bash
curl https://your-backend.onrender.com/api/v1/physics/info
```

Should return physics engine configuration.

### Test 4: Full Analysis
```bash
curl -X POST https://your-backend.onrender.com/api/v1/analysis/validate \
  -H "Content-Type: application/json" \
  -d '{
    "substation_id": "TEST001",
    "input_energy_mwh": 1000,
    "output_energy_mwh": 975,
    "components": [{
      "component_id": "TX001",
      "component_type": "transformer",
      "rated_capacity_kva": 1000,
      "efficiency_rating": 0.98,
      "age_years": 10
    }]
  }'
```

Should return detailed physics analysis.

---

## 🆘 Troubleshooting

### Render: "Application failed to respond"

**Check build logs:**
1. Render dashboard → Your service → "Logs" tab
2. Look for errors in build or startup

**Common fixes:**
- Missing `DATABASE_URL` → Add in Environment
- Wrong `START_COMMAND` → Should be: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Python version → Add env var: `PYTHON_VERSION=3.11.0`

### Vercel: Build failed

**Check deployment logs:**
1. Vercel dashboard → Your project → "Deployments"
2. Click failed deployment → View logs

**Common fixes:**
- Missing `NEXT_PUBLIC_API_URL` → Add in Project Settings → Environment Variables
- Wrong Node version → It auto-detects, but you can specify in `package.json`

### CORS Errors in Browser Console

**Error**: "Access-Control-Allow-Origin"

**Fix:**
1. Render → Your service → Environment
2. Check `ALLOWED_ORIGINS` has your Vercel URL
3. Redeploy if you just added it
4. Clear browser cache

### Database Connection Failed

**Error in Render logs**: "Connection refused" or "Authentication failed"

**Fix:**
1. Check `DATABASE_URL` is correct
2. Password has no special characters that need escaping
3. Supabase project is active (not paused)
4. Try connection from Render:
   ```bash
   # In Render shell
   psql $DATABASE_URL
   ```

---

## 🎓 What's Next?

### Add Custom Domain

**Vercel (Frontend):**
1. Vercel → Your project → Settings → Domains
2. Add your domain (e.g., `urjarakshak.com`)
3. Update DNS records as shown
4. Wait for SSL provisioning (automatic)

**Render (Backend):**
1. Render → Your service → Settings → Custom Domains
2. Add your domain (e.g., `api.urjarakshak.com`)
3. Add CNAME record in DNS
4. SSL automatic

### Monitor Your Services

**Render:**
- Dashboard shows CPU, memory, requests
- Set up alerts in Settings

**Vercel:**
- Analytics tab shows usage, performance
- Real user monitoring included

**Supabase:**
- Reports tab shows database performance
- Query insights available

### Scale When Needed

**Free tier supports:**
- 1,000+ daily users
- 10,000+ API requests/day
- 500MB database

**Upgrade when:**
- Need 99.9% uptime SLA
- > 2GB database
- Custom support

**Costs after free tier:**
- Render: $7/month (Starter)
- Vercel: $20/month (Pro)
- Supabase: $25/month (Pro)
- **Total: ~$52/month** for production scale

---

## 📞 Getting Help

**Documentation:**
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs

**Community:**
- Render Community: https://community.render.com
- Vercel Discord: https://vercel.com/discord
- Supabase Discord: https://discord.supabase.com

**This Project:**
- README.md for features & architecture
- backend/app/ for code inspection
- frontend/src/ for UI components

---

## ✅ Final Checklist

- [ ] Supabase project created & schema loaded
- [ ] DATABASE_URL copied with password
- [ ] Render account created
- [ ] Backend deployed on Render
- [ ] All 5 environment variables set on Render
- [ ] Backend health check passes
- [ ] Backend URL copied
- [ ] Vercel account created
- [ ] Frontend deployed on Vercel
- [ ] NEXT_PUBLIC_API_URL set on Vercel
- [ ] Frontend loads correctly
- [ ] ALLOWED_ORIGINS set on Render backend
- [ ] Backend redeployed with CORS
- [ ] End-to-end test passes (frontend → backend → database)

---

**🎉 Congratulations! You're live on the internet!**

**Cost: $0/month** | **Deploy time: 10-15 minutes** | **Production-ready: ✅**

⚡ **Welcome to UrjaRakshak!**
