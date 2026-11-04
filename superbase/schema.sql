create table public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.activities enable row level security;

create policy "teachers read own activities" on public.activities
  for select to authenticated using (owner_id = (select auth.uid()));

create policy "teachers create own activities" on public.activities
  for insert to authenticated with check (owner_id = (select auth.uid()));

create policy "teachers update own activities" on public.activities
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "teachers delete own activities" on public.activities
  for delete to authenticated using (owner_id = (select auth.uid()));