# Decision Loop

Daily decision journal. Lock one decision per day, build a searchable log.

## Setup

```bash
cp .env.example .env
# Fill in Supabase credentials
npm install
npm run dev
```

## Supabase

1. Create a Supabase project
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Enable Email (magic link) auth in Supabase dashboard
4. Add project URL and keys to `.env`

## Deploy (Cloudflare Pages)

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `apps/decision-loop`
- Environment variables: set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
