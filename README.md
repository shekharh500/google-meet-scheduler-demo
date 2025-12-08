# Google Meet Scheduler

A free, self-hosted meeting scheduler with Google Calendar integration and automatic Google Meet link generation.

---

## Is This Free?

**Yes! 100% Free.** Here's what you'll use:

| Service | Cost | What It Does |
|---------|------|--------------|
| [Vercel](https://vercel.com) | Free | Hosts your backend & frontend |
| [Google Cloud](https://console.cloud.google.com) | Free | Calendar & Gmail APIs |
| [GitHub](https://github.com) | Free | Stores your code |

> No credit card required. No hidden charges. Everything runs on free tiers.

---

## What's Inside

```
google-meet-scheduler-demo/
├── index.html              # Demo only (try UI without backend)
├── frontend/
│   └── index.html          # Production frontend (USE THIS FOR DEPLOYMENT)
├── backend/
│   ├── server.js           # Backend API
│   ├── package.json
│   ├── .env.example        # Environment template
│   └── vercel.json         # Vercel config
└── README.md
```

### Understanding the Two `index.html` Files

| File | What It Does | When to Use |
|------|--------------|-------------|
| `index.html` (root) | **Demo version** - Simulated booking with fake OTP `123456`. No backend needed. | Just to try the UI |
| `frontend/index.html` | **Production version** - Connects to real backend API, sends real OTPs, creates real meetings | **For your live site** |

> **Important:** Before deployment, you'll delete the demo `index.html` and move `frontend/index.html` to the root folder. See [Step 5.1](#51-move-production-frontend-to-root-folder) for instructions.

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

Before starting, make sure you have:

| Requirement | How to Get It |
|-------------|---------------|
| **Node.js** (v18+) | Download from [nodejs.org](https://nodejs.org/) - Click the LTS version |
| **Vercel Account** | Sign up free at [vercel.com](https://vercel.com/) |
| **Google Account** | Any Gmail account works |
| **GitHub Account** | Sign up free at [github.com](https://github.com/) |

### How to Check if Node.js is Installed

Open Terminal (Mac) or Command Prompt (Windows) and type:

```bash
node --version
```

If you see a version number like `v18.17.0`, you're good! If not, download Node.js first.

---

## Step 1: Get the Code

### Option A: Download as ZIP (Easiest - No Git Required)

1. Go to the [GitHub repository](https://github.com/shekharh500/google-meet-scheduler-demo)
2. Click the green **Code** button
3. Click **Download ZIP**
4. Extract the ZIP file to your computer
5. Open Terminal/Command Prompt and navigate to the folder:
   ```bash
   cd Downloads/google-meet-scheduler-demo-main
   ```

### Option B: Clone with Git

```bash
git clone https://github.com/shekharh500/google-meet-scheduler-demo.git
cd google-meet-scheduler-demo
```

---

## Step 2: Google Cloud Setup (5-10 minutes)

This is the most important step. Follow carefully!

### 2.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. At the top, click **Select a project** → **New Project**
4. Enter project name: `Meeting Scheduler`
5. Click **Create**
6. Wait 10-15 seconds for it to create

### 2.2 Enable Required APIs

1. In the left sidebar, click **APIs & Services** → **Library**
2. In the search box, type `Calendar`
3. Click **Google Calendar API**
4. Click the blue **Enable** button
5. Go back to Library (click **APIs & Services** → **Library** again)
6. Search for `Gmail`
7. Click **Gmail API**
8. Click **Enable**

### 2.3 Set Up OAuth Consent Screen

1. In left sidebar, click **APIs & Services** → **OAuth consent screen**
2. Select **External** and click **Create**
3. Fill in the form:
   - **App name**: `Meeting Scheduler`
   - **User support email**: Select your email from dropdown
   - **Developer contact email**: Enter your email
4. Click **Save and Continue**
5. On **Scopes** page, click **Add or Remove Scopes**
6. In the filter box, search and check these:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/gmail.send`
7. Click **Update** at the bottom
8. Click **Save and Continue**
9. On **Test users** page, click **Add Users**
10. Enter your Gmail address and click **Add**
11. Click **Save and Continue**
12. Click **Back to Dashboard**

### 2.4 Create OAuth Credentials

1. In left sidebar, click **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. For **Application type**, select **Web application**
4. **Name**: `Meeting Scheduler Web`
5. Under **Authorized redirect URIs**, click **+ Add URI**
6. Enter: `http://localhost:3000/auth/callback`
7. Click **Create**

### 2.5 Save Your Credentials (IMPORTANT!)

A popup will show your credentials. **Copy these and save them somewhere safe!**

```
Client ID:     xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ **Keep these secret!** Never share them publicly.

---

## Step 3: Test Locally (5 minutes)

### 3.1 Install Backend Dependencies

Open Terminal/Command Prompt in the project folder:

```bash
cd backend
npm install
```

Wait for it to finish (may take 1-2 minutes).

### 3.2 Create Your Environment File

**On Mac/Linux:**
```bash
cp .env.example .env
```

**On Windows (Command Prompt):**
```bash
copy .env.example .env
```

### 3.3 Edit the .env File

Open the `backend/.env` file in any text editor (Notepad, VS Code, etc.) and fill in your values:

```env
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
REDIRECT_URI=http://localhost:3000/auth/callback
FRONTEND_URL=http://localhost:5500
OWNER_EMAIL=your.email@gmail.com
OWNER_NAME=Your Full Name
```

**Replace:**
- `paste_your_client_id_here` → Your Client ID from Step 2.5
- `paste_your_client_secret_here` → Your Client Secret from Step 2.5
- `your.email@gmail.com` → Your actual email
- `Your Full Name` → Your name (will appear in calendar invites)

**Save the file!**

### 3.4 Start the Backend Server

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

### 3.5 Connect Your Google Calendar

1. Open your web browser
2. Go to: `http://localhost:3000/auth/setup`
3. Click your Google account
4. You may see "Google hasn't verified this app" - Click **Continue**
5. Check all permission boxes and click **Continue**
6. You should see **"Success!"**

### 3.6 Test the Frontend

Open a **new** Terminal/Command Prompt window (keep the backend running!):

```bash
cd frontend
```

Now serve the frontend using ONE of these methods:

**Method 1 - Using npx (Recommended):**
```bash
npx serve -p 5500
```

**Method 2 - Using Python:**
```bash
python -m http.server 5500
```

**Method 3 - Using PHP:**
```bash
php -S localhost:5500
```

Now open your browser and go to: `http://localhost:5500`

Try booking a meeting to make sure everything works!

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

Select your login method (GitHub is easiest) and follow the prompts.

### 4.3 Deploy the Backend

Make sure you're in the backend folder:

```bash
cd backend
vercel
```

Answer the prompts:
- **Set up and deploy?** → `Y`
- **Which scope?** → Select your account
- **Link to existing project?** → `N`
- **Project name?** → `meet-scheduler-api` (or any name you want)
- **In which directory is your code located?** → `./` (just press Enter)
- **Override settings?** → `N`

Wait for deployment. You'll get a URL like:
```
https://meet-scheduler-api-abc123.vercel.app
```

📝 **Write down this URL! You'll need it later.**

### 4.4 Add Environment Variables in Vercel

1. Open [Vercel Dashboard](https://vercel.com/dashboard) in your browser
2. Click on your project (`meet-scheduler-api`)
3. Click **Settings** tab at the top
4. Click **Environment Variables** in the left sidebar
5. Add each variable one by one:

| Name | Value |
|------|-------|
| `GOOGLE_CLIENT_ID` | Your Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Client Secret |
| `REDIRECT_URI` | `https://YOUR-PROJECT-NAME.vercel.app/auth/callback` |
| `OWNER_EMAIL` | Your email |
| `OWNER_NAME` | Your name |
| `FRONTEND_URL` | Leave empty for now (we'll add after Step 5) |

> **Note:** Replace `YOUR-PROJECT-NAME` with your actual Vercel project name!

### 4.5 Add Vercel URL to Google Cloud

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **APIs & Services** → **Credentials**
3. Click on your OAuth client (`Meeting Scheduler Web`)
4. Under **Authorized redirect URIs**, click **+ Add URI**
5. Add: `https://YOUR-PROJECT-NAME.vercel.app/auth/callback`
6. Click **Save**

### 4.6 Connect Google Calendar on Vercel

1. Open your browser and go to: `https://YOUR-PROJECT-NAME.vercel.app/auth/setup`
2. Sign in with Google and grant permissions
3. You'll see a page with a JSON token - **Copy the entire token**
4. Go back to Vercel Dashboard → Your Project → Settings → Environment Variables
5. Add new variable:
   - **Name:** `GOOGLE_TOKENS`
   - **Value:** Paste the entire JSON token
6. Click **Save**
7. Go to **Deployments** tab → Click the **⋮** menu → **Redeploy** → **Redeploy**

---

## Step 5: Prepare Frontend for Deployment

### 5.1 Move Production Frontend to Root Folder

The `frontend/index.html` is your production file. For deployment, it needs to be in the root folder.

#### Option A: Using Terminal (Recommended)

```bash
# Navigate to project root (go back from backend folder)
cd ..

# Delete the demo index.html from root
rm index.html

# Move production frontend to root
mv frontend/index.html ./index.html

# Remove empty frontend folder
rm -r frontend
```

#### Option B: Manual Steps (Using File Explorer/Finder)

1. Open the `google-meet-scheduler-demo` folder on your computer
2. Find the `index.html` file in the main folder → **Right-click** → **Delete** (this is just a demo file)
3. Open the `frontend` folder
4. Find the `index.html` file inside → **Right-click** → **Cut** (or Ctrl+X / Cmd+X)
5. Go back to the main `google-meet-scheduler-demo` folder
6. **Right-click** → **Paste** (or Ctrl+V / Cmd+V)
7. (Optional) Delete the empty `frontend` folder

#### After Moving - Your Folder Should Look Like:

```
google-meet-scheduler-demo/
├── index.html          ← Production frontend (moved from frontend/)
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── vercel.json
└── README.md
```

---

### 5.2 Update Frontend API URL

1. Open `index.html` (now in root folder) in any text editor
2. Find this line (around line 529):
   ```javascript
   const API_BASE = 'http://localhost:3000';
   ```
3. Change it to your Vercel backend URL:
   ```javascript
   const API_BASE = 'https://meet-scheduler-api-abc123.vercel.app';
   ```
4. **Save the file!**

---

### 5.3 Deploy Frontend to Vercel

```bash
# Make sure you're in the root folder (where index.html now is)
cd google-meet-scheduler-demo
vercel
```

Follow the prompts (similar to backend). You'll get a URL like:
```
https://meet-scheduler-xyz789.vercel.app
```

📝 **This is your live scheduler URL!**

---

### 5.4 Update Backend with Frontend URL

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your **backend** project (`meet-scheduler-api`)
3. Go to **Settings** → **Environment Variables**
4. Find `FRONTEND_URL` and click **Edit**
5. Set value to your frontend URL: `https://meet-scheduler-xyz789.vercel.app`
6. Click **Save**
7. Go to **Deployments** → **⋮** → **Redeploy**

---

### Alternative: Deploy to GitHub Pages (Free)

If you prefer GitHub Pages for frontend:

1. Create a new repository on GitHub
2. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
3. Go to your repo on GitHub → **Settings** → **Pages**
4. Under **Source**, select **main** branch
5. Click **Save**
6. Your site will be live at: `https://YOUR-USERNAME.github.io/YOUR-REPO/`

> **Note:** Backend still needs to be on Vercel (GitHub Pages only hosts static files)

---

## Step 6: Test Your Live Site

1. Open your frontend URL in browser
2. Select a date with available slots (dates with dots underneath)
3. Pick a time slot
4. Enter your **business email** (not Gmail/Yahoo)
5. Click **Verify Email**
6. Enter OTP code from your email
7. Click **Confirm Booking**
8. Check your Google Calendar - the meeting should appear!

---

## Pre-Launch Checklist

Before sharing your scheduler, verify everything works:

| Check | How to Verify |
|-------|---------------|
| ✅ Backend is running | Visit `https://YOUR-BACKEND.vercel.app` - should show `"status": "ok"` |
| ✅ Google Calendar connected | Visit `https://YOUR-BACKEND.vercel.app` - should show `"connected": true` |
| ✅ Frontend loads | Visit your frontend URL - calendar should appear |
| ✅ Dates are clickable | Available dates should have dots and be clickable |
| ✅ Time slots appear | After clicking a date, time slots should load |
| ✅ OTP emails work | Try booking - you should receive verification email |
| ✅ Booking creates event | Complete booking - check Google Calendar |

---

## Customization Guide

### Change Your Name & Branding

Edit `backend/.env` on Vercel:

```env
OWNER_NAME=Your Company Name
OWNER_EMAIL=contact@yourcompany.com
```

### Change Meeting Duration

Edit `backend/server.js`, find `SCHEDULING_CONFIG`:

```javascript
const SCHEDULING_CONFIG = {
    meetingDuration: 30,    // Change from 45 to 30 minutes
    slotInterval: 30,       // Match the duration
    // ... other settings
};
```

### Change Working Hours

Edit `backend/server.js`, find `WORKING_HOURS`:

```javascript
const WORKING_HOURS = {
    0: null,                              // Sunday - CLOSED
    1: { start: '09:00', end: '17:00' },  // Monday 9 AM - 5 PM
    2: { start: '09:00', end: '17:00' },  // Tuesday
    3: { start: '09:00', end: '17:00' },  // Wednesday
    4: { start: '09:00', end: '17:00' },  // Thursday
    5: { start: '09:00', end: '17:00' },  // Friday
    6: null                               // Saturday - CLOSED
};
```

> **Time format:** Use 24-hour format. `09:00` = 9 AM, `17:00` = 5 PM, `21:00` = 9 PM

### Change Timezone

Edit `backend/server.js`, find `SCHEDULING_CONFIG`:

```javascript
const SCHEDULING_CONFIG = {
    timezone: 'America/New_York'   // Change to your timezone
};
```

**Common Timezones:**

| Region | Timezone Code |
|--------|---------------|
| India | `Asia/Kolkata` |
| US East | `America/New_York` |
| US West | `America/Los_Angeles` |
| UK | `Europe/London` |
| Germany | `Europe/Berlin` |
| Australia | `Australia/Sydney` |
| Japan | `Asia/Tokyo` |
| Singapore | `Asia/Singapore` |
| Dubai | `Asia/Dubai` |

### Change Colors (Frontend)

Edit `index.html`, find the `:root` section at the top:

```css
:root {
    --primary: #4F46E5;        /* Main color - buttons, highlights */
    --primary-dark: #4338CA;   /* Hover color */
    --primary-light: #EEF2FF;  /* Light background */
    --success: #059669;        /* Success messages */
}
```

**Popular Color Schemes:**

| Style | Primary Color |
|-------|---------------|
| Blue (default) | `#4F46E5` |
| Green | `#059669` |
| Red | `#DC2626` |
| Purple | `#7C3AED` |
| Orange | `#EA580C` |
| Pink | `#DB2777` |

### Allow Personal Emails (Gmail, Yahoo, etc.)

If you want to allow personal emails, edit `backend/server.js` and remove or comment out the `BLOCKED_PUBLIC_DOMAINS` check in the `/api/send-otp` route.

After any changes, redeploy:
```bash
cd backend
vercel --prod
```

---

## FAQ (Frequently Asked Questions)

### Q: Why do I need a business email?

By default, the scheduler blocks personal emails (Gmail, Yahoo, etc.) to prevent spam bookings. You can disable this - see Customization Guide above.

### Q: Can multiple people book the same slot?

No! The system checks Google Calendar in real-time. Once a slot is booked, it's immediately unavailable to others.

### Q: What if I don't receive the OTP email?

1. Check your spam/junk folder
2. Make sure Gmail API is enabled in Google Cloud
3. Verify the email address is correct
4. Check that your Google account has Gmail access

### Q: Can I use this for a team/multiple people?

Currently, it supports one person's calendar. For teams, each person would need their own deployment.

### Q: Is my data secure?

Yes! Your Google credentials are stored as encrypted environment variables on Vercel. No data is stored on any third-party servers.

### Q: Can I use a custom domain?

Yes! Both Vercel and GitHub Pages support custom domains. Check their documentation for setup instructions.

### Q: How do I update after making changes?

After editing any files:
```bash
vercel --prod
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Calendar not connected" | Visit `https://YOUR-BACKEND.vercel.app/auth/setup` and reconnect |
| "Access blocked" by Google | Make sure redirect URI in Google Console matches exactly |
| "redirect_uri_mismatch" | The URI must match character-for-character, including `https://` |
| "Token refresh failed" | Delete `GOOGLE_TOKENS` from Vercel env vars, reconnect at `/auth/setup` |
| No dates are clickable | Check `WORKING_HOURS` in server.js - make sure today isn't set to `null` |
| OTP email not arriving | 1. Check spam folder 2. Verify Gmail API is enabled 3. Check OWNER_EMAIL is correct |
| CORS errors in console | Make sure `FRONTEND_URL` in Vercel exactly matches your frontend URL |
| "This app isn't verified" | This is normal for personal projects. Click "Continue" |
| Booking fails silently | Check browser console (F12) for error messages |

---

## Need Help?

1. **Check the FAQ** above
2. **Check Troubleshooting** section
3. **Open an Issue** on [GitHub](https://github.com/shekharh500/google-meet-scheduler-demo/issues)

---

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (no frameworks!)
- **Backend**: Node.js, Express
- **APIs**: Google Calendar API, Gmail API
- **Hosting**: Vercel (free tier)

---

## License

MIT License - free for personal and commercial use. Do whatever you want with it!

---

## Author

**Himanshu Shekhar** - [GitHub](https://github.com/shekharh500)

---

## Support the Project

If this helped you, please:
- ⭐ **Star** the repo on GitHub
- 🐛 Report bugs via [Issues](https://github.com/shekharh500/google-meet-scheduler-demo/issues)
- 💡 Suggest features via [Issues](https://github.com/shekharh500/google-meet-scheduler-demo/issues)
