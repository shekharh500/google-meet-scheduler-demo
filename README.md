# Google Meet Scheduler

A self-hosted meeting scheduler with Google Calendar integration and automatic Google Meet link generation.

---

## What's Inside

```
google-meet-scheduler-demo/
├── index.html              # Demo only (try UI without backend)
├── frontend/
│   └── index.html          # Production frontend (USE THIS)
├── backend/
│   ├── server.js           # Backend API (USE THIS)
│   ├── package.json
│   ├── .env.example        # Environment template
│   └── vercel.json         # Vercel config
└── README.md
```

| File | Purpose | Use For |
|------|---------|---------|
| `index.html` (root) | Demo - simulated booking, OTP: `123456` | Testing UI only |
| `frontend/index.html` | **Production frontend** | **Your live site** |
| `backend/` | **Production backend API** | **Your Vercel API** |

---

## Features

- Interactive calendar with real-time availability
- Automatic Google Meet link generation
- Email verification via OTP (prevents spam)
- Business email validation (blocks Gmail, Yahoo, etc.)
- One booking per email (prevents duplicates)
- Calendar invites sent automatically
- Mobile responsive design

---

## Complete Deployment Guide

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [Vercel account](https://vercel.com/) (free)
- [Google Cloud account](https://console.cloud.google.com/) (free)
- [GitHub account](https://github.com/) (free)

---

## Step 1: Fork/Clone the Repository

```bash
# Option A: Clone directly
git clone https://github.com/shekharh500/google-meet-scheduler-demo.git
cd google-meet-scheduler-demo

# Option B: Fork on GitHub first, then clone your fork
```

---

## Step 2: Google Cloud Setup (5 minutes)

### 2.1 Create a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name it (e.g., "Meeting Scheduler")
4. Click **Create**

### 2.2 Enable APIs

1. Go to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - **Google Calendar API** → Click **Enable**
   - **Gmail API** → Click **Enable**

### 2.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** → Click **Create**
3. Fill in:
   - App name: `Meeting Scheduler`
   - User support email: Your email
   - Developer contact email: Your email
4. Click **Save and Continue**
5. **Scopes page**: Click **Add or Remove Scopes**
   - Add: `https://www.googleapis.com/auth/calendar`
   - Add: `https://www.googleapis.com/auth/calendar.events`
   - Add: `https://www.googleapis.com/auth/gmail.send`
6. Click **Save and Continue**
7. **Test users page**: Click **Add Users**
   - Add your Gmail address
8. Click **Save and Continue**

### 2.4 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Name it: `Meeting Scheduler Web`
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/auth/callback
   ```
6. Click **Create**
7. **SAVE** the `Client ID` and `Client Secret` (you'll need these!)

---

## Step 3: Test Locally (5 minutes)

### 3.1 Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 3.2 Edit `.env` File

Open `backend/.env` and fill in your values:

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=http://localhost:3000/auth/callback
FRONTEND_URL=http://localhost:5500
OWNER_EMAIL=your@email.com
OWNER_NAME=Your Name
```

### 3.3 Start Backend

```bash
npm start
```

You should see:
```
====================================
  Google Meet Scheduler API
====================================
  Port: 3000
  Connected: No
  Setup: http://localhost:3000/auth/setup
====================================
```

### 3.4 Connect Google Calendar

1. Open browser: http://localhost:3000/auth/setup
2. Sign in with your Google account
3. Grant all permissions
4. You'll see **"Success!"**

### 3.5 Test Frontend

Open a new terminal:

```bash
cd frontend

# Serve the frontend (choose one method)
npx serve -p 5500
# OR
python -m http.server 5500
# OR
php -S localhost:5500
```

Open http://localhost:5500 and test a booking!

---

## Step 4: Deploy Backend to Vercel (5 minutes)

### 4.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 4.2 Login to Vercel

```bash
vercel login
```

### 4.3 Deploy Backend

```bash
cd backend
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? `meet-scheduler-api` (or your choice)
- Directory? `./`
- Override settings? **N**

After deployment, you'll get a URL like:
```
https://meet-scheduler-api-xxxxx.vercel.app
```

**Save this URL!** This is your `BACKEND_URL`.

### 4.4 Add Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project (`meet-scheduler-api`)
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Name | Value |
|------|-------|
| `GOOGLE_CLIENT_ID` | Your Client ID from Google |
| `GOOGLE_CLIENT_SECRET` | Your Client Secret from Google |
| `REDIRECT_URI` | `https://YOUR-PROJECT.vercel.app/auth/callback` |
| `FRONTEND_URL` | `https://YOUR-FRONTEND.vercel.app` (add after Step 5) |
| `OWNER_EMAIL` | Your email address |
| `OWNER_NAME` | Your name |

### 4.5 Update Google Cloud Redirect URI

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **APIs & Services** → **Credentials**
3. Click your OAuth client
4. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR-PROJECT.vercel.app/auth/callback
   ```
5. Click **Save**

### 4.6 Connect Google Calendar on Vercel

1. Visit: `https://YOUR-PROJECT.vercel.app/auth/setup`
2. Sign in with Google
3. Grant permissions
4. **Important:** You'll see a token JSON. Copy it!
5. Go back to Vercel Dashboard → Environment Variables
6. Add new variable:
   - Name: `GOOGLE_TOKENS`
   - Value: Paste the entire JSON token
7. Go to **Deployments** → Click **⋮** → **Redeploy**

---

## Step 5: Deploy Frontend to Vercel (3 minutes)

### 5.1 Update Frontend API URL

Edit `frontend/index.html`, find line ~529:

```javascript
// BEFORE
const API_BASE = 'http://localhost:3000';

// AFTER - Use your backend URL from Step 4
const API_BASE = 'https://meet-scheduler-api-xxxxx.vercel.app';
```

### 5.2 Deploy Frontend

```bash
cd frontend
vercel
```

Follow prompts similar to backend.

You'll get a URL like:
```
https://meet-scheduler-xxxxx.vercel.app
```

### 5.3 Update Backend FRONTEND_URL

1. Go to Vercel Dashboard → Backend project → Settings → Environment Variables
2. Update `FRONTEND_URL` to your frontend URL
3. Redeploy backend

---

## Step 6: Test Your Live Site

1. Open your frontend URL: `https://meet-scheduler-xxxxx.vercel.app`
2. Select a date and time
3. Enter your business email
4. Complete OTP verification
5. Confirm booking
6. Check your Google Calendar - meeting should appear!

---

## Configuration Options

Edit `backend/server.js` to customize:

### Meeting Duration & Booking Window

```javascript
const SCHEDULING_CONFIG = {
    maxDaysInAdvance: 15,      // How far ahead users can book
    minHoursNotice: 4,         // Minimum hours before meeting
    meetingDuration: 45,       // Meeting length in minutes
    slotInterval: 45,          // Time between slots
    timezone: 'Asia/Kolkata'   // Your timezone
};
```

### Working Hours

```javascript
const WORKING_HOURS = {
    0: { start: '14:00', end: '20:00' },  // Sunday
    1: { start: '09:00', end: '17:00' },  // Monday
    2: { start: '09:00', end: '17:00' },  // Tuesday
    3: { start: '09:00', end: '17:00' },  // Wednesday
    4: { start: '09:00', end: '17:00' },  // Thursday
    5: { start: '09:00', end: '17:00' },  // Friday
    6: null                               // Saturday (closed)
};
```

### Blocked Email Domains

```javascript
const BLOCKED_PUBLIC_DOMAINS = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', ...
];
```

After changes, redeploy: `vercel --prod`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Calendar not connected" | Visit `/auth/setup` on your backend URL |
| "Access blocked" by Google | Add redirect URI in Google Cloud Console |
| "Token refresh failed" | Delete `GOOGLE_TOKENS` env var, re-authenticate at `/auth/setup` |
| No available dates showing | Check `WORKING_HOURS` config in server.js |
| OTP email not received | Verify Gmail API is enabled in Google Cloud |
| CORS errors | Ensure `FRONTEND_URL` matches your actual frontend URL |
| "redirect_uri_mismatch" | Redirect URI in Google Console must exactly match `REDIRECT_URI` env var |

---

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check & status |
| `/auth/setup` | GET | Start Google OAuth |
| `/auth/callback` | GET | OAuth callback |
| `/auth/disconnect` | GET | Disconnect calendar |
| `/api/config` | GET | Get scheduler config |
| `/api/available-dates` | GET | Get bookable dates |
| `/api/availability?date=YYYY-MM-DD` | GET | Get time slots |
| `/api/check-slot` | POST | Verify slot available |
| `/api/send-otp` | POST | Send verification code |
| `/api/verify-otp` | POST | Verify OTP code |
| `/api/book` | POST | Create booking |

---

## Quick Reference - All URLs You'll Need

| What | URL |
|------|-----|
| Google Cloud Console | https://console.cloud.google.com |
| Vercel Dashboard | https://vercel.com/dashboard |
| Your Backend API | `https://YOUR-BACKEND.vercel.app` |
| Your Frontend | `https://YOUR-FRONTEND.vercel.app` |
| Backend Auth Setup | `https://YOUR-BACKEND.vercel.app/auth/setup` |

---

## Tech Stack

- **Frontend**: Vanilla JavaScript, CSS3
- **Backend**: Node.js, Express
- **APIs**: Google Calendar API, Gmail API
- **Hosting**: Vercel (free tier)

---

## License

MIT License - free for personal and commercial use.

---

## Author

**Himanshu Shekhar**
[GitHub](https://github.com/shekharh500)

---

## Support

If you find this useful, please ⭐ star the repo!

Issues? [Open an issue](https://github.com/shekharh500/google-meet-scheduler-demo/issues)
