# TTAM – Table Tennis Association of Maldives
### Official Member Portal · Web + Mobile App

![TTAM](public/logo.svg)

A full-featured React web application and mobile app (iOS + Android via Capacitor) for managing the Table Tennis Association of Maldives.

---

## ✨ Features

| Module | Features |
|---|---|
| **Authentication** | Email/password login, role-based access (member, guest, admin, superadmin) |
| **Table Booking** | 3-step wizard, live table status, duplicate booking prevention, time slot picker |
| **Payments** | Upload transfer slip (BML, MIB, MCB, mFaisa, MePay), payment history, admin verification |
| **Invoices** | Auto-generated, PDF download, email delivery |
| **Notifications** | Real-time in-app, email (Resend), push (OneSignal), notification preferences |
| **Members** | Directory, search/filter, membership management |
| **Guests** | Guest registration, day/week pass, member-invited guests |
| **Tournaments** | Listings, registration, progress tracking, winners gallery |
| **Rankings** | National player rankings by category |
| **Announcements** | Admin-publishable news board with real-time updates |
| **Admin Panel** | Booking management, payment verification, member management |
| **Public Pages** | About TTAM, Exco members, Champions gallery, Contact form |
| **PWA** | Installable on any device, offline support, push notifications |
| **Mobile** | iOS + Android native apps via Capacitor |

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Fill in your Supabase URL and anon key

# 3. Run database migrations
# Copy supabase/migrations/001_initial.sql into Supabase SQL Editor and run

# 4. Start development server
npm run dev
# → http://localhost:3000
```

See **INSTALLATION_GUIDE.md** for the complete step-by-step setup including Supabase, Netlify, email, push notifications, and mobile app publishing.

---

## 📁 Project Structure

```
ttam-app/
├── public/
│   ├── logo.svg              ← TTAM logo
│   ├── manifest.json         ← PWA manifest
│   ├── sw.js                 ← Service worker (offline + push)
│   └── icons/                ← App icons (generate with scripts/generate-icons.js)
├── scripts/
│   └── generate-icons.js     ← PWA icon generator
├── src/
│   ├── components/
│   │   ├── Booking/
│   │   │   ├── index.jsx     ← TableGrid, TimeSlots, Calendar, StepIndicator
│   │   │   └── TableStatus.jsx ← Real-time live table availability
│   │   ├── Layout/
│   │   │   ├── Layout.jsx    ← App shell with sidebar + mobile nav
│   │   │   ├── TopNav.jsx    ← Top navigation bar
│   │   │   ├── Sidebar.jsx   ← Desktop sidebar
│   │   │   └── MobileNav.jsx ← Mobile bottom navigation bar
│   │   ├── Payment/
│   │   │   └── index.jsx     ← SlipUpload, InvoiceView
│   │   ├── Tournament/
│   │   │   └── index.jsx     ← TournamentCard, WinnerPodium
│   │   └── UI/
│   │       ├── index.jsx     ← Button, Card, Badge, Modal, Input, Tabs, etc.
│   │       └── ErrorBoundary.jsx
│   ├── hooks/
│   │   ├── useAuth.js        ← Auth context (sign in, sign up, profile)
│   │   ├── useBookings.js    ← Booking CRUD + duplicate prevention
│   │   ├── useNotifications.js ← Real-time notifications
│   │   ├── usePayments.js    ← Payment + invoice management
│   │   ├── useTournaments.js ← Tournament data + registration
│   │   └── useSupabase.js    ← Generic query/mutation/realtime hooks
│   ├── lib/
│   │   ├── supabase.js       ← Supabase client + helpers
│   │   ├── pdf.js            ← jsPDF invoice generator
│   │   ├── notifications.js  ← Email + web push helpers
│   │   └── mobilePush.js     ← Capacitor native push (iOS/Android)
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Booking.jsx
│   │   ├── Announcements.jsx
│   │   ├── MembersPages.jsx  ← MyBookings, Members, Guests, Rankings
│   │   ├── PaymentPages.jsx  ← Payments, Invoices
│   │   ├── InfoPages.jsx     ← Tournaments, Notifications, About, Exco, Champions, Contact
│   │   └── AdminPages.jsx    ← AdminPanel, Profile, Settings
│   ├── styles/
│   │   └── globals.css
│   ├── App.jsx               ← Router
│   └── main.jsx              ← Entry point
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial.sql   ← Full schema, RLS, triggers, seed data
│   │   └── 002_push_tokens_and_extras.sql
│   └── functions/
│       └── send-email/       ← Resend email Edge Function
├── .env.example
├── capacitor.config.ts       ← Mobile app config
├── netlify.toml              ← Netlify deploy config
├── vite.config.js
└── package.json
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Pure CSS with CSS variables (no Tailwind) |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| Real-time | Supabase Realtime (WebSocket) |
| Email | Resend (via Supabase Edge Function) |
| Push (Web) | OneSignal |
| Push (Mobile) | Capacitor PushNotifications |
| PDF | jsPDF |
| Mobile | Capacitor 5 (iOS + Android) |
| Hosting | Netlify |
| CI/CD | Netlify auto-deploy from GitHub |

---

## 💰 Cost — $0/month

All services used have free tiers that cover TTAM's needs:

- **Supabase** – 500MB DB, 1GB storage, 50,000 MAU/month
- **Netlify** – 100GB bandwidth, 300 build minutes/month
- **Resend** – 3,000 emails/month
- **OneSignal** – Unlimited push notifications
- **GitHub** – Unlimited repositories

---

## 📱 Mobile App

```bash
npm run build
npm run mobile:ios      # Opens Xcode
npm run mobile:android  # Opens Android Studio
```

App ID: `mv.ttam.app`

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_RESEND_API_KEY` | Resend email API key |
| `VITE_ONESIGNAL_APP_ID` | OneSignal app ID for push |

---

## 👥 User Roles

| Role | Access |
|---|---|
| `member` | Book tables, view own bookings/invoices/payments |
| `guest` | Limited booking (higher rate), no membership benefits |
| `admin` | Full booking management, payment verification, member management |
| `superadmin` | All admin + user role management |

---

*Built for TTAM · Table Tennis Association of Maldives · ttam.mv*
