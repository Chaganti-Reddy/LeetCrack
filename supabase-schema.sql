-- ─── AlgoTrack — Supabase Schema ──────────────────────────────────────────────
-- Run this in your Supabase project:
--   Dashboard → SQL Editor → New query → paste → Run

create table if not exists public.users_progress (
  user_id       uuid primary key references auth.users(id) on delete cascade,

  lc_username   text,
  cf_username   text,
  ac_username   text,

  solved        jsonb not null default '{}'::jsonb,
  activity      jsonb not null default '{}'::jsonb,
  bookmarks     jsonb not null default '{}'::jsonb,
  notes         jsonb not null default '{}'::jsonb,
  review_data   jsonb not null default '{}'::jsonb,

  cf_solved     jsonb not null default '{}'::jsonb,
  cf_activity   jsonb not null default '{}'::jsonb,
  cf_bookmarks  jsonb not null default '{}'::jsonb,
  cf_review_data jsonb not null default '{}'::jsonb,
  cf_user_info  jsonb,

  ac_solved     jsonb not null default '{}'::jsonb,
  ac_activity   jsonb not null default '{}'::jsonb,
  ac_bookmarks  jsonb not null default '{}'::jsonb,
  ac_review_data jsonb not null default '{}'::jsonb,

  updated_at    timestamptz not null default now()
);

alter table public.users_progress enable row level security;

create policy "Users can read own row"
  on public.users_progress for select
  using (auth.uid() = user_id);

create policy "Users can upsert own row"
  on public.users_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own row"
  on public.users_progress for update
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_progress_updated_at
  before update on public.users_progress
  for each row execute procedure public.set_updated_at();

ALTER TABLE public.users_progress
  ADD COLUMN IF NOT EXISTS ac_user_info jsonb;

ALTER TABLE public.users_progress
  ADD COLUMN IF NOT EXISTS lc_last_sync timestamptz;

ALTER TABLE public.users_progress
  ADD COLUMN IF NOT EXISTS cf_rivals jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.users_progress
  ADD COLUMN IF NOT EXISTS ac_rivals jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.users_progress
  ADD COLUMN IF NOT EXISTS cf_notes jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.users_progress
  ADD COLUMN IF NOT EXISTS ac_notes jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.users_progress
  ADD COLUMN IF NOT EXISTS interview_date date;