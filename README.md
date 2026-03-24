# Women’s empowerment — digital learning & careers

Digital learning and career development platform to empower young African women with essential digital skills (Microsoft Word, Excel, digital literacy), CV/resume preparation, and job-readiness tools.

This project is split into:

- **server** — Node.js/Express TypeScript API (courses, jobs, applications, profile, dashboards). Uses the **Supabase anon key** plus the user’s **access JWT** so **Row Level Security** enforces access.
- **client** — React + Vite + TypeScript; **Supabase Auth** for sign-up/sign-in; calls the API with the Supabase session token.
- **supabase/migrations** — PostgreSQL schema: `profiles`, `courses`, `lessons`, `progress`, `certificates`, `jobs`, `applications`, `resources`, `notifications`, plus RLS policies and triggers (certificates, notifications).

## 1. Prerequisites

- Node.js (LTS, e.g. 18+)
- A [Supabase](https://supabase.com/) project (free tier is fine)

Verify:

```bash
node -v
npm -v
```

## 2. Supabase setup

1. Create a project in the Supabase dashboard.
2. Open **SQL Editor** and run the full contents of:

   `supabase/migrations/20250324120000_initial_schema.sql`

   (Or use the Supabase CLI: `supabase db push` if you link this repo.)

3. **Auth → Providers**: ensure Email is enabled.

4. **Optional (recommended for local dev)** — **Auth → Providers → Email**: disable **Confirm email** so new users can sign in immediately without clicking a confirmation link.

5. Copy **Project URL** and **anon public** key to the client env. Copy **service_role** key only on the server for seeding (never expose it in the browser).

## 3. Seed admin + demo content

From `server/` (requires `SUPABASE_SERVICE_ROLE_KEY` in `.env`):

```bash
cd server
npm install
cp .env.example .env
# Edit .env with SUPABASE_* and service role key
npm run seed
```

This ensures a user exists for `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD`, sets `profiles.role = 'admin'`, and inserts demo **courses**, **lessons**, and **resources** if tables are empty.

## 4. Backend (`server`)

```bash
cd server
npm install
npm run dev
```

API: `http://localhost:4000`

Required env vars:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

See `server/.env.example`.

## 5. Frontend (`client`)

```bash
cd client
npm install
cp .env.example .env.local
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Vite proxies `/api` to the Express server (`vite.config.ts`).

## 6. Auth model

- **Register / login** happen in the browser via `supabase.auth.signUp` / `signInWithPassword`.
- New users get a row in **`public.profiles`** from the `on_auth_user_created` trigger (`role` from signup metadata: `learner` or `employer` only; `admin` is not self-service).
- The Express **`Authorization: Bearer &lt;access_token&gt;`** header uses the same JWT; the server builds a user-scoped Supabase client so **RLS** applies on every query.
- **`/api/auth/me`** returns `{ id, email, name, role }` from `auth` + `profiles`.

## 7. RLS summary

| Area | Policy idea |
|------|----------------|
| `profiles` | Users read/update self; employers can read applicants’ profiles; admins read all. Role changes blocked except for admins (trigger). |
| `courses` / `lessons` | World-readable; writes admin-only. |
| `progress` | Learners insert/read own. |
| `certificates` | Read own or admin; rows created by DB trigger when a course is completed. |
| `jobs` | Anyone can read; employers insert own rows; `employer_display_name` set by trigger. |
| `applications` | Learners apply; employers read/update for their jobs. |
| `resources` | Read all; writes admin-only. |
| `notifications` | Read/update own; inserts via **SECURITY DEFINER** triggers (jobs, applications, course completion). |

## 8. Important directories

| Path | Purpose |
|------|---------|
| `supabase/migrations/` | Schema, RLS, triggers |
| `server/src/lib/supabase.ts` | Anon / user / service Supabase clients |
| `server/src/middleware/authMiddleware.ts` | Validates Supabase JWT + loads role |
| `server/src/routes/` | REST handlers |
| `server/src/seed.ts` | Admin + demo data (service role) |
| `client/src/lib/supabase.ts` | Browser Supabase client |
| `client/src/context/AuthContext.tsx` | Session + `/api/auth/me` |

## 9. Local flow

1. Apply SQL migration in Supabase.  
2. `cd server && npm run seed`  
3. `npm run dev` in `server` and `client`.  
4. Open `http://localhost:5173` — register as learner or employer, or log in as seeded admin (`admin@demo.com` / `password123` after seed).

If **`execute procedure`** errors on your Postgres version, replace those lines with **`execute function`** for trigger bodies (Postgres 14+).
