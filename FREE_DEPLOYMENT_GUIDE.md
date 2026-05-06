# DevTrack — Free Deployment Guide
## Vercel (Frontend) + Render (Backend) + Clever Cloud (MySQL)

All three platforms are **100% free** with no credit card required.

---

## Architecture After Deployment

```
Users
  │
  ▼
Vercel (Frontend)                    https://devtrack.vercel.app
  │  axios requests
  ▼
Render (Backend API)                 https://devtrack-api.onrender.com
  │  SQL queries
  ▼
Clever Cloud (MySQL Database)        Internal connection
```

---

## PART 1 — Database on Clever Cloud

### Step 1: Create Clever Cloud Account
1. Go to https://www.clever-cloud.com
2. Click **"Sign up"** → use GitHub login (easiest)
3. Verify your email

### Step 2: Create MySQL Add-on
1. In Clever Cloud dashboard, click **"Create"** → **"an add-on"**
2. Select **"MySQL"**
3. Choose plan: **"DEV"** (free — 10MB, 5 connections)
4. Name it: `devtrack-db`
5. Click **"Create"**

### Step 3: Get Connection Details
After creation, click on your MySQL add-on → **"Information"** tab.

Copy these values — you'll need them for Render:

```
MYSQL_ADDON_HOST     = bxxxxxxx-mysql.services.clever-cloud.com
MYSQL_ADDON_PORT     = 3306
MYSQL_ADDON_DB       = bxxxxxxx
MYSQL_ADDON_USER     = uxxxxxxx
MYSQL_ADDON_PASSWORD = xxxxxxxxxx
MYSQL_ADDON_URI      = mysql://uxxxxxxx:xxxxxxxxxx@bxxxxxxx-mysql.services.clever-cloud.com:3306/bxxxxxxx
```

> **Save the `MYSQL_ADDON_URI`** — this is the most important one.

---

## PART 2 — Backend on Render

### Step 1: Create Render Account
1. Go to https://render.com
2. Click **"Get Started"** → sign up with GitHub

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo: `Employee-Task-Time-Tracking-System`
3. Configure:
   - **Name**: `devtrack-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Plan**: `Free`

### Step 3: Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"** and add each one:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MYSQL_ADDON_URI` | *(paste the full URI from Clever Cloud)* |
| `JWT_SECRET` | `devtrack_super_secret_key_2026_change_me` |
| `JWT_EXPIRES_IN` | `8h` |
| `FRONTEND_URL` | `https://devtrack.vercel.app` *(update after Vercel deploy)* |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `your@gmail.com` |
| `SMTP_PASSWORD` | `your_gmail_app_password` |

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait 3-5 minutes for first deploy
3. Check logs — you should see:
   ```
   ✅ Database connection established successfully.
   🚀 Server running on port 5000
   ```
4. Copy your backend URL: `https://devtrack-backend.onrender.com`

### Step 5: Test Backend
Open in browser:
```
https://devtrack-backend.onrender.com/health
```
Should return: `{"success":true,"message":"Server is running",...}`

---

## PART 3 — Frontend on Vercel

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Click **"Sign Up"** → use GitHub login

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Select your GitHub repo: `Employee-Task-Time-Tracking-System`
3. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Add Environment Variable
Under **"Environment Variables"**, add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://devtrack-backend.onrender.com` |

> Replace with your actual Render backend URL.

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your app is live at: `https://devtrack-XXXX.vercel.app`
4. Vercel also gives you a custom URL — click **"Visit"** to see it

### Step 5: Update Backend FRONTEND_URL
1. Go back to **Render** → your backend service → **"Environment"**
2. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://devtrack.vercel.app
   ```
3. Click **"Save Changes"** — Render auto-redeploys

---

## PART 4 — Seed the Database

After both services are running, seed sample data:

### Option A: Using Render Shell
1. Render dashboard → your backend service
2. Click **"Shell"** tab
3. Run:
   ```bash
   node src/scripts/seed.js
   ```

### Option B: Trigger via API (if shell not available on free tier)
Add this temporary endpoint — or just register users manually through the app.

---

## PART 5 — Test Everything

### 1. Open your Vercel URL
```
https://devtrack.vercel.app
```

### 2. Login with seeded accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin@123 |
| Manager | manager@example.com | Manager@123 |
| Team Lead | teamlead@example.com | TeamLead@123 |
| Employee | employee1@example.com | Employee@123 |

### 3. Test the full flow
1. Login as Team Lead → Create a task → Assign to employee
2. Login as Employee → See task in web app
3. Open VS Code extension → Login → See task in sidebar

---

## PART 6 — Update VS Code Extension

Update the default API URL in `vscode-extension/package.json`:

```json
"employeeTracker.apiUrl": {
  "type": "string",
  "default": "https://devtrack-backend.onrender.com",
  "description": "Employee Tracker API URL"
}
```

Recompile and push:
```bash
cd vscode-extension
npm run compile
cd ..
git add vscode-extension/package.json vscode-extension/out/
git commit -m "chore: update extension default API URL to production"
git push
```

---

## Important Notes

### Render Free Tier — Sleep Behavior
- Free services **spin down after 15 minutes of inactivity**
- First request after sleep takes **~30 seconds** to wake up
- This is normal — subsequent requests are fast

**To avoid this**, you can use a free uptime monitor:
- https://uptimerobot.com (free)
- Add your backend health URL: `https://devtrack-backend.onrender.com/health`
- Set check interval: every 14 minutes
- This keeps your backend awake 24/7

### Clever Cloud Free Tier Limits
- 10MB storage (enough for ~10,000 tasks)
- 5 simultaneous connections
- No automatic backups on free tier

### Vercel Free Tier
- Unlimited deployments
- 100GB bandwidth/month
- No sleep — always fast

---

## Environment Variables Summary

### Render (Backend)
```
NODE_ENV=production
PORT=5000
MYSQL_ADDON_URI=mysql://user:pass@host:3306/dbname
JWT_SECRET=your_long_random_secret_key
JWT_EXPIRES_IN=8h
FRONTEND_URL=https://your-app.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your_app_password
```

### Vercel (Frontend)
```
VITE_API_URL=https://your-backend.onrender.com
```

---

## Gmail App Password Setup

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required)
3. Search for **"App passwords"**
4. Select: App = "Mail", Device = "Other" → name it "DevTrack"
5. Copy the 16-character password
6. Use it as `SMTP_PASSWORD` in Render

---

## Troubleshooting

### "Application Error" on Vercel
- Check `VITE_API_URL` is set correctly (no trailing slash)
- Redeploy: Vercel dashboard → Deployments → Redeploy

### Backend returns 502/503
- Check Render logs for errors
- Verify `MYSQL_ADDON_URI` is correct
- Make sure Clever Cloud MySQL is running

### CORS Error in browser console
- `FRONTEND_URL` in Render must exactly match your Vercel URL
- Include `https://` — no trailing slash

### Database connection failed
- Copy the full `MYSQL_ADDON_URI` from Clever Cloud exactly
- Check Clever Cloud → MySQL → Status is "Running"

### Tasks not loading (500 error)
- Backend logs will show the exact SQL error
- Check Render → Logs tab

---

## Quick Checklist

- [ ] Clever Cloud account created
- [ ] MySQL add-on created (DEV plan)
- [ ] `MYSQL_ADDON_URI` copied
- [ ] Render account created
- [ ] Backend deployed with all env variables
- [ ] Backend health check returns 200
- [ ] Vercel account created
- [ ] Frontend deployed with `VITE_API_URL`
- [ ] `FRONTEND_URL` in Render updated to Vercel URL
- [ ] Database seeded with sample data
- [ ] Login tested at Vercel URL
- [ ] UptimeRobot set up to keep backend awake (optional)
- [ ] VS Code extension updated with production URL

---

## Your Live URLs

After deployment:
- **Frontend**: `https://devtrack.vercel.app`
- **Backend API**: `https://devtrack-backend.onrender.com`
- **Health Check**: `https://devtrack-backend.onrender.com/health`

**Total cost: $0/month** 🎉
