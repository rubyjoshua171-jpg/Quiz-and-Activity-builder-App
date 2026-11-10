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
  -- Public read-only loading for the /a/<id> share link
create or replace function public.get_public_activity(activity_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select content from public.activities where id = activity_id;
$$;

revoke all on function public.get_public_activity(uuid) from public;
grant execute on function public.get_public_activity(uuid) to anon, authenticated;

create table public.generation_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index on public.generation_log (user_id, created_at);

alter table public.generation_log enable row level security;

create policy "teachers log own requests" on public.generation_log
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "teachers read own log" on public.generation_log
  for select to authenticated using (user_id = (select auth.uid()));