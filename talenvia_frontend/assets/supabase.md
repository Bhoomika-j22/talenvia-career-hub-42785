# Supabase setup (Talenvia Career Hub)

This frontend uses Supabase only for storing and retrieving **user profile** data.

## Environment variables

This app reads Supabase credentials from `process.env` (see `src/config/env.js` and `src/services/supabaseClient.js`):

- `SUPABASE_URL`
- `SUPABASE_KEY` (Anon/Public key)

Note: In CRA, only `REACT_APP_*` variables are normally exposed. This project reads `SUPABASE_*` directly as requested, so ensure your deployment pipeline injects them.

## One-time database setup (SQL)

The frontend cannot safely create database tables at runtime using the anon key.  
Run this once in the **Supabase SQL editor**:

```sql
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  phone text,
  location text,
  skills text[],
  linkedin_url text,
  github_url text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

-- Keep updated_at current on every update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();
```

### Row Level Security (RLS) notes

This scaffold is **not using Supabase Auth yet**. Because of that, the "stable key" is currently the user's email address,
and access control is not enforced in the UI.

For development only, you can temporarily disable RLS on this table or create permissive policies.

**Option A (development-only): disable RLS**
```sql
alter table public.profiles disable row level security;
```

**Option B: keep RLS enabled and add permissive policies (development-only)**
```sql
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
on public.profiles
for select
to anon, authenticated
using (true);

drop policy if exists "profiles_upsert_all" on public.profiles;
create policy "profiles_upsert_all"
on public.profiles
for insert
to anon, authenticated
with check (true);

drop policy if exists "profiles_update_all" on public.profiles;
create policy "profiles_update_all"
on public.profiles
for update
to anon, authenticated
using (true)
with check (true);
```

When auth is implemented, replace these with user-scoped policies.
