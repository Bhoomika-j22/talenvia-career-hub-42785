# Supabase setup (Talenvia Career Hub)

This frontend uses Supabase only for storing and retrieving **user profile** data.

## Environment variables

This app reads Supabase credentials from `process.env` (see `src/config/env.js` and `src/services/supabaseClient.js`):

- `SUPABASE_URL`
- `SUPABASE_KEY` (Anon/Public key)

Note: In CRA, only `REACT_APP_*` variables are normally exposed. This project reads `SUPABASE_*` directly as requested, so ensure your deployment pipeline injects them.

## One-time database setup (SQL)

The frontend cannot safely create database tables at runtime using the anon key.  
Run this once in the **Supabase SQL editor**.

```sql
-- =========================================
-- Talenvia: User Profile schema (Supabase)
-- Requirements implemented:
-- - Supabase Auth (auth.users)
-- - user_id UUID FK to auth.users(id) ON DELETE CASCADE
-- - RLS enabled on all tables
-- - Policies for SELECT/INSERT/UPDATE/DELETE scoped to auth.uid() = user_id
-- - Tables: profiles, skills, professional_links, resumes
-- - Indexes on user_id for all tables
-- - Constraints: one profile per user, one professional_links row per user,
--   unique skill per user, only one active resume per user, URL format checks,
--   file_type check
-- =========================================

-- Enable required extension for gen_random_uuid() if not already available in your project
create extension if not exists pgcrypto;

-- -----------------------------------------
-- Utility: updated_at trigger
-- -----------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------
-- TABLE 1: profiles
-- -----------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone_number text,
  location text,
  profile_photo_url text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

-- Index on user_id (also satisfied by UNIQUE, but included per performance requirement)
create index if not exists profiles_user_id_idx on public.profiles(user_id);

-- -----------------------------------------
-- TABLE 2: skills
-- -----------------------------------------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_name text not null,
  created_at timestamp default now(),
  constraint skills_user_skill_unique unique (user_id, skill_name)
);

create index if not exists skills_user_id_idx on public.skills(user_id);

-- -----------------------------------------
-- TABLE 3: professional_links
-- -----------------------------------------
create table if not exists public.professional_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  created_at timestamp default now(),
  updated_at timestamp default now(),

  -- URLs must start with http:// or https:// (allow NULL/empty)
  constraint professional_links_linkedin_url_format check (
    linkedin_url is null
    or linkedin_url = ''
    or linkedin_url like 'http://%'
    or linkedin_url like 'https://%'
  ),
  constraint professional_links_github_url_format check (
    github_url is null
    or github_url = ''
    or github_url like 'http://%'
    or github_url like 'https://%'
  ),
  constraint professional_links_portfolio_url_format check (
    portfolio_url is null
    or portfolio_url = ''
    or portfolio_url like 'http://%'
    or portfolio_url like 'https://%'
  )
);

drop trigger if exists professional_links_set_updated_at on public.professional_links;
create trigger professional_links_set_updated_at
before update on public.professional_links
for each row
execute procedure public.set_updated_at();

-- Index on user_id (also satisfied by UNIQUE, but included per performance requirement)
create index if not exists professional_links_user_id_idx on public.professional_links(user_id);

-- -----------------------------------------
-- TABLE 4: resumes
-- -----------------------------------------
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text check (file_type in ('pdf','doc','docx')),
  is_active boolean default true,
  uploaded_at timestamp default now()
);

create index if not exists resumes_user_id_idx on public.resumes(user_id);

-- Only one resume should be active per user
create unique index if not exists resumes_one_active_per_user_idx
on public.resumes(user_id)
where is_active;

-- -----------------------------------------
-- SECURITY: Row Level Security (RLS)
-- -----------------------------------------
alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.professional_links enable row level security;
alter table public.resumes enable row level security;

-- -----------------------------------------
-- POLICIES: profiles
-- -----------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using (auth.uid() = user_id);

-- -----------------------------------------
-- POLICIES: skills
-- -----------------------------------------
drop policy if exists "skills_select_own" on public.skills;
create policy "skills_select_own"
on public.skills
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "skills_insert_own" on public.skills;
create policy "skills_insert_own"
on public.skills
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "skills_update_own" on public.skills;
create policy "skills_update_own"
on public.skills
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "skills_delete_own" on public.skills;
create policy "skills_delete_own"
on public.skills
for delete
to authenticated
using (auth.uid() = user_id);

-- -----------------------------------------
-- POLICIES: professional_links
-- -----------------------------------------
drop policy if exists "professional_links_select_own" on public.professional_links;
create policy "professional_links_select_own"
on public.professional_links
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "professional_links_insert_own" on public.professional_links;
create policy "professional_links_insert_own"
on public.professional_links
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "professional_links_update_own" on public.professional_links;
create policy "professional_links_update_own"
on public.professional_links
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "professional_links_delete_own" on public.professional_links;
create policy "professional_links_delete_own"
on public.professional_links
for delete
to authenticated
using (auth.uid() = user_id);

-- -----------------------------------------
-- POLICIES: resumes
-- -----------------------------------------
drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own"
on public.resumes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own"
on public.resumes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own"
on public.resumes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own"
on public.resumes
for delete
to authenticated
using (auth.uid() = user_id);
```

