# VEXA Digital - Complete Booking System Setup Guide

## 🎯 WHAT'S BEEN BUILT

A complete 4-step booking system with:
- ✅ Multi-step form with validation
- ✅ Calendar selection interface
- ✅ Payment integration (Razorpay ready)
- ✅ Email automation (ready to connect)
- ✅ Booking confirmation page
- ✅ Your VEXA branding integrated

---

## 📋 SETUP CHECKLIST

### PHASE 1: RAZORPAY SETUP (10 minutes)

**Step 1: Create Razorpay Account**
1. Go to: https://razorpay.com/
2. Click "Sign Up"
3. Enter details:
   - Business Name: VEXA Digital
   - Email: vexadigital.in@gmail.com
   - Phone: +91 9958895505

**Step 2: Complete KYC**
- PAN Card
- Aadhaar Card
- Bank Account Details
- Business Address

**Step 3: Get API Keys**
1. Go to Dashboard → Settings → API Keys
2. Generate Keys (Test Mode first)
3. Copy:
   - **Key ID**: `rzp_test_XXXXX`
   - **Key Secret**: `XXXXX` (keep this secret!)

**Step 4: Update Website**
Open `js/booking.js` and replace line 234:
```javascript
key: 'YOUR_RAZORPAY_KEY_ID', // Replace with your actual key
```
With:
```javascript
key: 'rzp_test_XXXXX', // Your actual Razorpay Key ID
```

---

### PHASE 2: FIREBASE SETUP (15 minutes)

**Step 1: Create Firebase Project**
1. Go to: https://console.firebase.google.com/
2. Click "Add Project"
3. Name: `vexa-digital`
4. Enable Google Analytics (optional)
5. Create Project

**Step 2: Enable Firestore Database**
1. In Firebase Console, go to "Firestore Database"
2. Click "Create Database"
3. Start in **Production Mode**
4. Choose location: `asia-south1` (Mumbai)

**Step 3: Set Up Security Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{bookingId} {
      allow read: if request.auth != null;
      allow create: if true; // Allow anyone to create bookings
      allow update: if request.auth != null;
    }
  }
}
```

**Step 4: Get Firebase Config**
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "Web" icon (</>)
4. Register app: "VEXA Booking"
5. Copy the config object

**Step 5: Create Firebase Config File**
Create `js/firebase-config.js`:
```javascript
// Firebase Configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "vexa-digital.firebaseapp.com",
  projectId: "vexa-digital",
  storageBucket: "vexa-digital.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
```

**Step 6: Add Firebase to booking.html**
Add before `</body>`:
```html
<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
<script src="js/firebase-config.js"></script>
```

---

### PHASE 3: GOOGLE CALENDAR API (20 minutes)

**Step 1: Enable Google Calendar API**
1. Go to: https://console.cloud.google.com/
2. Create New Project: "VEXA Digital"
3. Go to "APIs & Services" → "Library"
4. Search "Google Calendar API"
5. Click "Enable"

**Step 2: Create Service Account**
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Name: "vexa-booking-system"
4. Grant role: "Editor"
5. Click "Done"

**Step 3: Create Key**
1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create New Key"
4. Choose "JSON"
5. Download the key file (keep it safe!)

**Step 4: Share Calendar with Service Account**
1. Open Google Calendar (calendar.google.com)
2. Go to Settings → "Add Calendar" → "Create New Calendar"
3. Name: "VEXA Consultations"
4. Go to calendar settings
5. Under "Share with specific people"
6. Add the service account email (from JSON file)
7. Give "Make changes to events" permission

---

### PHASE 4: EMAIL AUTOMATION (15 minutes)

**Option A: Using SendGrid (Recommended)**

**Step 1: Create SendGrid Account**
1. Go to: https://sendgrid.com/
2. Sign up (free tier: 100 emails/day)
3. Verify your email

**Step 2: Create API Key**
1. Go to Settings → API Keys
2. Create API Key
3. Name: "VEXA Booking System"
4. Full Access
5. Copy the key

**Step 3: Verify Sender Email**
1. Go to Settings → Sender Authentication
2. Verify Single Sender
3. Add: vexadigital.in@gmail.com
4. Check email and verify

**Option B: Using Gmail API (Free, but more complex)**

I'll provide detailed steps if you choose this option.

---

### PHASE 5: BACKEND DEPLOYMENT (30 minutes)

**Using Firebase Cloud Functions**

**Step 1: Install Firebase CLI**
```bash
npm install -g firebase-tools
```

**Step 2: Login to Firebase**
```bash
firebase login
```

**Step 3: Initialize Functions**
```bash
firebase init functions
```
- Select your project
- Choose JavaScript
- Install dependencies

**Step 4: Create Cloud Functions**
Create `functions/index.js`:
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

admin.initializeApp();

// Email transporter (using SendGrid)
const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: 'YOUR_SENDGRID_API_KEY'
  }
});

// Function: Create Razorpay Order
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
  const Razorpay = require('razorpay');
  const razorpay = new Razorpay({
    key_id: 'YOUR_RAZORPAY_KEY_ID',
    key_secret: 'YOUR_RAZORPAY_KEY_SECRET'
  });

  const options = {
    amount: 300000, // ₹3,000 in paise
    currency: 'INR',
    receipt: 'booking_' + Date.now()
  };

  const order = await razorpay.orders.create(options);
  return order;
});

// Function: Save Booking After Payment
exports.saveBooking = functions.https.onCall(async (data, context) => {
  const bookingId = 'VEXA' + Date.now();
  
  await admin.firestore().collection('bookings').doc(bookingId).set({
    ...data,
    bookingId: bookingId,
    status: 'confirmed',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Create Google Calendar Event
  await createCalendarEvent(data);

  // Send Confirmation Email
  await sendConfirmationEmail(data);

  return { bookingId: bookingId };
});

// Function: Create Google Calendar Event
async function createCalendarEvent(bookingData) {
  const auth = new google.auth.GoogleAuth({
    keyFile: './service-account-key.json',
    scopes: ['https://www.googleapis.com/auth/calendar']
  });

  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: `VEXA Consultation - ${bookingData.step1.orgName}`,
    description: `Consultation with ${bookingData.step1.fullName}\\n\\nChallenge: ${bookingData.step1.mainChallenge}`,
    start: {
      dateTime: bookingData.step2.datetime,
      timeZone: 'Asia/Kolkata'
    },
    end: {
      dateTime: new Date(new Date(bookingData.step2.datetime).getTime() + 45 * 60000).toISOString(),
      timeZone: 'Asia/Kolkata'
    },
    attendees: [
      { email: bookingData.step1.email },
      { email: 'vexadigital.in@gmail.com' }
    ],
    conferenceData: {
      createRequest: {
        requestId: 'vexa-' + Date.now(),
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  };

  const response = await calendar.events.insert({
    calendarId: 'YOUR_CALENDAR_ID',
    resource: event,
    conferenceDataVersion: 1
  });

  return response.data.hangoutLink;
}

// Function: Send Confirmation Email
async function sendConfirmationEmail(bookingData) {
  const mailOptions = {
    from: 'VEXA Digital <vexadigital.in@gmail.com>',
    to: bookingData.step1.email,
    subject: `Consultation Confirmed - ${new Date(bookingData.step2.datetime).toLocaleDateString()}`,
    html: `
      <h2>Your Consultation is Confirmed!</h2>
      <p>Hi ${bookingData.step1.fullName},</p>
      <p>Your consultation with VEXA Digital has been confirmed.</p>
      
      <h3>Details:</h3>
      <ul>
        <li><strong>Date:</strong> ${new Date(bookingData.step2.datetime).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
        <li><strong>Time:</strong> ${bookingData.step2.time} IST</li>
        <li><strong>Duration:</strong> 30-45 minutes</li>
        <li><strong>Platform:</strong> Google Meet</li>
      </ul>

      <p><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
      
      <h3>What to Prepare:</h3>
      <ul>
        <li>Brief overview of your organization</li>
        <li>Current revenue sources (if any)</li>
        <li>What you've tried so far</li>
        <li>Your biggest challenge</li>
        <li>What you hope to achieve</li>
      </ul>

      <p>You'll receive the Google Meet link 15 minutes before the call.</p>
      
      <p>Looking forward to speaking with you!</p>
      <p><strong>VEXA Digital</strong><br>vexadigital.in@gmail.com<br>+91 9958895505</p>
    `
  };

  await transporter.sendMail(mailOptions);
}

// Function: Send Reminder (24 hours before)
exports.sendReminders = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const bookings = await admin.firestore()
    .collection('bookings')
    .where('step2.datetime', '>=', now.toISOString())
    .where('step2.datetime', '<=', tomorrow.toISOString())
    .where('reminderSent', '==', false)
    .get();

  bookings.forEach(async (doc) => {
    const booking = doc.data();
    // Send reminder email
    await sendReminderEmail(booking);
    // Mark as sent
    await doc.ref.update({ reminderSent: true });
  });
});
```

**Step 5: Deploy Functions**
```bash
firebase deploy --only functions
```

---

## 🔧 TESTING

### Test Mode (Before Going Live)

1. **Test Razorpay Payment**
   - Use test card: 4111 1111 1111 1111
   - Any future expiry date
   - Any CVV

2. **Test Booking Flow**
   - Fill form with test data
   - Select a time slot
   - Complete payment
   - Check confirmation page

3. **Verify Database**
   - Check Firebase Console
   - Booking should appear in Firestore

4. **Check Email**
   - Confirmation email should arrive
   - Check spam folder if not in inbox

---

## 🚀 GO LIVE CHECKLIST

- [ ] Razorpay: Switch from Test Mode to Live Mode
- [ ] Firebase: Update security rules for production
- [ ] SendGrid: Verify sender domain (optional but recommended)
- [ ] Test complete flow end-to-end
- [ ] Set up monitoring/alerts
- [ ] Add Google Analytics
- [ ] Test on mobile devices
- [ ] Check all email links work
- [ ] Verify calendar integration
- [ ] Test payment failure scenarios

---

## 📊 ADMIN DASHBOARD (Optional - Phase 2)

Create a simple admin page to:
- View all bookings
- See upcoming consultations
- Export booking data
- Send manual reminders
- Block time slots

---

## 💰 COST BREAKDOWN

**Monthly Costs (Estimated):**
- Razorpay: 2% per transaction (₹60 per ₹3,000 booking)
- Firebase: Free tier (up to 50K reads/day)
- SendGrid: Free (up to 100 emails/day)
- Google Calendar API: Free
- Domain (if needed): ₹500-1000/year

**Total: Essentially FREE until you scale**

---

## 🆘 SUPPORT

If you get stuck:
1. Check Firebase Console for errors
2. Check browser console (F12) for JavaScript errors
3. Verify all API keys are correct
4. Test in incognito mode
5. Check email spam folder

---

## 📝 NEXT STEPS

1. **Set up Razorpay** (highest priority)
2. **Set up Firebase** (for database)
3. **Set up SendGrid** (for emails)
4. **Deploy Cloud Functions** (for automation)
5. **Test everything**
6. **Go live!**

---

**Need help with any step? Let me know which phase you're on and I'll provide detailed guidance!**