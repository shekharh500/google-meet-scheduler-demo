require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// File paths for local development
const TOKENS_FILE = path.join(__dirname, 'tokens.json');
const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');

// Configuration from environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${PORT}/auth/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'your@email.com';
const OWNER_NAME = process.env.OWNER_NAME || 'Your Name';

// ============================================
// SCHEDULING CONFIGURATION - Customize these!
// ============================================
const SCHEDULING_CONFIG = {
    maxDaysInAdvance: 15,      // How far ahead users can book
    minHoursNotice: 4,         // Minimum hours before appointment
    meetingDuration: 45,       // Meeting length in minutes
    slotInterval: 45,          // Time between slot options
    timezone: 'Asia/Kolkata'   // Your timezone (change as needed)
};

// Working hours for each day (24-hour format, in your timezone)
// Set to null for days you're unavailable
const WORKING_HOURS = {
    0: { start: '14:00', end: '20:00' },  // Sunday
    1: { start: '09:00', end: '17:00' },  // Monday
    2: { start: '09:00', end: '17:00' },  // Tuesday
    3: { start: '09:00', end: '17:00' },  // Wednesday
    4: { start: '09:00', end: '17:00' },  // Thursday
    5: { start: '09:00', end: '17:00' },  // Friday
    6: null                               // Saturday (closed)
};

// OTP Storage (in-memory with expiration)
const otpStore = new Map();
const OTP_EXPIRY_MINUTES = 10;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ============================================
// HELPER FUNCTIONS
// ============================================

function createOAuth2Client() {
    return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

// In-memory token cache (for serverless environments like Vercel)
let cachedTokens = null;

function loadTokens() {
    // Check in-memory cache first
    if (cachedTokens) return cachedTokens;

    // Check environment variable (for Vercel deployment)
    if (process.env.GOOGLE_TOKENS) {
        try {
            cachedTokens = JSON.parse(process.env.GOOGLE_TOKENS);
            return cachedTokens;
        } catch (error) {
            console.error('Error parsing GOOGLE_TOKENS:', error);
        }
    }

    // Fall back to file (for local development)
    try {
        if (fs.existsSync(TOKENS_FILE)) {
            cachedTokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
            return cachedTokens;
        }
    } catch (error) {
        console.error('Error loading tokens:', error);
    }
    return null;
}

function saveTokens(tokens) {
    cachedTokens = tokens;
    try {
        fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
        console.log('Tokens saved to file');
    } catch (error) {
        // Expected to fail on Vercel (read-only filesystem)
        console.log('Could not save to file:', error.message);
    }
}

function isAuthenticated() {
    const tokens = loadTokens();
    return tokens && tokens.access_token;
}

async function getAuthenticatedClient() {
    const tokens = loadTokens();
    if (!tokens) return null;

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(tokens);

    // Refresh token if expired
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date - 60000) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            saveTokens(credentials);
            oauth2Client.setCredentials(credentials);
        } catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        }
    }

    return oauth2Client;
}

async function getCalendarClient() {
    const oauth2Client = await getAuthenticatedClient();
    if (!oauth2Client) return null;
    return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Booking storage functions
function loadBookings() {
    try {
        if (fs.existsSync(BOOKINGS_FILE)) {
            return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
    return [];
}

function saveBooking(booking) {
    try {
        const bookings = loadBookings();
        bookings.push(booking);
        fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    } catch (error) {
        console.error('Error saving booking:', error);
    }
}

// Time utility functions
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatTimeDisplay(hours, minutes) {
    const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    const period = hours >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// OTP Functions
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function verifyOTP(email, otp) {
    const normalizedEmail = email.toLowerCase().trim();
    const stored = otpStore.get(normalizedEmail);

    if (!stored) {
        return { valid: false, error: 'No OTP found. Please request a new code.' };
    }
    if (Date.now() > stored.expiresAt) {
        otpStore.delete(normalizedEmail);
        return { valid: false, error: 'OTP expired. Please request a new code.' };
    }
    if (stored.attempts >= 5) {
        otpStore.delete(normalizedEmail);
        return { valid: false, error: 'Too many attempts. Please request a new code.' };
    }

    stored.attempts++;

    if (stored.otp !== otp) {
        return { valid: false, error: 'Invalid OTP. Please try again.' };
    }

    stored.verified = true;
    return { valid: true };
}

function isEmailVerified(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const stored = otpStore.get(normalizedEmail);
    return stored && stored.verified && Date.now() <= stored.expiresAt;
}

function clearOTP(email) {
    otpStore.delete(email.toLowerCase().trim());
}

// Send email using Gmail API
async function sendEmailViaGmailAPI(to, subject, htmlBody) {
    const oauth2Client = await getAuthenticatedClient();
    if (!oauth2Client) throw new Error('Gmail not authenticated');

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const emailLines = [
        `To: ${to}`,
        `From: "${OWNER_NAME}" <${OWNER_EMAIL}>`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        htmlBody
    ];

    const encodedEmail = Buffer.from(emailLines.join('\r\n'))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedEmail }
    });
}

// Blocked email domains
const BLOCKED_DISPOSABLE_DOMAINS = [
    'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com',
    '10minutemail.com', 'yopmail.com', 'fakeinbox.com', 'trashmail.com'
];

const BLOCKED_PUBLIC_DOMAINS = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
    'aol.com', 'icloud.com', 'protonmail.com', 'zoho.com', 'mail.com'
];

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Google Meet Scheduler API',
        connected: isAuthenticated(),
        setupUrl: isAuthenticated() ? null : '/auth/setup',
        config: {
            meetingDuration: SCHEDULING_CONFIG.meetingDuration,
            maxDaysInAdvance: SCHEDULING_CONFIG.maxDaysInAdvance
        }
    });
});

// OAuth setup - Visit this URL to connect Google Calendar
app.get('/auth/setup', (req, res) => {
    if (isAuthenticated()) {
        return res.send(`
            <html><body style="font-family: sans-serif; padding: 40px; text-align: center;">
                <h1>Already Connected!</h1>
                <p>Your Google Calendar is connected.</p>
                <p><a href="/auth/disconnect">Disconnect</a> | <a href="/">API Status</a></p>
            </body></html>
        `);
    }

    const oauth2Client = createOAuth2Client();
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/gmail.send'
        ]
    });

    res.redirect(authUrl);
});

// OAuth callback
app.get('/auth/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        return res.send(`<html><body><h1>Error: ${error}</h1></body></html>`);
    }

    try {
        const oauth2Client = createOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        saveTokens(tokens);

        const isVercel = process.env.VERCEL === '1';
        const tokenJson = JSON.stringify(tokens);

        if (isVercel) {
            res.send(`
                <html><body style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
                    <h1 style="color: green;">Success!</h1>
                    <p><strong>Important:</strong> Vercel has a read-only filesystem. Save this token as an environment variable.</p>
                    <h3>Step 1: Copy this token:</h3>
                    <textarea id="token" style="width: 100%; height: 150px; font-family: monospace;" readonly>${tokenJson}</textarea>
                    <button onclick="navigator.clipboard.writeText(document.getElementById('token').value); this.textContent='Copied!'" style="margin-top: 10px; padding: 10px 20px; cursor: pointer;">Copy Token</button>
                    <h3>Step 2: Add to Vercel</h3>
                    <ol>
                        <li>Go to Vercel Dashboard → Your Project → Settings → Environment Variables</li>
                        <li>Add: <code>GOOGLE_TOKENS</code> = (paste the token)</li>
                        <li>Redeploy your project</li>
                    </ol>
                </body></html>
            `);
        } else {
            res.send(`
                <html><body style="font-family: sans-serif; padding: 40px; text-align: center;">
                    <h1 style="color: green;">Success!</h1>
                    <p>Google Calendar connected. You can now accept bookings.</p>
                    <p><a href="${FRONTEND_URL}">Go to Scheduler</a></p>
                </body></html>
            `);
        }
    } catch (error) {
        res.send(`<html><body><h1>Error</h1><p>${error.message}</p></body></html>`);
    }
});

// Disconnect calendar
app.get('/auth/disconnect', (req, res) => {
    cachedTokens = null;
    try { if (fs.existsSync(TOKENS_FILE)) fs.unlinkSync(TOKENS_FILE); } catch (e) {}
    res.send(`<html><body style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h1>Disconnected</h1><p><a href="/auth/setup">Reconnect</a></p>
    </body></html>`);
});

// Get config
app.get('/api/config', (req, res) => {
    res.json({
        success: true,
        meetingDuration: SCHEDULING_CONFIG.meetingDuration,
        maxDaysInAdvance: SCHEDULING_CONFIG.maxDaysInAdvance,
        minHoursNotice: SCHEDULING_CONFIG.minHoursNotice,
        ownerName: OWNER_NAME
    });
});

// Get available dates for a month
app.get('/api/available-dates', async (req, res) => {
    if (!isAuthenticated()) {
        return res.status(503).json({ success: false, error: 'Calendar not connected' });
    }

    const { month, year } = req.query;
    if (!month || !year) {
        return res.status(400).json({ success: false, error: 'Month and year required' });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    const now = new Date();
    const minTime = new Date(now.getTime() + SCHEDULING_CONFIG.minHoursNotice * 60 * 60 * 1000);
    const maxDate = new Date(now.getTime() + SCHEDULING_CONFIG.maxDaysInAdvance * 24 * 60 * 60 * 1000);

    const availableDates = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(yearNum, monthNum - 1, day);
        date.setHours(23, 59, 59, 999);

        if (date >= minTime && date <= maxDate && WORKING_HOURS[date.getDay()]) {
            availableDates.push(`${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        }
    }

    res.json({ success: true, availableDates });
});

// Get available time slots for a date
app.get('/api/availability', async (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, error: 'Date required' });

    const calendar = await getCalendarClient();
    if (!calendar) return res.status(503).json({ success: false, error: 'Calendar not connected' });

    try {
        const [year, month, day] = date.split('-').map(Number);
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        const hours = WORKING_HOURS[dayOfWeek];

        if (!hours) return res.json({ success: true, availableSlots: [] });

        const dayStart = new Date(year, month - 1, day, 0, 0, 0);
        const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

        const freeBusy = await calendar.freebusy.query({
            requestBody: {
                timeMin: dayStart.toISOString(),
                timeMax: dayEnd.toISOString(),
                items: [{ id: 'primary' }]
            }
        });

        const busyPeriods = freeBusy.data.calendars.primary.busy || [];
        const now = new Date();
        const minTime = new Date(now.getTime() + SCHEDULING_CONFIG.minHoursNotice * 60 * 60 * 1000);

        const slots = [];
        let current = timeToMinutes(hours.start);
        const end = timeToMinutes(hours.end) - SCHEDULING_CONFIG.meetingDuration;

        while (current <= end) {
            const slotHour = Math.floor(current / 60);
            const slotMin = current % 60;
            const slotStart = new Date(year, month - 1, day, slotHour, slotMin);
            const slotEnd = new Date(slotStart.getTime() + SCHEDULING_CONFIG.meetingDuration * 60000);

            if (slotStart > minTime) {
                const isBusy = busyPeriods.some(busy => {
                    const busyStart = new Date(busy.start);
                    const busyEnd = new Date(busy.end);
                    return slotStart < busyEnd && slotEnd > busyStart;
                });

                if (!isBusy) {
                    slots.push({
                        start: slotStart.toISOString(),
                        end: slotEnd.toISOString(),
                        display: formatTimeDisplay(slotHour, slotMin)
                    });
                }
            }

            current += SCHEDULING_CONFIG.slotInterval;
        }

        res.json({ success: true, availableSlots: slots, date });
    } catch (error) {
        console.error('Availability error:', error);
        res.status(500).json({ success: false, error: 'Failed to get availability' });
    }
});

// Check if slot is still available
app.post('/api/check-slot', async (req, res) => {
    const { startTime, endTime } = req.body;
    const calendar = await getCalendarClient();
    if (!calendar) return res.status(503).json({ success: false, error: 'Calendar not connected' });

    try {
        const freeBusy = await calendar.freebusy.query({
            requestBody: {
                timeMin: startTime,
                timeMax: endTime,
                items: [{ id: 'primary' }]
            }
        });

        const busy = freeBusy.data.calendars.primary.busy || [];
        res.json({ success: true, available: busy.length === 0 });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Check failed' });
    }
});

// Send OTP for email verification
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, error: 'Valid email required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const domain = normalizedEmail.split('@')[1];

    // Block disposable emails
    if (BLOCKED_DISPOSABLE_DOMAINS.includes(domain)) {
        return res.status(400).json({ success: false, error: 'Temporary email addresses not allowed' });
    }

    // Block personal email domains (require business email)
    if (BLOCKED_PUBLIC_DOMAINS.includes(domain)) {
        return res.status(400).json({
            success: false,
            error: 'Please use your business email. Personal emails (Gmail, Yahoo, etc.) are not allowed.'
        });
    }

    // Check for existing future booking
    const bookings = loadBookings();
    const now = new Date();
    const hasFutureBooking = bookings.some(b =>
        b.email.toLowerCase() === normalizedEmail && new Date(b.startTime) > now
    );

    if (hasFutureBooking) {
        return res.status(409).json({
            success: false,
            error: 'You already have an upcoming meeting. Only one booking per email allowed.'
        });
    }

    // Rate limiting
    const existing = otpStore.get(normalizedEmail);
    if (existing && existing.requestCount >= 3 && Date.now() - existing.firstRequestTime < 3600000) {
        return res.status(429).json({ success: false, error: 'Too many requests. Try again later.' });
    }

    try {
        const otp = generateOTP();

        otpStore.set(normalizedEmail, {
            otp,
            expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
            attempts: 0,
            requestCount: (existing?.requestCount || 0) + 1,
            firstRequestTime: existing?.firstRequestTime || Date.now()
        });

        // Send OTP email
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f9f9f9;">
                <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email</h2>
                <p style="color: #666; margin-bottom: 20px;">Use this code to verify your email address:</p>
                <div style="background: #fff; padding: 20px; text-align: center; border-radius: 8px; border: 2px dashed #4F46E5;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4F46E5;">${otp}</span>
                </div>
                <p style="color: #999; font-size: 12px; margin-top: 20px;">This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
            </div>
        `;

        await sendEmailViaGmailAPI(normalizedEmail, 'Your Verification Code', emailHtml);

        res.json({ success: true, message: 'Verification code sent' });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ success: false, error: 'Failed to send verification code' });
    }
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Email and OTP required' });
    }

    const result = verifyOTP(email, otp);

    if (result.valid) {
        res.json({ success: true, message: 'Email verified' });
    } else {
        res.status(400).json({ success: false, error: result.error });
    }
});

// Book a meeting
app.post('/api/book', async (req, res) => {
    const { name, email, startTime, endTime, description } = req.body;

    if (!name || !email || !startTime || !endTime) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Verify email was verified via OTP
    if (!isEmailVerified(email)) {
        return res.status(403).json({ success: false, error: 'Please verify your email first' });
    }

    const calendar = await getCalendarClient();
    if (!calendar) return res.status(503).json({ success: false, error: 'Calendar not connected' });

    try {
        // Double-check slot availability
        const freeBusy = await calendar.freebusy.query({
            requestBody: {
                timeMin: startTime,
                timeMax: endTime,
                items: [{ id: 'primary' }]
            }
        });

        if (freeBusy.data.calendars.primary.busy?.length > 0) {
            return res.status(409).json({ success: false, error: 'Slot no longer available' });
        }

        // Create event with Google Meet
        const event = {
            summary: `Meeting with ${name}`,
            description: `Client: ${name}\nEmail: ${email}\n\nNotes: ${description || 'None'}`,
            start: { dateTime: startTime, timeZone: SCHEDULING_CONFIG.timezone },
            end: { dateTime: endTime, timeZone: SCHEDULING_CONFIG.timezone },
            attendees: [{ email, displayName: name }],
            conferenceData: {
                createRequest: {
                    requestId: uuidv4(),
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 60 },
                    { method: 'popup', minutes: 15 }
                ]
            }
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
            sendUpdates: 'all'
        });

        const meetLink = response.data.hangoutLink;

        // Save booking record
        saveBooking({
            email: email.toLowerCase(),
            name,
            startTime,
            endTime,
            eventId: response.data.id,
            timestamp: Date.now()
        });

        // Clear OTP after successful booking
        clearOTP(email);

        // Generate ICS
        const icsContent = generateICS(name, email, startTime, endTime, meetLink, description);
        const icsDownload = `data:text/calendar;base64,${Buffer.from(icsContent).toString('base64')}`;

        res.json({
            success: true,
            meetLink,
            eventId: response.data.id,
            icsDownload
        });

    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ success: false, error: 'Booking failed' });
    }
});

// Generate ICS file
function generateICS(name, email, start, end, meetLink, notes) {
    const formatDate = (d) => new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = uuidv4();

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Meet Scheduler//EN
BEGIN:VEVENT
UID:${uid}@scheduler
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:Meeting with ${OWNER_NAME}
DESCRIPTION:Notes: ${notes || 'None'}\\n\\nJoin: ${meetLink}
LOCATION:${meetLink}
ORGANIZER;CN=${OWNER_NAME}:mailto:${OWNER_EMAIL}
ATTENDEE;CN=${name}:mailto:${email}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

// Start server
app.listen(PORT, () => {
    console.log(`
====================================
  Google Meet Scheduler API
====================================
  Port: ${PORT}
  Connected: ${isAuthenticated() ? 'Yes' : 'No'}
  Setup: http://localhost:${PORT}/auth/setup
====================================
    `);
});
