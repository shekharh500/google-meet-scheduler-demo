# Google Meet Scheduler

A free meeting scheduler with Google Calendar + automatic Meet links.

---

> **Try it now:** Open `index.html` in your browser. Use OTP `123456` to test.

---

## What You'll Need to Change

### 1. Backend (Vercel Environment Variables)

| Variable | Example | What It Does |
|----------|---------|--------------|
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | Your Google OAuth ID |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxx` | Your Google OAuth Secret |
| `OWNER_EMAIL` | `you@company.com` | Your email (shown in calendar invites) |
| `OWNER_NAME` | `John Smith` | Your name (shown on scheduler page) |

### 2. Frontend (`frontend/index.html`)

Open the file and search for `CHANGE:` to find all editable parts.

**Page Title** (Line 18):
```html
<!-- Before -->
<title>Schedule a Meeting</title>

<!-- After - Your custom title -->
<title>Book a Call with Sarah</title>
```

**Subtitle** (Line 402):
```html
<!-- Before -->
<span>Schedule a Meeting</span>

<!-- After - Your custom subtitle -->
<span>Book a Discovery Call</span>
```

**Meeting Type** (Line 407):
```html
<!-- Before -->
<h2>Consultation</h2>

<!-- After - Your meeting type -->
<h2>Free Strategy Session</h2>
```

**Description** (Line 409):
```html
<!-- Before -->
<p>Book a time slot that works for you. You'll receive a calendar invite with a Google Meet link.</p>

<!-- After - Your custom description -->
<p>Let's discuss your project! I'll send you a calendar invite with a Google Meet link.</p>
```

**Backend URL** (Line 545) - **REQUIRED**:
```javascript
// Before
const API_BASE = 'http://localhost:3000';

// After - Your Vercel backend URL
const API_BASE = 'https://your-backend.vercel.app';
```

---

## Quick Start (15 minutes)

### Step 1: Get Google Credentials (5 min)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → Create new project
2. Enable **Google Calendar API** and **Gmail API**
3. Go to **OAuth consent screen** → Select "External" → Fill app name & email → Save
4. Go to **Credentials** → Create **OAuth client ID** → Web application
5. Add redirect URI: `http://localhost:3000/auth/callback`
6. **Save your Client ID and Client Secret!**

### Step 2: Deploy Backend (5 min)

```bash
cd backend
npm install -g vercel
vercel login
vercel
```

After deployment, you'll get a URL like: `https://your-app.vercel.app`

**Add environment variables in Vercel Dashboard → Settings → Environment Variables:**

| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | Your Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Client Secret |
| `REDIRECT_URI` | `https://your-app.vercel.app/auth/callback` |
| `OWNER_EMAIL` | your@email.com |
| `OWNER_NAME` | Your Name |

**Add your Vercel URL to Google Cloud:**
- Go to Google Cloud → Credentials → Your OAuth client
- Add redirect URI: `https://your-app.vercel.app/auth/callback`

**Connect your Google Calendar:**
1. Visit `https://your-app.vercel.app/auth/setup`
2. Sign in with Google
3. Copy the token shown
4. Add to Vercel: `GOOGLE_TOKENS` = paste token
5. Redeploy in Vercel Dashboard

### Step 3: Deploy Frontend (3 min)

1. Open `frontend/index.html`
2. Customize text (optional): Search for `CHANGE:` to find editable parts
3. **Required:** Find `API_BASE` (line 545) and set your backend URL:
   ```javascript
   const API_BASE = 'https://your-app.vercel.app';
   ```
4. Deploy:
   ```bash
   cd frontend
   vercel
   ```

4. Add frontend URL to backend:
   - Vercel Dashboard → Backend project → Settings → Environment Variables
   - Add `FRONTEND_URL` = `https://your-frontend.vercel.app`
   - Redeploy backend

**Done!** Your scheduler is live.

---

## Folder Structure

```
google-meet-scheduler-demo/
├── index.html          # DEMO - Try locally (fake OTP: 123456)
├── frontend/
│   └── index.html      # PRODUCTION - Deploy this
└── backend/
    └── server.js       # API server
```

**Important:** Deploy the `frontend/` folder directly. Don't move files around.

---

## Customization

### Change Working Hours

Edit `backend/server.js`:

```javascript
const WORKING_HOURS = {
    0: null,                              // Sunday - closed
    1: { start: '09:00', end: '17:00' },  // Monday
    2: { start: '09:00', end: '17:00' },  // Tuesday
    3: { start: '09:00', end: '17:00' },  // Wednesday
    4: { start: '09:00', end: '17:00' },  // Thursday
    5: { start: '09:00', end: '17:00' },  // Friday
    6: null                               // Saturday - closed
};
```

### Change Meeting Duration

Edit `backend/server.js`:

```javascript
const SCHEDULING_CONFIG = {
    meetingDuration: 30,    // minutes
    slotInterval: 30,       // minutes between slots
    maxDaysInAdvance: 15,   // how far ahead users can book
    timezone: 'Asia/Kolkata'
};
```

### Change Colors

Edit `frontend/index.html`, find `:root`:

```css
:root {
    --primary: #4F46E5;    /* Main color */
}
```

### Allow Gmail/Yahoo Emails

By default, only business emails are allowed. To allow personal emails, edit `backend/server.js` and comment out the `BLOCKED_PUBLIC_DOMAINS` check.

After any changes: `vercel --prod`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **CORS error** (most common!) | Add `FRONTEND_URL` in Vercel backend settings. Must match your frontend URL exactly (e.g., `https://yourname.github.io`) |
| "Calendar not connected" | Visit `/auth/setup` on your backend URL |
| "redirect_uri_mismatch" | Make sure URI in Google Cloud matches exactly |
| No dates clickable | Check `WORKING_HOURS` - today might be set to `null` |
| OTP not arriving | Check spam folder, verify Gmail API is enabled |

### CORS Error Fix (Step by Step)

If you see "blocked by CORS policy" in browser console:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your **backend** project
3. Go to **Settings** → **Environment Variables**
4. Add: `FRONTEND_URL` = `https://your-frontend-url.com` (your exact frontend URL)
5. Click **Save**
6. Go to **Deployments** → Click **⋮** → **Redeploy**

---

## Need Help?

Open an issue on [GitHub](https://github.com/shekharh500/google-meet-scheduler-demo/issues)
