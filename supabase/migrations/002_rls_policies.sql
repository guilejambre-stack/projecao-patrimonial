-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.financial_profile enable row level security;
alter table public.assets enable row level security;
alter table public.liabilities enable row level security;
alter table public.projection_scenarios enable row level security;

-- profiles: users can read their own profile
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- clients: planners see their own clients
create policy "Planners can manage their clients" on public.clients
  for all using (auth.uid() = planner_id);

-- clients: portal clients can read their own record
create policy "Portal clients can read own record" on public.clients
  for select using (auth.uid() = portal_user_id);

-- Helper: check if user is the planner of this client
create or replace function public.user_is_planner_of(client_row_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.clients
    where id = client_row_id and planner_id = auth.uid()
  );
$$ language sql security definer stable;

-- Helper: check if user can read this client's data (planner or portal user)
create or replace function public.user_can_read_client(client_row_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.clients
    where id = client_row_id
      and (planner_id = auth.uid() or portal_user_id = auth.uid())
  );
$$ language sql security definer stable;

-- financial_profile: planner can read/write, portal client read-only
create policy "Planner manages financial profile" on public.financial_profile
  for all using (public.user_is_planner_of(client_id));
create policy "Portal client reads financial profile" on public.financial_profile
  for select using (public.user_can_read_client(client_id));

-- assets: planner can read/write, portal client read-only
create policy "Planner manages assets" on public.assets
  for all using (public.user_is_planner_of(client_id));
create policy "Portal client reads assets" on public.assets
  for select using (public.user_can_read_client(client_id));

-- liabilities: planner can read/write, portal client read-only
create policy "Planner manages liabilities" on public.liabilities
  for all using (public.user_is_planner_of(client_id));
create policy "Portal client reads liabilities" on public.liabilities
  for select using (public.user_can_read_client(client_id));

-- projection_scenarios: planner can read/write, portal client read-only
create policy "Planner manages scenarios" on public.projection_scenarios
  for all using (public.user_is_planner_of(client_id));
create policy "Portal client reads scenarios" on public.projection_scenarios
  for select using (public.user_can_read_client(client_id));
