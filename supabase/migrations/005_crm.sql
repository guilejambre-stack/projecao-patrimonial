-- Add pipeline status to clients
alter table public.clients
  add column pipeline_status text not null default 'prospect'
  check (pipeline_status in ('prospect', 'consultation', 'proposal', 'active', 'inactive'));

-- Interactions table
create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  type text not null check (type in ('meeting', 'call', 'email', 'note')),
  date timestamptz not null default now(),
  duration_minutes integer,
  summary text not null,
  next_steps text,
  outcome text,
  follow_up_date date,
  follow_up_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger interactions_updated_at before update on public.interactions
  for each row execute function public.update_updated_at();

alter table public.interactions enable row level security;

create policy "Planner manages interactions" on public.interactions
  for all using (public.user_is_planner_of(client_id));

create policy "Portal client reads interactions" on public.interactions
  for select using (public.user_can_read_client(client_id));
