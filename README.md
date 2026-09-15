# AlphaGuard Dashboard

Multi-tenant access-control admin portal. Next.js (App Router, TypeScript) + Supabase
(Postgres, Auth, Storage, Realtime), deployed on Vercel.

Each customer organization signs up, gets isolated data via Postgres Row-Level
Security, creates one or more "sites" (a gate / scanner device) each with its own
API key, and points the AlphaGuard Android app at this dashboard.

## One-time setup

1. **Run the schema.** Supabase dashboard → SQL Editor → paste the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → Run.
   This creates the tables, Row-Level Security policies, the signup trigger, the
   `photos` storage bucket, and enables Realtime on `sessions`.

2. **Environment variables.** Copy `.env.example` to `.env.local` and fill in
   (Supabase dashboard → Project Settings → API):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (safe for the browser)
   - `SUPABASE_SERVICE_ROLE_KEY` (secret — server only, bypasses RLS)

3. **Local dev:**
   ```bash
   npm install
   npm run dev
   ```

4. **Deploy:** import this repo at [vercel.com](https://vercel.com/new), add the
   same three environment variables in the Vercel project settings, deploy.

## How it fits together

- **Sign up** → a Postgres trigger (`handle_new_user`) creates an `organizations`
  row and a `profiles` row (role `owner`) for the new user.
- **Row-Level Security** on `sessions`/`sites`/`profiles`/`organizations` means a
  logged-in user only ever sees their own org's data — enforced in the database,
  not just the app.
- **Sites & devices** (Dashboard → Sites & devices): each site gets a random API
  key. Put that key + this dashboard's URL into the Android app's
  Settings → Backend Sync.
- **Device ingest** (`/api/v1/sessions`, `/api/v1/sessions/[id]/photo`): the
  scanner app authenticates with `Authorization: Bearer <site api key>`, not a
  Supabase user session. The route looks up the site, then writes with the
  service-role key (bypassing RLS deliberately, since this is the trusted path).
- **Live updates**: the "On premises" and "Flagged" views subscribe to Supabase
  Realtime — no manual refresh needed when a new scan comes in.
- **Photos**: stored in a private Supabase Storage bucket; only ever read through
  `/api/photo/[id]`, which checks the session belongs to the caller's org first.

## Still to do

- Point the Android app's `SyncClient`/`SyncConfig` at this API instead of the
  old Cloudflare backend (different auth header contract — same bearer-token
  shape, new URL).
- Team invites (currently one owner per org at signup; adding teammates to an
  existing org isn't built yet).
