# Supabase schema for Talenvia Profile persistence

This frontend persists the **Profile** page via Supabase using:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_KEY`

## Required tables

The Profile UI stores:
- basic profile fields (name, email, phone, location, photo)
- skills as a list
- professional links (LinkedIn, GitHub)

The app expects three tables:

- `profiles` (1 row per profile key)
- `skills` (0..N rows per profile key)
- `professional_links` (0..N rows per profile key)

### Profile identity model used by this scaffold

This app currently has **no authentication**. To still have stable upserts, we use a deterministic `profile_key`:

- `profile_key = lower(trim(email))`

This means:
- changing email effectively creates a “new profile” row
- if you add auth later, replace `profile_key` with `user_id` (uuid) and update the client code accordingly

## SQL (run in Supabase SQL editor)

> Enable Row Level Security (RLS) if you add auth.  
> In this scaffold (no auth), you can leave RLS disabled or add permissive policies for testing.

### 1) profiles

```sql
create table if not exists public.profiles (
  profile_key text primary key,
  full_name text not null,
  email text not null,
  phone text,
  location text,
  photo_data_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);
```

### 2) skills

```sql
create table if not exists public.skills (
  id bigserial primary key,
  profile_key text not null references public.profiles(profile_key) on delete cascade,
  skill text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists skills_profile_skill_uniq on public.skills (profile_key, skill);
```

### 3) professional_links

```sql
create table if not exists public.professional_links (
  id bigserial primary key,
  profile_key text not null references public.profiles(profile_key) on delete cascade,
  kind text not null check (kind in ('linkedin','github')),
  url text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists professional_links_profile_kind_uniq on public.professional_links (profile_key, kind);
```

## Notes

- `photo_data_url` stores a base64 data URL from the UI (can be large). For production, prefer Supabase Storage and store a URL here instead.
- If you enable RLS with auth later, enforce access by `auth.uid()` and switch the key from `profile_key` to `user_id uuid`.
