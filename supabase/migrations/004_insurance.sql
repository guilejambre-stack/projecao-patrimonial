create table public.insurance (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  type text not null check (type in ('life', 'health', 'property', 'vehicle', 'liability', 'other')),
  provider text not null,
  policy_number text,
  coverage_amount numeric not null default 0,
  monthly_premium numeric not null default 0,
  expiry_date date,
  beneficiary text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger insurance_updated_at before update on public.insurance for each row execute function public.update_updated_at();
alter table public.insurance enable row level security;
create policy "Planner manages insurance" on public.insurance for all using (public.user_is_planner_of(client_id));
create policy "Portal client reads insurance" on public.insurance for select using (public.user_can_read_client(client_id));
