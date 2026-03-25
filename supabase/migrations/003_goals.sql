create table public.goals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  target_amount numeric not null default 0,
  target_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  category text not null default 'other' check (category in ('retirement', 'education', 'property', 'travel', 'emergency', 'other')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger goals_updated_at before update on public.goals for each row execute function public.update_updated_at();
alter table public.goals enable row level security;
create policy "Planner manages goals" on public.goals for all using (public.user_is_planner_of(client_id));
create policy "Portal client reads goals" on public.goals for select using (public.user_can_read_client(client_id));
