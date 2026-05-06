# Deploy DevTrack on Railway

## What You'll Deploy

```
Railway Project
├── Service 1: Backend (Node.js)     → https://devtrack-backend.up.railway.app
├── Service 2: Frontend (React)      → https://devtrack-frontend.up.railway.app
└── Service 3: MySQL Database        → Internal connection
```

---

## Prerequisites

1. **GitHub account** — push your code there first
2. **Railway account** — sign up free at https://railway.app

---

## Step 1: Push Code to GitHub

```bash
# In your project root
git init
git add .
git commit -m "Initial commit - DevTrack"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/devtrack.git
git push -u origin main
```

---

## Step 2: Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account
5. Select your `devtrack` repository

---

## Step 3: Add MySQL Database

1. In your Railway project, click **"+ New Service"**
2. Select **"Database"** → **"MySQL"**
3. Railway creates a MySQL instance automatically
4. Click on the MySQL service → **"Variables"** tab
5. Note these values (you'll need them):
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_DATABASE`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`

---

## Step 4: Deploy the Backend

1. In your Railway project, click **"+ New Service"**
2. Select **"GitHub Repo"**
3. Select your repo
4. Set the **Root Directory** to: `backend`
5. Go to **"Variables"** tab and add:

```
NODE_ENV=production
PORT=5000
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
JWT_SECRET=your_super_secret_key_change_this_123456
JWT_EXPIRES_IN=8h
FRONTEND_URL=https://devtrack-frontend.up.railway.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your_gmail_app_password
```

> **Note**: Replace `${{MySQL.MYSQL_HOST}}` etc. with the actual values from Step 3,
> OR Railway can auto-reference them using the `${{ServiceName.VARIABLE}}` syntax.

6. Go to **"Settings"** → set **Start Command**: `node src/server.js`
7. Click **"Deploy"**
8. Wait for deployment → copy the backend URL (e.g. `https://devtrack-backend.up.railway.app`)

---

## Step 5: Deploy the Frontend

1. Click **"+ New Service"** → **"GitHub Repo"**
2. Select your repo
3. Set **Root Directory** to: `frontend`
4. Go to **"Variables"** tab and add:

```
VITE_API_URL=https://devtrack-backend.up.railway.app
```

> Replace with your actual backend URL from Step 4.

5. Go to **"Settings"** → set **Build Command**: `npm install && npm run build`
6. Set **Start Command**: `npx serve -s dist -l 3000`
7. Click **"Deploy"**
8. Copy the frontend URL (e.g. `https://devtrack-frontend.up.railway.app`)

---

## Step 6: Update Backend FRONTEND_URL

1. Go back to your **Backend service** → **Variables**
2. Update `FRONTEND_URL` to your actual frontend URL:
   ```
   FRONTEND_URL=https://devtrack-frontend.up.railway.app
   ```
3. Railway will auto-redeploy

---

## Step 7: Seed the Database

After backend is running, seed sample data:

1. Go to Railway → Backend service → **"Shell"** tab (or use Railway CLI)
2. Run:
   ```bash
   node src/scripts/seed.js
   ```

OR add a one-time seed command in the backend Variables:
```
SEED_ON_START=true
```

---

## Step 8: Test Your Deployment

Open your frontend URL in browser:
```
https://devtrack-frontend.up.railway.app
```

Login with:
- Admin: admin@example.com / Admin@123
- Employee: employee1@example.com / Employee@123

---

## Step 9: Update VS Code Extension for Production

Update the extension's default API URL in `vscode-extension/package.json`:

```json
"employeeTracker.apiUrl": {
  "type": "string",
  "default": "https://devtrack-backend.up.railway.app",
  "description": "Employee Tracker API URL"
}
```

Then recompile:
```bash
cd vscode-extension
npm run compile
```

---

## Environment Variables Summary

### Backend Variables
| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `DB_HOST` | From Railway MySQL |
| `DB_PORT` | From Railway MySQL |
| `DB_NAME` | From Railway MySQL |
| `DB_USER` | From Railway MySQL |
| `DB_PASSWORD` | From Railway MySQL |
| `JWT_SECRET` | Any long random string |
| `JWT_EXPIRES_IN` | `8h` |
| `FRONTEND_URL` | Your Railway frontend URL |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASSWORD` | Gmail App Password |

### Frontend Variables
| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway backend URL |

---

## Gmail App Password Setup

Gmail requires an App Password (not your regular password):

1. Go to https://myaccount.google.com
2. Security → 2-Step Verification (enable if not already)
3. Security → App passwords
4. Select app: "Mail", device: "Other" → type "DevTrack"
5. Copy the 16-character password
6. Use it as `SMTP_PASSWORD`

---

## Troubleshooting

### Backend won't start
- Check all DB variables are set correctly
- Check Railway logs: Service → **"Logs"** tab

### Frontend shows blank page
- Check `VITE_API_URL` is set to backend URL (no trailing slash)
- Check browser console for CORS errors

### CORS error
- Make sure `FRONTEND_URL` in backend matches your exact frontend URL
- Include `https://` prefix

### Database connection failed
- Verify MySQL service is running in Railway
- Check DB variables match exactly

### Tasks not loading (500 error)
- Check backend logs
- Make sure database tables were created (backend auto-syncs on start)

---

## Railway Free Tier Limits

| Resource | Free Limit |
|----------|-----------|
| RAM | 512 MB per service |
| CPU | Shared |
| Bandwidth | 100 GB/month |
| Execution hours | 500 hours/month |
| MySQL storage | 1 GB |

For a small team (< 10 users), the free tier is sufficient.

---

## Custom Domain (Optional)

1. Railway service → **"Settings"** → **"Domains"**
2. Click **"+ Custom Domain"**
3. Enter your domain (e.g. `devtrack.yourcompany.com`)
4. Add the CNAME record to your DNS provider
5. Railway handles SSL automatically

---

## Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] MySQL service added
- [ ] Backend deployed with all env variables
- [ ] Frontend deployed with `VITE_API_URL`
- [ ] Backend `FRONTEND_URL` updated to frontend URL
- [ ] Database seeded
- [ ] Login tested at frontend URL
- [ ] VS Code extension updated with production URL

---

**Your app will be live at:** `https://devtrack-frontend.up.railway.app` 🚀
