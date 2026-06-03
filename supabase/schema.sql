create table if not exists public.mossi_state (
  key text primary key,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mossi_state
add column if not exists created_at timestamptz not null default now();

alter table public.mossi_state
add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_mossi_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_mossi_state_updated_at on public.mossi_state;

create trigger set_mossi_state_updated_at
before update on public.mossi_state
for each row
execute function public.set_mossi_state_updated_at();

alter table public.mossi_state enable row level security;

drop policy if exists "Allow Mossi state reads" on public.mossi_state;
drop policy if exists "Allow Mossi state inserts" on public.mossi_state;
drop policy if exists "Allow Mossi state updates" on public.mossi_state;

create policy "Allow Mossi state reads"
on public.mossi_state
for select
to anon
using (true);

create policy "Allow Mossi state inserts"
on public.mossi_state
for insert
to anon
with check (true);

create policy "Allow Mossi state updates"
on public.mossi_state
for update
to anon
using (true)
with check (true);

do $$
begin
  alter publication supabase_realtime add table public.mossi_state;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
