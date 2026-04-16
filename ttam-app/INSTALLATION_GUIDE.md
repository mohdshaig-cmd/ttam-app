# TTAM App – Complete Installation Guide
## Table Tennis Association of Maldives

---

## ✅ Prerequisites

Install these on your computer before starting:

| Tool | Version | Download |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| Git | Any | https://git-scm.com |
| VS Code (recommended) | Any | https://code.visualstudio.com |

Verify installations by opening a terminal and running:
```bash
node --version    # should show v20.x.x
npm --version     # should show 10.x.x
git --version     # should show 2.x.x
```

---

## PART 1 — Supabase Setup (Database + Auth)

### Step 1.1 — Create Supabase Account
1. Go to **https://supabase.com**
2. Click **Start your project** → Sign up with GitHub or email
3. Verify your email

### Step 1.2 — Create New Project
1. Click **New Project**
2. Fill in:
   - **Name:** `ttam-app`
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose `Singapore` (closest to Maldives)
3. Click **Create new project**
4. Wait 2–3 minutes for it to provision

### Step 1.3 — Get Your API Keys
1. In your Supabase project, go to **Settings** (gear icon) → **API**
2. Copy and save:
   - **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
   - **anon public key** — long string starting with `eyJ...`

### Step 1.4 — Run the Database Migration
1. In Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase/migrations/001_initial.sql` from this project
4. Copy the entire contents and paste into the SQL editor
5. Click **Run** (green button)
6. You should see: `Success. No rows returned`

### Step 1.5 — Create Storage Bucket
1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name it: `payment-slips`
4. Keep **Public bucket** UNCHECKED (private)
5. Click **Save**

### Step 1.6 — Set Up Authentication
1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled (it is by default)
3. Go to **Authentication** → **Email Templates**
4. Optionally customize the confirmation email template with TTAM branding

---

## PART 2 — Project Setup

### Step 2.1 — Download the Project
Open your terminal:
```bash
# Create a folder and enter it
mkdir ttam-app
cd ttam-app

# Or if using git:
git clone https://github.com/your-username/ttam-app.git
cd ttam-app
```

If you downloaded a ZIP, extract it and open terminal in that folder.

### Step 2.2 — Install Dependencies
```bash
npm install
```
This downloads all required packages (~2–3 minutes).

### Step 2.3 — Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env
```

Now open `.env` in VS Code and fill in your values:
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Leave these blank for now — add later
VITE_RESEND_API_KEY=
VITE_ONESIGNAL_APP_ID=
```

### Step 2.4 — Run Development Server
```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

You should see the TTAM login page! 🎉

---

## PART 3 — Create Your Admin Account

### Step 3.1 — Register
1. Go to http://localhost:3000/register
2. Fill in all fields (use your real email)
3. Check your email for a confirmation link
4. Click the confirmation link

### Step 3.2 — Promote to Admin
After confirming your email, go back to Supabase:
1. Click **SQL Editor** → **New query**
2. Run this (replace with your actual email):
```sql
UPDATE profiles 
SET role = 'superadmin' 
WHERE email = 'your-email@example.com';
```
3. Click **Run**

### Step 3.3 — Sign In
1. Go to http://localhost:3000/login
2. Sign in with your email and password
3. You now have full admin access!

---

## PART 4 — Email Notifications Setup (Resend)

### Step 4.1 — Create Resend Account
1. Go to **https://resend.com** → Sign Up (free)
2. Verify your email

### Step 4.2 — Add Your Domain (Optional but Recommended)
1. In Resend, go to **Domains** → **Add Domain**
2. Enter `ttam.mv` (or your domain)
3. Add the DNS records shown to your domain provider
4. Click **Verify**

### Step 4.3 — Get API Key
1. Go to **API Keys** → **Create API Key**
2. Name it `ttam-app`
3. Copy the key (starts with `re_`)
4. Paste it in your `.env`:
```env
VITE_RESEND_API_KEY=re_xxxxxxxxxxxx
```

### Step 4.4 — Deploy the Edge Function
Install Supabase CLI:
```bash
npm install -g supabase
```

Login and link your project:
```bash
supabase login
supabase link --project-ref your-project-ref
```
(Find your project-ref in Supabase Settings → General)

Set the secret and deploy:
```bash
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase functions deploy send-email
```

---

## PART 5 — Push Notifications (OneSignal)

### Step 5.1 — Create OneSignal Account
1. Go to **https://onesignal.com** → Sign Up (free)
2. Click **New App/Website**
3. Name it `TTAM`
4. Select **Web Push**

### Step 5.2 — Configure Web Push
1. Choose **Typical Site**
2. Site URL: `https://ttam.netlify.app` (or your domain)
3. Default Icon URL: Upload your TTAM logo
4. Click **Save & Continue**

### Step 5.3 — Get App ID
1. After setup, copy your **App ID** (UUID format)
2. Paste in `.env`:
```env
VITE_ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## PART 6 — Deploy to Netlify (Live Website)

### Step 6.1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial TTAM app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ttam-app.git
git push -u origin main
```

### Step 6.2 — Create Netlify Account
1. Go to **https://netlify.com** → Sign Up with GitHub
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub** → Authorize Netlify
4. Select your `ttam-app` repository

### Step 6.3 — Configure Build Settings
Netlify auto-detects Vite projects. Verify:
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- Click **Deploy site**

### Step 6.4 — Add Environment Variables to Netlify
1. In Netlify → Your site → **Site configuration** → **Environment variables**
2. Add all variables from your `.env` file:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_RESEND_API_KEY`
   - `VITE_ONESIGNAL_APP_ID`
3. Click **Save**, then **Trigger deploy** → **Deploy site**

### Step 6.5 — Set Custom Domain (Optional)
1. Netlify → Domain management → Add custom domain
2. Enter `ttam.mv` or `app.ttam.mv`
3. Follow the DNS instructions shown

---

## PART 7 — Mobile App (iOS & Android)

### Step 7.1 — Build the Web App
```bash
npm run build
```

### Step 7.2 — Install Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init TTAM mv.ttam.app --web-dir dist
```

### Step 7.3 — Add Platforms
```bash
npx cap add ios
npx cap add android
```

### Step 7.4 — Sync
```bash
npx cap sync
```

### Step 7.5 — Open in IDE
**For iOS** (requires macOS + Xcode):
```bash
npx cap open ios
# In Xcode: set your Team, Bundle ID, then Product → Archive
```

**For Android** (requires Android Studio):
```bash
npx cap open android
# In Android Studio: Build → Generate Signed Bundle/APK
```

### Step 7.6 — App Store Submission
**Google Play:**
1. Generate a signed APK or AAB in Android Studio
2. Go to https://play.google.com/console → Create app → Upload

**Apple App Store:**
1. Archive in Xcode → Distribute App
2. Go to https://appstoreconnect.apple.com → Create new app

---

## PART 8 — Ongoing Maintenance

### Adding Members
```sql
-- In Supabase SQL Editor, after a user signs up:
UPDATE profiles 
SET membership_type = 'elite', membership_expiry = '2027-12-31'
WHERE email = 'member@example.com';
```

### Promoting to Admin
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
```

### Viewing All Bookings (Admin)
```sql
SELECT b.*, p.full_name, t.name as table_name
FROM bookings b
JOIN profiles p ON b.user_id = p.id
JOIN tables t ON b.table_id = t.id
ORDER BY booking_date DESC;
```

### Checking Pending Payments
```sql
SELECT pm.*, p.full_name, p.email
FROM payments pm
JOIN profiles p ON pm.user_id = p.id
WHERE pm.status = 'pending'
ORDER BY pm.created_at;
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| `npm install` fails | Run `node --version` — must be v18+ |
| White screen on load | Check `.env` values are correct |
| Can't sign in | Check Supabase Auth → confirm email verification |
| "relation does not exist" error | Re-run the SQL migration |
| Storage upload fails | Check the bucket name is `payment-slips` |
| Emails not sending | Verify Resend API key + Edge Function deployed |
| Netlify build fails | Check environment variables are set in Netlify dashboard |

---

## 📁 File Reference

```
ttam-app/
├── src/
│   ├── components/
│   │   ├── Layout/         ← TopNav, Sidebar, Layout wrapper
│   │   ├── UI/             ← Button, Card, Badge, Modal etc.
│   │   ├── Booking/        ← TableGrid, TimeSlots, Calendar
│   │   ├── Payment/        ← SlipUpload, InvoiceView
│   │   └── Tournament/     ← TournamentCard, WinnerPodium
│   ├── pages/
│   │   ├── Auth/           ← Login, Register
│   │   ├── Dashboard.jsx
│   │   ├── Booking.jsx
│   │   ├── MembersPages.jsx  ← MyBookings, Members, Guests, Rankings
│   │   ├── PaymentPages.jsx  ← Payments, Invoices
│   │   ├── InfoPages.jsx     ← Tournaments, Notifications, About, Exco, Champions, Contact
│   │   └── AdminPages.jsx    ← AdminPanel, Profile, Settings
│   ├── hooks/
│   │   ├── useAuth.js      ← Auth context & helpers
│   │   ├── useBookings.js  ← Booking CRUD
│   │   └── useNotifications.js
│   ├── lib/
│   │   ├── supabase.js     ← DB client + helpers
│   │   ├── pdf.js          ← Invoice PDF generator
│   │   └── notifications.js← Email + push helpers
│   ├── styles/globals.css
│   ├── App.jsx             ← Router
│   └── main.jsx            ← Entry point
├── supabase/
│   ├── migrations/001_initial.sql  ← Full DB schema
│   └── functions/send-email/       ← Resend edge function
├── .env.example
├── netlify.toml
├── capacitor.config.ts
└── package.json
```

---

## 💰 Cost Summary — All Free

| Service | Free Tier | Notes |
|---|---|---|
| **Supabase** | 500MB DB, 1GB storage, 50k MAU | Free forever |
| **Netlify** | 100GB bandwidth, 300 build min/mo | Free forever |
| **Resend** | 3,000 emails/month | Free tier |
| **OneSignal** | Unlimited push notifications | Free forever |
| **GitHub** | Unlimited public repos | Free forever |
| **Total** | **$0/month** | ✅ |

---

*TTAM – Table Tennis Association of Maldives*  
*For support: info@ttam.mv*
