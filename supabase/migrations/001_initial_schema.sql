-- profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('planner', 'client')),
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'planner'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  planner_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  cpf text,
  birth_date date,
  occupation text,
  marital_status text check (marital_status in ('single', 'married', 'divorced', 'widowed', 'other')),
  notes text,
  portal_user_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- financial_profile (1:1 with clients)
create table public.financial_profile (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients(id) on delete cascade,
  monthly_income numeric not null default 0,
  monthly_expenses numeric not null default 0,
  emergency_fund numeric not null default 0,
  current_assets numeric not null default 0,
  monthly_contribution numeric not null default 0,
  retirement_age integer not null default 65,
  life_expectancy integer not null default 100,
  desired_retirement_income numeric not null default 0,
  social_security_income numeric not null default 0,
  other_income numeric not null default 0,
  risk_profile text not null default 'moderate' check (risk_profile in ('conservative', 'moderate', 'aggressive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- assets
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  category text not null check (category in ('investment', 'property', 'vehicle', 'other')),
  name text not null,
  current_value numeric not null default 0,
  monthly_yield_rate numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- liabilities
create table public.liabilities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  total_amount numeric not null default 0,
  remaining_amount numeric not null default 0,
  monthly_payment numeric not null default 0,
  interest_rate numeric not null default 0,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- projection_scenarios
create table public.projection_scenarios (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null default 'Padrao',
  cdi_rate numeric not null default 0.07,
  cdi_percentage numeric not null default 1.10,
  tax_rate numeric not null default 0.15,
  inflation_rate numeric not null default 0.035,
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_updated_at before update on public.clients for each row execute function public.update_updated_at();
create trigger financial_profile_updated_at before update on public.financial_profile for each row execute function public.update_updated_at();
create trigger assets_updated_at before update on public.assets for each row execute function public.update_updated_at();
create trigger liabilities_updated_at before update on public.liabilities for each row execute function public.update_updated_at();
create trigger projection_scenarios_updated_at before update on public.projection_scenarios for each row execute function public.update_updated_at();
