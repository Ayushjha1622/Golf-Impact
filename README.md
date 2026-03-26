# ⛳ GolfImpact — Complete SaaS Platform

> **The subscription platform that bridges your passion for golf with global human impact.**
> Track scores. Win prizes. Change lives.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [System Architecture](#-system-architecture)
4. [Database Schema](#-database-schema)
5. [Full User Flow](#-full-user-flow)
6. [Environment Variables](#-environment-variables)
7. [Local Development Setup](#-local-development-setup)
8. [Supabase Setup](#-supabase-setup)
9. [Stripe Setup](#-stripe-setup)
10. [All API Routes](#-all-api-routes)
11. [Admin Panel — Full Guide](#-admin-panel--full-guide)
12. [Frontend Pages](#-frontend-pages)
13. [Core Logic Explained](#-core-logic-explained)
14. [Deployment (Vercel)](#-deployment-vercel)
15. [Troubleshooting](#-troubleshooting)

---

## 🏆 Project Overview

GolfImpact is a **subscription-based SaaS gamification engine** for golfers. Subscribers:

- Pay a monthly subscription (via Stripe)
- Submit their Stableford golf scores
- Become **eligible** for the monthly prize draw after 5 scores
- Get a **rolling handicap** calculated from their last 5 scores
- Choose a **charity** to receive a % of their subscription
- Compete on a **live leaderboard** against other members
- **WIN** monthly jackpots run by the admin draw engine

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Language** | JavaScript (ES2024) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Email/Password) |
| **Payments** | Stripe (Subscriptions) |
| **Styling** | Tailwind CSS + Vanilla CSS |
| **Icons** | Lucide React |
| **Deployment** | Vercel |

---

## 🏗 System Architecture

```
User → Landing Page → Signup → Subscribe (Stripe)
     ↓
Dashboard (Auth Protected)
     ↓
Submit Score → /api/scores
     ↓
IF scores >= 5:
  → draw_entries row created
  → Eligible: YES shown on dashboard
  → Rolling Handicap calculated
  → Leaderboard updated

Admin → /admin → Run Draw
     ↓
/api/admin/run-draw picks random winner from draw_entries
     ↓
Winner inserted into winners table → Payout flow triggered
```

---

## 🗄 Database Schema

> **Run this full schema in your Supabase SQL Editor** → `platform/supabase_schema.sql`
> The leaderboard view is in `supabase_leaderboard.sql` (root of project).

### Tables

| Table | Purpose |
|---|---|
| `users` | User profiles linked to Supabase Auth |
| `scores` | Every golf score submitted by users |
| `draw_entries` | Eligible entries for the monthly draw |
| `charities` | List of selectable charities |
| `charity_choices` | User → Charity mapping with % |
| `draws` | Historical draw records with winning numbers |
| `winners` | Draw winners awaiting payout verification |
| `settings` | Key-value store (e.g. jackpot rollover amount) |

### Views

| View | Purpose |
|---|---|
| `leaderboard_view` | Aggregated scores per user, filtered to 5+ entries |

### Key Columns

**`users`**
```sql
id                  uuid (linked to auth.users)
email               text
subscription_status text  ('active' | 'inactive' | 'renewal_pending')
charity_id          uuid → charities
charity_percent     int  (min 10%)
stripe_customer_id  text
```

**`scores`**
```sql
id          uuid
user_id     uuid → users
score       int  (1-45 Stableford)
course_name text
played_at   timestamptz
```

**`draw_entries`**
```sql
id         uuid
user_id    uuid → users
created_at timestamptz
```

**`winners`**
```sql
id             uuid
user_id        uuid → users
draw_id        uuid → draws
tier           text
prize_amount   decimal
payment_status text ('pending' | 'paid')
proof_url      text
```

---

## 🔄 Full User Flow

```
1. User visits / (Landing Page)
2. Clicks "Start Your Impact" → /signup
3. Creates account (Supabase Auth email/password)
4. Redirected to /subscribe → selects plan
5. Completes Stripe Checkout
6. Stripe webhook fires OR dashboard detects ?status=success
7. User's subscription_status set to 'active' in users table
8. User lands on /dashboard
9. User submits a golf score (course + Stableford points)
10. Score stored in scores table
11. System counts user's total scores
12. IF count >= 5 → draw_entry created → "Eligible: YES" shown
13. Rolling Handicap (avg of last 5 scores) shown on dashboard
14. Leaderboard auto-updates to include user
15. User selects charity at /dashboard/charity
16. Admin triggers draw at /admin → "Run Draw" button
17. Random winner picked from draw_entries
18. Winner stored in winners table
19. Admin reviews & processes payout at /admin/winners/:id
```

---

## 🔐 Environment Variables

Create a `.env.local` file inside the `platform/` folder:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...   (or sk_test_... for dev)
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_ID_BASIC=price_xxx
STRIPE_PRICE_ID_PRO=price_xxx
STRIPE_PRICE_ID_ELITE=price_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **Never commit `.env.local` to git.** It is already in `.gitignore`.

---

## 💻 Local Development Setup

```bash
# 1. Navigate to the platform folder
cd "Golf Project/platform"

# 2. Install dependencies
npm install

# 3. Create your .env.local (see above)

# 4. Run development server
npm run dev

# 5. Open in browser
# → http://localhost:3000
```

---

## ⚡ Supabase Setup

### Step 1 — Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project, copy `URL` and `anon key` and `service_role key`

### Step 2 — Run the Schema
1. Go to **Supabase Dashboard → SQL Editor**
2. Copy contents of `platform/supabase_schema.sql`
3. Click **Run**

### Step 3 — Run the Leaderboard View
1. In SQL Editor, run:
```sql
create or replace view leaderboard_view as
select 
user_id,
avg(score) as avg_score,
count(*) as total_scores
from scores
group by user_id
having count(*) >= 5
order by avg_score desc;
```

### Step 4 — Seed Charities
Add at least 1 charity so the charity selection page works:
```sql
insert into public.charities (name, description, is_featured)
values 
  ('Macmillan Cancer Support', 'Supporting people living with cancer.', true),
  ('Age UK', 'Helping older people live active lives.', false),
  ('WWF', 'Protecting the natural world.', false);
```

### Step 5 — Enable RLS Bypass for Service Role
The backend API routes use `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS automatically. No extra setup needed.

---

## 💳 Stripe Setup

### Step 1 — Create Products
1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Create 3 subscription products (Basic / Pro / Elite)
3. Copy each **Price ID** into `.env.local`

### Step 2 — Configure Webhook (Production)
1. Go to **Stripe → Webhooks → Add Endpoint**
2. URL: `https://your-domain.com/api/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy **Webhook Secret** → `STRIPE_WEBHOOK_SECRET`

> 💡 **Local Development:** Webhooks don't fire locally. The dashboard auto-detects `?status=success` and activates the subscription optimistically.

---

## 📡 All API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/scores` | Submit a new golf score + create draw entry if eligible |
| `GET` | `/api/handicap?user_id=xxx` | Get rolling handicap (avg of last 5 scores) |
| `GET` | `/api/leaderboard` | Get full leaderboard (users with 5+ scores) |
| `POST` | `/api/charity` | Save charity selection for a user |
| `POST` | `/api/admin/draw` | Run the monthly draw (picks random winner) |
| `POST` | `/api/admin/run-draw` | Full draw with jackpot rollover logic |
| `POST` | `/api/subscribe` | Create a Stripe checkout session |
| `POST` | `/api/webhook` | Stripe webhook handler |
| `GET` | `/api/draw/eligibility` | Check if current user is draw-eligible |
| `POST` | `/api/admin/verify-winner` | Mark a winner payout as processed |
| `GET` | `/api/admin/analytics` | Platform-level stats for admin view |
| `GET` | `/api/admin/users` | List all users for admin table |
| `GET` | `/api/winners` | List winners |
| `GET` | `/api/charities` | List all available charities |
| `POST` | `/api/email` | Send email notification |

---

## 🛡 Admin Panel — Full Guide

### How to Access

Navigate to:
```
http://localhost:3000/admin
```
OR on production:
```
https://your-domain.com/admin
```

> ⚠️ **IMPORTANT:** The admin page is currently accessible to **any logged-in user**. For production, you must add role protection (see below).

### What the Admin Panel Shows

| Section | What it does |
|---|---|
| **Stats Row** | Total Users, Draws Run, Charities, Pending Payouts |
| **Users Table** | Live list of all registered users with subscription status |
| **Draw Engine** | Button to run the monthly prize draw |
| **Charities Table** | View/edit charities, add new ones |
| **Pending Payouts** | List of winners awaiting payment with "Review & Pay" links |

### How to Run a Draw (Step-by-Step)

1. Go to `http://localhost:3000/admin`
2. Scroll to the **"Draw Engine"** section
3. Click **"Run Monthly Draw"**
4. The system:
   - Fetches all entries from `draw_entries` table
   - Picks one at **random**
   - Inserts the winner into `winners` table with `payment_status = 'pending'`
   - If no entries exist → jackpot rolls over and is increased by £1000
5. The winner appears instantly in the **"Pending Payouts"** section below
6. Click **"Review & Pay"** to process the winner's payout

### How to Add a Charity (Step-by-Step)

1. Go to `/admin`
2. In the **Charities** section, click **"+ Add Charity"**
3. Fill in name, description, website URL
4. Toggle "Featured" if you want it highlighted
5. Save — it immediately appears on the `/dashboard/charity` selection page for all users

### Protecting the Admin Panel (Production)

Add an `is_admin` column to `users` table:
```sql
alter table public.users add column is_admin boolean default false;
-- Then set yourself as admin:
update public.users set is_admin = true where email = 'your@email.com';
```

Then in `src/app/admin/page.js`, add:
```js
if (!profile?.is_admin) redirect('/dashboard')
```

---

## 📄 Frontend Pages

| URL | Page | Auth Required |
|---|---|---|
| `/` | Landing page | No |
| `/signup` | Create account | No |
| `/login` | Sign in | No |
| `/subscribe` | Choose plan + Stripe checkout | Yes |
| `/dashboard` | Main user dashboard | Yes |
| `/dashboard/charity` | Choose charity | Yes |
| `/admin` | Admin control panel | Yes (admin only in prod) |
| `/admin/charities/new` | Add new charity | Yes |
| `/admin/winners/:id` | Review winner + payout | Yes |

---

## 🧮 Core Logic Explained

### Eligibility Rule
```
User submits score → count all their scores
IF count >= 5 → insert row into draw_entries → "Eligible: YES"
```

### Rolling Handicap
```
Fetch last 5 scores ordered by played_at DESC
Average them → displayed as handicap
Returns null if user has fewer than 5 scores
```

### Draw System
```
Admin clicks "Run Draw"
→ all draw_entries fetched
→ Math.random() picks one winner
→ Winner written to winners table (payment_status = 'pending')
→ If no entries → jackpot += 1000 (stored in settings table)
```

### Leaderboard
```
SQL View: leaderboard_view
→ Groups scores by user_id
→ Filters to users with count(*) >= 5
→ Orders by avg_score DESC
→ Frontend renders: Rank / Player ID / Handicap / Score Count / Draw Entries
```

### Charity % Flow
```
User selects charity on /dashboard/charity
→ charity_id + charity_percent saved to users table
→ Dashboard shows selected charity name + % donated
→ (Future: % of Stripe revenue routed to charity on each billing cycle)
```

---

## 🚀 Deployment (Vercel)

```bash
# 1. Push your code to GitHub

# 2. Go to vercel.com → New Project → Import your repo

# 3. Set Root Directory to: platform

# 4. Add all environment variables from .env.local
#    (Supabase URL, Keys, Stripe Keys, App URL)

# 5. Deploy!
```

After deployment:
- Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
- Update Stripe Webhook Endpoint URL to `https://your-app.vercel.app/api/webhook`
- Update Supabase Auth redirect URLs under **Authentication → URL Configuration**

---

## 🔧 Troubleshooting

### ❌ "Leaderboard 500 Error"
**Cause:** `leaderboard_view` does not exist in Supabase.  
**Fix:** Run the SQL from `supabase_leaderboard.sql` in Supabase SQL Editor.

### ❌ "Hydration mismatch" error
**Cause:** `toLocaleDateString()` formats dates differently on server vs client.  
**Fix:** Already patched — now uses `toLocaleDateString('en-GB', {...})` consistently.

### ❌ "Eligible: NO" even after 5+ scores
**Cause:** Old draw-entry logic called a different (broken) endpoint.  
**Fix:** New `/api/scores` route automatically creates `draw_entries` after the 5th score. Re-submit scores if needed.

### ❌ Subscription not activating locally
**Cause:** Stripe webhooks don't fire to localhost.  
**Fix:** The dashboard detects `?status=success` in the URL and activates the subscription optimistically. This is expected dev behaviour.

### ❌ "Missing fields" from score submission
**Cause:** Old ScoreForm was sending `course` instead of `course_name`.  
**Fix:** Already patched — ScoreForm now sends `{ user_id, score, course_name }`.

### ❌ Draw entries not creating
**Cause:** Old `/api/draw-entry` endpoint was separate and broken.  
**Fix:** Draw entry creation is now baked directly into `/api/scores` — no separate call needed.

---

## 📁 Project File Structure

```
Golf Project/
├── README.md                        ← You are here
├── supabase_leaderboard.sql         ← Run this in Supabase SQL Editor
└── platform/
    ├── .env.local                   ← Your secrets (gitignored)
    ├── supabase_schema.sql          ← Full DB schema
    └── src/
        ├── app/
        │   ├── page.js              ← Landing Page
        │   ├── login/page.js        ← Login
        │   ├── signup/page.js       ← Sign Up
        │   ├── subscribe/page.js    ← Stripe Plans
        │   ├── dashboard/
        │   │   ├── page.js          ← Main Dashboard
        │   │   └── charity/page.js  ← Charity Selection
        │   ├── admin/
        │   │   └── page.js          ← Admin Panel ← (http://localhost:3000/admin)
        │   └── api/
        │       ├── scores/          ← Score submission + draw entry
        │       ├── handicap/        ← Rolling handicap calculator
        │       ├── leaderboard/     ← Leaderboard data
        │       ├── charity/         ← Charity selection
        │       ├── subscribe/       ← Stripe checkout
        │       ├── webhook/         ← Stripe webhook
        │       └── admin/
        │           ├── draw/        ← Simple draw runner
        │           ├── run-draw/    ← Draw + jackpot rollover
        │           ├── users/       ← Users list
        │           ├── winners/     ← Winners management
        │           └── verify-winner/ ← Mark winner as paid
        ├── components/
        │   ├── ScoreForm.js         ← Score entry UI
        │   ├── Leaderboard.js       ← Live leaderboard
        │   ├── AdminDrawPanel.js    ← Admin draw button
        │   ├── AdminUsersTable.js   ← Admin users list
        │   └── Navbar.js            ← Navigation
        └── lib/
            ├── auth.js              ← Supabase server auth
            ├── supabase.js          ← Supabase client
            └── handicap.js          ← Handicap calc utility
```

---

## 📜 License

Product of **Digital Heroes** · © 2026  
All rights reserved.
