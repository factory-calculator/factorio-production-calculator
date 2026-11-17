-- Run this once in Supabase SQL Editor.
create table if not exists public.site_updates (
  id uuid primary key default gen_random_uuid(),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ja jsonb not null default '{}'::jsonb,
  en jsonb not null default '{}'::jsonb,
  zh jsonb not null default '{}'::jsonb
);
alter table public.site_updates enable row level security;
grant select on public.site_updates to anon, authenticated;
grant insert, update, delete on public.site_updates to authenticated;
drop policy if exists "Anyone can read published updates" on public.site_updates;
create policy "Anyone can read published updates"
on public.site_updates for select to anon, authenticated
using (published = true);
drop policy if exists "Admins can read all updates" on public.site_updates;
create policy "Admins can read all updates"
on public.site_updates for select to authenticated
using (public.is_site_admin());
drop policy if exists "Admins can insert updates" on public.site_updates;
create policy "Admins can insert updates"
on public.site_updates for insert to authenticated
with check (public.is_site_admin());
drop policy if exists "Admins can update updates" on public.site_updates;
create policy "Admins can update updates"
on public.site_updates for update to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());
drop policy if exists "Admins can delete updates" on public.site_updates;
create policy "Admins can delete updates"
on public.site_updates for delete to authenticated
using (public.is_site_admin());
