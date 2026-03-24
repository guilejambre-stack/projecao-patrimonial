# Pranej Fin Fase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete personal financial planning system with client management, financial profiles, and wealth projection — replacing the current static HTML tool.

**Architecture:** Next.js 15 App Router with two protected route groups (`/dashboard` for planners, `/portal` for clients). Supabase handles auth (Google OAuth), Postgres database with Row Level Security, and real-time subscriptions. All projection math runs client-side in a pure TypeScript engine extracted from the existing HTML.

**Tech Stack:** Next.js 15, TypeScript, Supabase (Auth + Postgres + RLS), Tailwind CSS, shadcn/ui, Recharts, react-hook-form + zod

**Spec:** `docs/superpowers/specs/2026-03-24-pranej-fin-fase1-design.md`

---

## File Map

### Core Infrastructure
| File | Responsibility |
|------|----------------|
| `src/app/layout.tsx` | Root layout, font loading (Inter), global providers |
| `src/app/globals.css` | Tailwind imports + dark theme CSS variables |
| `src/middleware.ts` | Auth check + role-based redirect (planner→dashboard, client→portal) |
| `src/lib/supabase/client.ts` | Browser Supabase client (createBrowserClient) |
| `src/lib/supabase/server.ts` | Server Supabase client (createServerClient) |
| `src/lib/supabase/middleware.ts` | Supabase session refresh helper for middleware |
| `src/types/index.ts` | All TypeScript types (Client, FinancialProfile, Asset, Liability, Scenario, Profile) |
| `.env.local` | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY |

### Database
| File | Responsibility |
|------|----------------|
| `supabase/migrations/001_initial_schema.sql` | All tables: profiles, clients, financial_profile, assets, liabilities, projection_scenarios |
| `supabase/migrations/002_rls_policies.sql` | Row Level Security policies for all tables |
| `supabase/seed.sql` | Demo data for development (1 planner, 3 clients with financial data) |

### Projection Engine
| File | Responsibility |
|------|----------------|
| `src/lib/projection-engine.ts` | Pure math: computeRates, computeProjection, generateSeries |
| `src/lib/projection-engine.test.ts` | Unit tests for all projection calculations |
| `src/lib/utils.ts` | Formatters: formatBRL, formatBRLCompact, formatPercent, cn() |

### Auth Pages
| File | Responsibility |
|------|----------------|
| `src/app/(auth)/login/page.tsx` | Login page with Google OAuth button |
| `src/app/auth/callback/route.ts` | OAuth callback handler (exchanges code for session) |

### Planner Dashboard
| File | Responsibility |
|------|----------------|
| `src/app/dashboard/layout.tsx` | Dashboard shell: sidebar + topbar |
| `src/app/dashboard/page.tsx` | Dashboard home: KPIs, recent clients, alerts |
| `src/app/dashboard/clients/page.tsx` | Client list: search, table, "New Client" button |
| `src/app/dashboard/clients/new/page.tsx` | New client form |
| `src/app/dashboard/clients/[id]/page.tsx` | Client detail with 3 tabs |
| `src/components/dashboard/sidebar.tsx` | Fixed sidebar navigation |
| `src/components/dashboard/topbar.tsx` | Top bar with user info + logout |

### Client Detail Components
| File | Responsibility |
|------|----------------|
| `src/components/clients/personal-tab.tsx` | Tab 1: personal data form + invite button |
| `src/components/clients/financial-tab.tsx` | Tab 2: income/expenses + assets table + liabilities table + summary |
| `src/components/clients/projection-tab.tsx` | Tab 3: projection inputs + chart + KPIs |
| `src/components/clients/asset-table.tsx` | Inline-editable assets table |
| `src/components/clients/liability-table.tsx` | Inline-editable liabilities table |

### Shared Components
| File | Responsibility |
|------|----------------|
| `src/components/projection-chart.tsx` | Recharts line chart for wealth projection |
| `src/components/kpi-card.tsx` | KPI display card with accent color bar |
| `src/components/metric-card.tsx` | Secondary metric card |

### Client Portal
| File | Responsibility |
|------|----------------|
| `src/app/portal/layout.tsx` | Portal shell: topbar only |
| `src/app/portal/profile/page.tsx` | Read-only financial profile |
| `src/app/portal/projection/page.tsx` | Read-only projection view |

### Server Actions
| File | Responsibility |
|------|----------------|
| `src/app/dashboard/clients/actions.ts` | CRUD: createClient, updateClient, deleteClient, getClients, getClientById |
| `src/app/dashboard/clients/[id]/actions.ts` | Financial data: updateFinancialProfile, upsertAsset, deleteAsset, upsertLiability, deleteLiability, updateScenario, inviteClientToPortal |

---

## Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `.env.local`, `.gitignore`, `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: Initialize Next.js project**

Run from the project root (alongside the existing HTML files — they will coexist until migration is complete):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

When prompted about overwriting existing files, accept. The HTML files won't be affected.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr recharts react-hook-form @hookform/resolvers zod lucide-react
npm install -D supabase
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

Choose: New York style, Zinc base color, CSS variables: yes.

- [ ] **Step 4: Add required shadcn/ui components**

```bash
npx shadcn@latest add button card input label tabs table dialog badge separator avatar dropdown-menu sheet select textarea toast
```

- [ ] **Step 5: Create `.env.local`**

Create `.env.local` at project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Add `.env.local` to `.gitignore` if not already present.

- [ ] **Step 6: Configure dark theme in `globals.css`**

Replace `src/app/globals.css` with Tailwind imports and the fintech dark theme variables from the spec:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: #0F1117;
  --color-foreground: #F1F5F9;
  --color-card: #1A1D26;
  --color-card-foreground: #F1F5F9;
  --color-popover: #1A1D26;
  --color-popover-foreground: #F1F5F9;
  --color-primary: #3B82F6;
  --color-primary-foreground: #FFFFFF;
  --color-secondary: #2A2D36;
  --color-secondary-foreground: #F1F5F9;
  --color-muted: #2A2D36;
  --color-muted-foreground: #94A3B8;
  --color-accent: #10B981;
  --color-accent-foreground: #FFFFFF;
  --color-destructive: #DC2626;
  --color-border: #2A2D36;
  --color-input: #2A2D36;
  --color-ring: #3B82F6;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --radius: 0.5rem;
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

- [ ] **Step 7: Update root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pranej Fin — Planejamento Financeiro",
  description: "Sistema de planejamento financeiro pessoal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Verify the app runs**

```bash
npm run dev
```

Open `http://localhost:3000` — should show the default Next.js page with dark background `#0F1117`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with Tailwind, shadcn/ui, and dark fintech theme"
```

---

## Task 2: TypeScript Types & Utility Functions

**Files:**
- Create: `src/types/index.ts`, `src/lib/utils.ts`

- [ ] **Step 1: Create types file**

Create `src/types/index.ts`:

```ts
export type Role = "planner" | "client";

export type RiskProfile = "conservative" | "moderate" | "aggressive";

export type AssetCategory = "investment" | "property" | "vehicle" | "other";

export type MaritalStatus =
  | "single"
  | "married"
  | "divorced"
  | "widowed"
  | "other";

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  planner_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  occupation: string | null;
  marital_status: MaritalStatus | null;
  notes: string | null;
  portal_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialProfile {
  id: string;
  client_id: string;
  monthly_income: number;
  monthly_expenses: number;
  emergency_fund: number;
  current_assets: number;
  monthly_contribution: number;
  retirement_age: number;
  life_expectancy: number;
  desired_retirement_income: number;
  social_security_income: number;
  other_income: number;
  risk_profile: RiskProfile;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  client_id: string;
  category: AssetCategory;
  name: string;
  current_value: number;
  monthly_yield_rate: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  client_id: string;
  name: string;
  total_amount: number;
  remaining_amount: number;
  monthly_payment: number;
  interest_rate: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectionScenario {
  id: string;
  client_id: string;
  name: string;
  cdi_rate: number;
  cdi_percentage: number;
  tax_rate: number;
  inflation_rate: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectionInput {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentAssets: number;
  monthlyContribution: number;
  cdiRate: number;
  cdiPercentage: number;
  taxRate: number;
  inflationRate: number;
  desiredRetirementIncome: number;
  socialSecurityIncome: number;
  otherIncome: number;
}

export interface ProjectionRates {
  nominal: number;
  net: number;
  realAnnual: number;
  realMonthly: number;
  accumulationMonthly: number;
}

export interface ProjectionResult {
  wealthForIncome: number;
  wealthForConsumption: number;
  projectedWealth: number;
  gap: number;
  isGoalAchievable: boolean;
  requiredMonthlyIncome: number;
  accumulationYears: number;
  distributionYears: number;
}

export interface ProjectionSeries {
  ages: number[];
  incomePreserving: number[];
  capitalConsumption: number[];
  simulated: number[];
}
```

- [ ] **Step 2: Update utils file**

The shadcn init already created `src/lib/utils.ts` with `cn()`. Add the BRL formatters:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(value: number | null): string {
  if (value == null) return "\u2014";
  return "R$ " + Math.round(value).toLocaleString("pt-BR");
}

export function formatBRLCompact(value: number | null): string {
  if (value == null) return "\u2014";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e6) return sign + "R$ " + (abs / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return sign + "R$ " + Math.round(abs / 1e3) + "k";
  return sign + "R$ " + Math.round(abs);
}

export function formatPercent(value: number, decimals = 2): string {
  return value.toFixed(decimals) + "%";
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/lib/utils.ts
git commit -m "feat: add TypeScript types and BRL formatting utilities"
```

---

## Task 3: Projection Engine with Tests

**Files:**
- Create: `src/lib/projection-engine.ts`, `src/lib/projection-engine.test.ts`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Add to `package.json` scripts: `"test": "vitest run", "test:watch": "vitest"`

Create `vitest.config.ts` at project root:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 2: Write the failing tests**

Create `src/lib/projection-engine.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  computeRates,
  computeProjection,
  generateSeries,
} from "./projection-engine";
import type { ProjectionInput } from "@/types";

const defaultInput: ProjectionInput = {
  currentAge: 40,
  retirementAge: 60,
  lifeExpectancy: 100,
  currentAssets: 100000,
  monthlyContribution: 3000,
  cdiRate: 0.07,
  cdiPercentage: 1.1,
  taxRate: 0.15,
  inflationRate: 0.035,
  desiredRetirementIncome: 12000,
  socialSecurityIncome: 6000,
  otherIncome: 0,
};

describe("computeRates", () => {
  it("calculates nominal, net, real annual, real monthly, and accumulation monthly rates", () => {
    const rates = computeRates(defaultInput);
    // nominal = 0.07 * 1.1 = 0.077
    expect(rates.nominal).toBeCloseTo(0.077, 4);
    // net = 0.077 * (1 - 0.15) = 0.06545
    expect(rates.net).toBeCloseTo(0.06545, 4);
    // realAnnual = (1 + 0.06545) / (1 + 0.035) - 1 ≈ 0.02942
    expect(rates.realAnnual).toBeCloseTo(0.02942, 3);
    // realMonthly = (1 + realAnnual)^(1/12) - 1
    expect(rates.realMonthly).toBeGreaterThan(0);
    expect(rates.realMonthly).toBeLessThan(rates.realAnnual);
    // accumulationMonthly = (1 + net)^(1/12) - 1
    expect(rates.accumulationMonthly).toBeGreaterThan(0);
  });
});

describe("computeProjection", () => {
  it("returns correct projection results for default input", () => {
    const rates = computeRates(defaultInput);
    const result = computeProjection(defaultInput, rates);

    expect(result.requiredMonthlyIncome).toBe(6000);
    expect(result.accumulationYears).toBe(20);
    expect(result.distributionYears).toBe(40);
    expect(result.wealthForIncome).toBeGreaterThan(0);
    expect(result.wealthForConsumption).toBeGreaterThan(0);
    expect(result.projectedWealth).toBeGreaterThan(0);
    expect(typeof result.isGoalAchievable).toBe("boolean");
    expect(result.gap).toBe(result.projectedWealth - result.wealthForConsumption);
  });

  it("handles zero rates gracefully", () => {
    const zeroInput: ProjectionInput = {
      ...defaultInput,
      cdiRate: 0,
      cdiPercentage: 0,
      inflationRate: 0,
    };
    const rates = computeRates(zeroInput);
    const result = computeProjection(zeroInput, rates);

    expect(result.projectedWealth).toBe(
      zeroInput.currentAssets + zeroInput.monthlyContribution * 20 * 12
    );
    expect(result.requiredMonthlyIncome).toBe(6000);
  });
});

describe("generateSeries", () => {
  it("returns arrays of correct length (currentAge to lifeExpectancy inclusive)", () => {
    const rates = computeRates(defaultInput);
    const series = generateSeries(defaultInput, rates);

    const expectedLength = defaultInput.lifeExpectancy - defaultInput.currentAge + 1;
    expect(series.ages).toHaveLength(expectedLength);
    expect(series.incomePreserving).toHaveLength(expectedLength);
    expect(series.capitalConsumption).toHaveLength(expectedLength);
    expect(series.simulated).toHaveLength(expectedLength);
  });

  it("starts ages at currentAge and ends at lifeExpectancy", () => {
    const rates = computeRates(defaultInput);
    const series = generateSeries(defaultInput, rates);

    expect(series.ages[0]).toBe(40);
    expect(series.ages[series.ages.length - 1]).toBe(100);
  });

  it("simulated series never goes below zero", () => {
    const rates = computeRates(defaultInput);
    const series = generateSeries(defaultInput, rates);

    series.simulated.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
    series.capitalConsumption.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — module `./projection-engine` not found.

- [ ] **Step 4: Implement the projection engine**

Create `src/lib/projection-engine.ts`:

```ts
import type {
  ProjectionInput,
  ProjectionRates,
  ProjectionResult,
  ProjectionSeries,
} from "@/types";

export function computeRates(input: ProjectionInput): ProjectionRates {
  const nominal = input.cdiRate * input.cdiPercentage;
  const net = nominal * (1 - input.taxRate);
  const realAnnual = (1 + net) / (1 + input.inflationRate) - 1;
  const realMonthly = Math.pow(1 + realAnnual, 1 / 12) - 1;
  const accumulationMonthly = Math.pow(1 + net, 1 / 12) - 1;

  return { nominal, net, realAnnual, realMonthly, accumulationMonthly };
}

export function computeProjection(
  input: ProjectionInput,
  rates: ProjectionRates
): ProjectionResult {
  const accumulationYears = input.retirementAge - input.currentAge;
  const distributionYears = input.lifeExpectancy - input.retirementAge;
  const requiredMonthlyIncome = Math.max(
    0,
    input.desiredRetirementIncome -
      input.socialSecurityIncome -
      input.otherIncome
  );

  const r = rates.realMonthly;
  const ra = rates.accumulationMonthly;
  const nA = accumulationYears * 12;
  const nD = distributionYears * 12;

  const wealthForIncome = r > 0 ? requiredMonthlyIncome / r : requiredMonthlyIncome * 1200;

  const wealthForConsumption =
    r === 0
      ? requiredMonthlyIncome * nD
      : requiredMonthlyIncome * (1 - Math.pow(1 + r, -nD)) / r;

  const projectedWealth =
    ra === 0
      ? input.currentAssets + input.monthlyContribution * nA
      : input.currentAssets * Math.pow(1 + ra, nA) +
        input.monthlyContribution * (Math.pow(1 + ra, nA) - 1) / ra;

  const gap = projectedWealth - wealthForConsumption;

  return {
    wealthForIncome,
    wealthForConsumption,
    projectedWealth,
    gap,
    isGoalAchievable: gap >= 0,
    requiredMonthlyIncome,
    accumulationYears,
    distributionYears,
  };
}

export function generateSeries(
  input: ProjectionInput,
  rates: ProjectionRates
): ProjectionSeries {
  const result = computeProjection(input, rates);
  const r = rates.realMonthly;
  const ra = rates.accumulationMonthly;
  const rmi = result.requiredMonthlyIncome;

  const ages: number[] = [];
  const incomePreserving: number[] = [];
  const capitalConsumption: number[] = [];
  const simulated: number[] = [];

  for (let age = input.currentAge; age <= input.lifeExpectancy; age++) {
    ages.push(age);

    if (age <= input.retirementAge) {
      const months = (age - input.currentAge) * 12;
      const pat =
        ra === 0
          ? input.currentAssets + input.monthlyContribution * months
          : input.currentAssets * Math.pow(1 + ra, months) +
            input.monthlyContribution *
              (Math.pow(1 + ra, months) - 1) /
              ra;

      simulated.push(Math.round(pat));
      incomePreserving.push(Math.round(result.wealthForIncome));
      capitalConsumption.push(Math.round(result.wealthForConsumption));
    } else {
      const monthsInRetirement = (age - input.retirementAge) * 12;

      const decumulate = (principal: number, rate: number): number => {
        if (rate === 0) return Math.max(0, principal - rmi * monthsInRetirement);
        return Math.max(
          0,
          principal * Math.pow(1 + rate, monthsInRetirement) -
            rmi * (Math.pow(1 + rate, monthsInRetirement) - 1) / rate
        );
      };

      incomePreserving.push(Math.round(result.wealthForIncome));
      capitalConsumption.push(Math.round(decumulate(result.wealthForConsumption, r)));
      simulated.push(Math.round(decumulate(result.projectedWealth, r)));
    }
  }

  return { ages, incomePreserving, capitalConsumption, simulated };
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/projection-engine.ts src/lib/projection-engine.test.ts vitest.config.ts package.json
git commit -m "feat: extract projection engine from HTML with full test coverage"
```

---

## Task 4: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Create browser client**

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create server client**

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in Server Components (read-only)
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create middleware helper**

Create `src/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, response: supabaseResponse };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add Supabase client, server, and middleware helpers"
```

---

## Task 5: Database Schema & RLS Migrations

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`, `supabase/migrations/002_rls_policies.sql`, `supabase/seed.sql`

- [ ] **Step 1: Create initial schema migration**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
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
```

- [ ] **Step 2: Create RLS policies migration**

Create `supabase/migrations/002_rls_policies.sql`:

```sql
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
```

- [ ] **Step 3: Create seed data**

Create `supabase/seed.sql`:

```sql
-- NOTE: Run this AFTER creating a planner user via the app.
-- Replace 'PLANNER_UUID' with the actual auth.users id of your planner account.
-- This seed is for local development only.

-- Example: insert test clients for the planner
-- insert into public.clients (planner_id, full_name, email, phone, occupation)
-- values
--   ('PLANNER_UUID', 'Maria Silva', 'maria@email.com', '11999990001', 'Medica'),
--   ('PLANNER_UUID', 'Joao Santos', 'joao@email.com', '11999990002', 'Engenheiro'),
--   ('PLANNER_UUID', 'Ana Oliveira', 'ana@email.com', '11999990003', 'Empresaria');
```

- [ ] **Step 4: Apply migrations to Supabase**

If using Supabase CLI with a local instance:

```bash
npx supabase db push
```

If using Supabase Dashboard: paste each SQL file in the SQL Editor and run them in order (001, then 002).

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema, RLS policies, and seed template"
```

---

## Task 6: Auth Middleware & Login Page

**Files:**
- Create: `src/middleware.ts`, `src/app/(auth)/login/page.tsx`, `src/app/auth/callback/route.ts`

- [ ] **Step 1: Create Next.js middleware**

Create `src/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { user, response, supabase } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Public routes
  if (path === "/" || path.startsWith("/auth/") || path === "/login") {
    if (user) {
      // Logged in user on public page — redirect to their panel
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "planner") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (profile?.role === "client") {
        return NextResponse.redirect(new URL("/portal", request.url));
      }
    }
    return response;
  }

  // Protected routes — must be logged in
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based access
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (path.startsWith("/dashboard") && profile?.role !== "planner") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  if (path.startsWith("/portal") && profile?.role !== "client") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Create login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-xl p-10 shadow-lg text-center">
          <h1 className="text-xl font-semibold text-foreground mb-1">
            Pranej Fin
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Planejamento financeiro pessoal
          </p>
          <LoginForm />
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">
              acesso seguro via OAuth 2.0
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

Create `src/app/(auth)/login/login-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError("Nao foi possivel conectar ao Google. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
        )}
        {loading ? "Conectando..." : "Entrar com Google"}
      </Button>

      {error && (
        <div className="mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create auth callback route**

Create `src/app/auth/callback/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

- [ ] **Step 4: Create root page redirect**

Create `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
```

- [ ] **Step 5: Verify login page renders**

```bash
npm run dev
```

Open `http://localhost:3000/login` — should show the dark login card with Google button.

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts src/app/ src/lib/supabase/
git commit -m "feat: add auth middleware, login page with Google OAuth, and callback route"
```

---

## Task 7: Planner Dashboard Layout (Sidebar + Topbar)

**Files:**
- Create: `src/app/dashboard/layout.tsx`, `src/components/dashboard/sidebar.tsx`, `src/components/dashboard/topbar.tsx`

- [ ] **Step 1: Create sidebar component**

Create `src/components/dashboard/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-card border-r border-border flex flex-col z-40">
      <div className="h-14 flex items-center px-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
              <path d="M1.5 10.5L5.5 6L8.5 9L12.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-semibold">Pranej Fin</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create topbar component**

Create `src/components/dashboard/topbar.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import type { Profile } from "@/types";

export function Topbar({ profile }: { profile: Profile }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="text-sm text-muted-foreground">
        Planejamento Financeiro
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-secondary transition-colors outline-none">
          <Avatar className="h-7 w-7">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs bg-secondary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {profile.full_name}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
```

- [ ] **Step 3: Create dashboard layout**

Create `src/app/dashboard/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import type { Profile } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || profile.role !== "planner") redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-60">
        <Topbar profile={profile} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create placeholder dashboard page**

Create `src/app/dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>
      <p className="text-muted-foreground">Em construcao...</p>
    </div>
  );
}
```

- [ ] **Step 5: Verify layout renders**

```bash
npm run dev
```

Log in and navigate to `/dashboard` — should show sidebar with logo + nav items, topbar with user info, and the placeholder content.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/ src/components/dashboard/
git commit -m "feat: add planner dashboard layout with sidebar and topbar"
```

---

## Task 8: Shared UI Components (KPI, Metric, Projection Chart)

**Files:**
- Create: `src/components/kpi-card.tsx`, `src/components/metric-card.tsx`, `src/components/projection-chart.tsx`

- [ ] **Step 1: Create KPI card component**

Create `src/components/kpi-card.tsx`:

```tsx
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  subtitle?: string;
  accentColor: "blue" | "green" | "red" | "amber";
}

const accentMap = {
  blue: { bar: "bg-primary", value: "text-primary" },
  green: { bar: "bg-accent", value: "text-accent" },
  red: { bar: "bg-destructive", value: "text-destructive" },
  amber: { bar: "bg-amber-500", value: "text-amber-500" },
};

export function KPICard({ label, value, subtitle, accentColor }: KPICardProps) {
  const colors = accentMap[accentColor];

  return (
    <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden shadow-sm">
      <div className={cn("absolute top-0 left-0 right-0 h-0.5 rounded-t-xl", colors.bar)} />
      <p className="text-xs text-muted-foreground font-medium mb-1.5">{label}</p>
      <p className={cn("text-2xl font-semibold tracking-tight", colors.value)}>{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create metric card component**

Create `src/components/metric-card.tsx`:

```tsx
interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  valueClassName?: string;
}

export function MetricCard({ label, value, subtitle, valueClassName }: MetricCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-base font-semibold tracking-tight ${valueClassName ?? ""}`}>{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create projection chart component**

Create `src/components/projection-chart.tsx`:

```tsx
"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  ComposedChart,
} from "recharts";
import { formatBRL } from "@/lib/utils";
import type { ProjectionSeries } from "@/types";

interface ProjectionChartProps {
  series: ProjectionSeries;
}

export function ProjectionChart({ series }: ProjectionChartProps) {
  const data = series.ages.map((age, i) => ({
    age,
    incomePreserving: series.incomePreserving[i],
    capitalConsumption: series.capitalConsumption[i],
    simulated: series.simulated[i],
  }));

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Projecao Patrimonial</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evolucao do patrimonio por cenario — idade {series.ages[0]} → {series.ages[series.ages.length - 1]} anos
          </p>
        </div>
        <div className="flex gap-4">
          <LegendItem color="#3B82F6" label="Viver de renda" />
          <LegendItem color="#10B981" label="Consumo" />
          <LegendItem color="#DC2626" label="Simulacao" dashed />
        </div>
      </div>
      <div className="p-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis
              dataKey="age"
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => (v % 5 === 0 ? String(v) : "")}
            />
            <YAxis
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v >= 1e6
                  ? `R$ ${(v / 1e6).toFixed(1)}M`
                  : v >= 1e3
                  ? `R$ ${Math.round(v / 1e3)}k`
                  : ""
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1D26",
                border: "1px solid #2A2D36",
                borderRadius: "8px",
                fontSize: 12,
              }}
              labelFormatter={(age) => `Idade: ${age} anos`}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  incomePreserving: "Viver de renda",
                  capitalConsumption: "Consumo",
                  simulated: "Simulacao",
                };
                return [formatBRL(value), labels[name] ?? name];
              }}
            />
            <Area
              type="monotone"
              dataKey="incomePreserving"
              stroke="#3B82F6"
              fill="rgba(59,130,246,0.07)"
              strokeWidth={2}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="capitalConsumption"
              stroke="#10B981"
              fill="rgba(16,185,129,0.06)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="simulated"
              stroke="#DC2626"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
      <div
        className="w-4 h-0.5 rounded-full"
        style={{
          backgroundColor: color,
          ...(dashed ? { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0, ${color} 4px, transparent 4px, transparent 7px)`, backgroundColor: "transparent" } : {}),
        }}
      />
      {label}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/kpi-card.tsx src/components/metric-card.tsx src/components/projection-chart.tsx
git commit -m "feat: add KPI card, metric card, and projection chart components"
```

---

## Task 9: Client Server Actions (CRUD)

**Files:**
- Create: `src/app/dashboard/clients/actions.ts`, `src/app/dashboard/clients/[id]/actions.ts`

- [ ] **Step 1: Create client list actions**

Create `src/app/dashboard/clients/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getClients(search?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select(`
      *,
      financial_profile (current_assets, monthly_contribution),
      projection_scenarios (cdi_rate, cdi_percentage, tax_rate, inflation_rate, is_default)
    `)
    .order("updated_at", { ascending: false });

  if (search) {
    query = query.ilike("full_name", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      planner_id: user.id,
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      cpf: formData.get("cpf") as string,
      birth_date: formData.get("birth_date") as string || null,
      occupation: formData.get("occupation") as string,
      marital_status: formData.get("marital_status") as string || null,
      notes: formData.get("notes") as string,
    })
    .select()
    .single();

  if (error) throw error;

  // Create default financial_profile
  await supabase.from("financial_profile").insert({ client_id: client.id });

  // Create default projection scenario
  await supabase.from("projection_scenarios").insert({ client_id: client.id });

  revalidatePath("/dashboard/clients");
  return client;
}

export async function deleteClientAction(clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw error;
  revalidatePath("/dashboard/clients");
}
```

- [ ] **Step 2: Create client detail actions**

Create `src/app/dashboard/clients/[id]/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getClientById(id: string) {
  const supabase = await createClient();

  const [clientRes, fpRes, assetsRes, liabilitiesRes, scenarioRes] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("financial_profile").select("*").eq("client_id", id).single(),
      supabase.from("assets").select("*").eq("client_id", id).order("created_at"),
      supabase.from("liabilities").select("*").eq("client_id", id).order("created_at"),
      supabase.from("projection_scenarios").select("*").eq("client_id", id).eq("is_default", true).single(),
    ]);

  if (clientRes.error) throw clientRes.error;

  return {
    client: clientRes.data,
    financialProfile: fpRes.data,
    assets: assetsRes.data ?? [],
    liabilities: liabilitiesRes.data ?? [],
    scenario: scenarioRes.data,
  };
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      cpf: formData.get("cpf") as string,
      birth_date: formData.get("birth_date") as string || null,
      occupation: formData.get("occupation") as string,
      marital_status: formData.get("marital_status") as string || null,
      notes: formData.get("notes") as string,
    })
    .eq("id", clientId);

  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function updateFinancialProfileAction(
  clientId: string,
  data: Record<string, number | string>
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("financial_profile")
    .update(data)
    .eq("client_id", clientId);

  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function upsertAssetAction(
  clientId: string,
  asset: { id?: string; category: string; name: string; current_value: number; monthly_yield_rate?: number; notes?: string }
) {
  const supabase = await createClient();

  if (asset.id) {
    const { error } = await supabase
      .from("assets")
      .update({ ...asset, id: undefined })
      .eq("id", asset.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("assets")
      .insert({ ...asset, client_id: clientId });
    if (error) throw error;
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function deleteAssetAction(clientId: string, assetId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("assets").delete().eq("id", assetId);
  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function upsertLiabilityAction(
  clientId: string,
  liability: { id?: string; name: string; total_amount: number; remaining_amount: number; monthly_payment: number; interest_rate: number; due_date?: string }
) {
  const supabase = await createClient();

  if (liability.id) {
    const { error } = await supabase
      .from("liabilities")
      .update({ ...liability, id: undefined })
      .eq("id", liability.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("liabilities")
      .insert({ ...liability, client_id: clientId });
    if (error) throw error;
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function deleteLiabilityAction(clientId: string, liabilityId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("liabilities").delete().eq("id", liabilityId);
  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function updateScenarioAction(
  scenarioId: string,
  clientId: string,
  data: { cdi_rate: number; cdi_percentage: number; tax_rate: number; inflation_rate: number }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projection_scenarios")
    .update(data)
    .eq("id", scenarioId);
  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function inviteClientToPortalAction(clientId: string, email: string) {
  const supabase = await createClient();

  // Check if already invited
  const { data: client } = await supabase
    .from("clients")
    .select("portal_user_id")
    .eq("id", clientId)
    .single();

  if (client?.portal_user_id) {
    throw new Error("Cliente ja possui acesso ao portal");
  }

  // Use admin client with service role key for invite
  const { createClient: createAdminClient } = await import("@supabase/supabase-js");
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
    data: { role: "client", client_id: clientId },
  });

  if (error) throw error;
  revalidatePath(`/dashboard/clients/${clientId}`);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/clients/actions.ts src/app/dashboard/clients/\[id\]/actions.ts
git commit -m "feat: add server actions for client CRUD and financial data management"
```

---

## Task 10: Client List Page

**Files:**
- Create: `src/app/dashboard/clients/page.tsx`, `src/app/dashboard/clients/new/page.tsx`

- [ ] **Step 1: Create client list page**

Create `src/app/dashboard/clients/page.tsx`:

```tsx
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getClients } from "./actions";
import { formatBRLCompact } from "@/lib/utils";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clients = await getClients(q);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <Link href="/dashboard/clients/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      <form className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Buscar cliente..."
            defaultValue={q}
            className="pl-9"
          />
        </div>
      </form>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Nome</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Telefone</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Patrimonio</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Portal</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client: any) => (
              <tr key={client.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                <td className="p-4">
                  <Link href={`/dashboard/clients/${client.id}`} className="text-sm font-medium hover:text-primary transition-colors">
                    {client.full_name}
                  </Link>
                </td>
                <td className="p-4 text-sm text-muted-foreground">{client.phone ?? "—"}</td>
                <td className="p-4 text-sm font-medium">
                  {formatBRLCompact(client.financial_profile?.current_assets ?? 0)}
                </td>
                <td className="p-4">
                  <Badge variant={client.portal_user_id ? "default" : "secondary"} className="text-xs">
                    {client.portal_user_id ? "Ativo" : "Sem acesso"}
                  </Badge>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">
                  {q ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create new client page**

Create `src/app/dashboard/clients/new/page.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClientAction } from "../actions";

export default function NewClientPage() {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const client = await createClientAction(formData);
    router.push(`/dashboard/clients/${client.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Novo Cliente</h1>

      <form action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nome completo *</Label>
            <Input id="full_name" name="full_name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" name="cpf" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birth_date">Data de nascimento</Label>
            <Input id="birth_date" name="birth_date" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="occupation">Ocupacao</Label>
            <Input id="occupation" name="occupation" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="marital_status">Estado civil</Label>
            <Select name="marital_status">
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Solteiro(a)</SelectItem>
                <SelectItem value="married">Casado(a)</SelectItem>
                <SelectItem value="divorced">Divorciado(a)</SelectItem>
                <SelectItem value="widowed">Viuvo(a)</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Observacoes</Label>
          <Textarea id="notes" name="notes" rows={3} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit">Criar Cliente</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Verify pages render**

```bash
npm run dev
```

Navigate to `/dashboard/clients` — should show empty table with "Novo Cliente" button. Click the button — should show the form.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/clients/
git commit -m "feat: add client list and new client pages"
```

---

## Task 11: Client Detail Page with Tabs

**Files:**
- Create: `src/app/dashboard/clients/[id]/page.tsx`, `src/components/clients/personal-tab.tsx`, `src/components/clients/financial-tab.tsx`, `src/components/clients/projection-tab.tsx`, `src/components/clients/asset-table.tsx`, `src/components/clients/liability-table.tsx`

- [ ] **Step 1: Create client detail page**

Create `src/app/dashboard/clients/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClientById } from "./actions";
import { PersonalTab } from "@/components/clients/personal-tab";
import { FinancialTab } from "@/components/clients/financial-tab";
import { ProjectionTab } from "@/components/clients/projection-tab";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getClientById(id);
  } catch {
    notFound();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">{data.client.full_name}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {data.client.occupation ?? "Sem ocupacao"} · {data.client.email ?? "Sem email"}
      </p>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="financial">Perfil Financeiro</TabsTrigger>
          <TabsTrigger value="projection">Projecao Patrimonial</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <PersonalTab client={data.client} />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialTab
            client={data.client}
            financialProfile={data.financialProfile}
            assets={data.assets}
            liabilities={data.liabilities}
          />
        </TabsContent>

        <TabsContent value="projection">
          <ProjectionTab
            client={data.client}
            financialProfile={data.financialProfile}
            scenario={data.scenario}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Create personal data tab**

Create `src/components/clients/personal-tab.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateClientAction, inviteClientToPortalAction } from "@/app/dashboard/clients/[id]/actions";
import type { Client } from "@/types";

export function PersonalTab({ client }: { client: Client }) {
  async function handleSave(formData: FormData) {
    await updateClientAction(client.id, formData);
  }

  async function handleInvite() {
    if (!client.email) return;
    await inviteClientToPortalAction(client.id, client.email);
  }

  return (
    <div className="max-w-2xl">
      <form action={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input id="full_name" name="full_name" defaultValue={client.full_name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={client.email ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" defaultValue={client.phone ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" name="cpf" defaultValue={client.cpf ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birth_date">Data de nascimento</Label>
            <Input id="birth_date" name="birth_date" type="date" defaultValue={client.birth_date ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="occupation">Ocupacao</Label>
            <Input id="occupation" name="occupation" defaultValue={client.occupation ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="marital_status">Estado civil</Label>
            <Select name="marital_status" defaultValue={client.marital_status ?? undefined}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Solteiro(a)</SelectItem>
                <SelectItem value="married">Casado(a)</SelectItem>
                <SelectItem value="divorced">Divorciado(a)</SelectItem>
                <SelectItem value="widowed">Viuvo(a)</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Observacoes</Label>
          <Textarea id="notes" name="notes" rows={3} defaultValue={client.notes ?? ""} />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit">Salvar</Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleInvite}
            disabled={!client.email || !!client.portal_user_id}
          >
            {client.portal_user_id ? "Portal ativo" : "Convidar ao Portal"}
          </Button>
          {client.portal_user_id && (
            <Badge variant="default" className="text-xs">Portal ativo</Badge>
          )}
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create asset table component**

Create `src/components/clients/asset-table.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertAssetAction, deleteAssetAction } from "@/app/dashboard/clients/[id]/actions";
import { formatBRL } from "@/lib/utils";
import type { Asset } from "@/types";

const categoryLabels: Record<string, string> = {
  investment: "Investimento",
  property: "Imovel",
  vehicle: "Veiculo",
  other: "Outro",
};

export function AssetTable({ clientId, assets }: { clientId: string; assets: Asset[] }) {
  const [adding, setAdding] = useState(false);

  async function handleAdd(formData: FormData) {
    await upsertAssetAction(clientId, {
      category: formData.get("category") as string,
      name: formData.get("name") as string,
      current_value: Number(formData.get("current_value")),
      monthly_yield_rate: Number(formData.get("monthly_yield_rate")) || undefined,
      notes: formData.get("notes") as string || undefined,
    });
    setAdding(false);
  }

  async function handleDelete(assetId: string) {
    await deleteAssetAction(clientId, assetId);
  }

  const totalAssets = assets.reduce((sum, a) => sum + a.current_value, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">Patrimonio</h3>
          <p className="text-xs text-muted-foreground">Total: {formatBRL(totalAssets)}</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" />
          Adicionar
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Nome</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Categoria</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Valor</th>
              <th className="w-10 p-3" />
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-b border-border last:border-0">
                <td className="p-3 text-sm">{asset.name}</td>
                <td className="p-3 text-sm text-muted-foreground">{categoryLabels[asset.category]}</td>
                <td className="p-3 text-sm text-right font-medium">{formatBRL(asset.current_value)}</td>
                <td className="p-3">
                  <button onClick={() => handleDelete(asset.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {adding && (
              <tr className="border-b border-border">
                <td colSpan={4} className="p-3">
                  <form action={handleAdd} className="flex items-end gap-2">
                    <Input name="name" placeholder="Nome do ativo" required className="flex-1" />
                    <Select name="category" defaultValue="investment">
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investment">Investimento</SelectItem>
                        <SelectItem value="property">Imovel</SelectItem>
                        <SelectItem value="vehicle">Veiculo</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input name="current_value" type="number" placeholder="Valor" required className="w-32" />
                    <Input name="monthly_yield_rate" type="number" step="0.01" placeholder="Rend. %" className="w-24" />
                    <Button type="submit" size="sm">Salvar</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
                  </form>
                </td>
              </tr>
            )}
            {assets.length === 0 && !adding && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum ativo cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create liability table component**

Create `src/components/clients/liability-table.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertLiabilityAction, deleteLiabilityAction } from "@/app/dashboard/clients/[id]/actions";
import { formatBRL } from "@/lib/utils";
import type { Liability } from "@/types";

export function LiabilityTable({ clientId, liabilities }: { clientId: string; liabilities: Liability[] }) {
  const [adding, setAdding] = useState(false);

  async function handleAdd(formData: FormData) {
    await upsertLiabilityAction(clientId, {
      name: formData.get("name") as string,
      total_amount: Number(formData.get("total_amount")),
      remaining_amount: Number(formData.get("remaining_amount")),
      monthly_payment: Number(formData.get("monthly_payment")),
      interest_rate: Number(formData.get("interest_rate")),
      due_date: formData.get("due_date") as string || undefined,
    });
    setAdding(false);
  }

  async function handleDelete(liabilityId: string) {
    await deleteLiabilityAction(clientId, liabilityId);
  }

  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.remaining_amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">Dividas</h3>
          <p className="text-xs text-muted-foreground">Total: {formatBRL(totalLiabilities)}</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" />
          Adicionar
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Nome</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Saldo</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Parcela</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Taxa</th>
              <th className="w-10 p-3" />
            </tr>
          </thead>
          <tbody>
            {liabilities.map((liability) => (
              <tr key={liability.id} className="border-b border-border last:border-0">
                <td className="p-3 text-sm">{liability.name}</td>
                <td className="p-3 text-sm text-right">{formatBRL(liability.remaining_amount)}</td>
                <td className="p-3 text-sm text-right">{formatBRL(liability.monthly_payment)}</td>
                <td className="p-3 text-sm text-right text-muted-foreground">{(liability.interest_rate * 100).toFixed(1)}%</td>
                <td className="p-3">
                  <button onClick={() => handleDelete(liability.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {adding && (
              <tr className="border-b border-border">
                <td colSpan={5} className="p-3">
                  <form action={handleAdd} className="flex items-end gap-2">
                    <Input name="name" placeholder="Nome" required className="flex-1" />
                    <Input name="total_amount" type="number" placeholder="Total" required className="w-28" />
                    <Input name="remaining_amount" type="number" placeholder="Saldo" required className="w-28" />
                    <Input name="monthly_payment" type="number" placeholder="Parcela" required className="w-28" />
                    <Input name="interest_rate" type="number" step="0.001" placeholder="Taxa" required className="w-20" />
                    <Button type="submit" size="sm">Salvar</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
                  </form>
                </td>
              </tr>
            )}
            {liabilities.length === 0 && !adding && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                  Nenhuma divida cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create financial tab**

Create `src/components/clients/financial-tab.tsx`:

```tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssetTable } from "./asset-table";
import { LiabilityTable } from "./liability-table";
import { updateFinancialProfileAction } from "@/app/dashboard/clients/[id]/actions";
import { formatBRL } from "@/lib/utils";
import type { Client, FinancialProfile, Asset, Liability } from "@/types";

const riskLabels: Record<string, string> = {
  conservative: "Conservador",
  moderate: "Moderado",
  aggressive: "Agressivo",
};

export function FinancialTab({
  client,
  financialProfile,
  assets,
  liabilities,
}: {
  client: Client;
  financialProfile: FinancialProfile | null;
  assets: Asset[];
  liabilities: Liability[];
}) {
  const fp = financialProfile;
  const totalAssets = assets.reduce((sum, a) => sum + a.current_value, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.remaining_amount, 0);
  const netWorth = totalAssets - totalLiabilities;

  async function handleSaveProfile(formData: FormData) {
    const data: Record<string, number | string> = {
      monthly_income: Number(formData.get("monthly_income")),
      monthly_expenses: Number(formData.get("monthly_expenses")),
      monthly_contribution: Number(formData.get("monthly_contribution")),
      emergency_fund: Number(formData.get("emergency_fund")),
      current_assets: totalAssets,
      retirement_age: Number(formData.get("retirement_age")),
      life_expectancy: Number(formData.get("life_expectancy")),
      desired_retirement_income: Number(formData.get("desired_retirement_income")),
      social_security_income: Number(formData.get("social_security_income")),
      other_income: Number(formData.get("other_income")),
      risk_profile: formData.get("risk_profile") as string,
    };
    await updateFinancialProfileAction(client.id, data);
  }

  return (
    <div className="space-y-8">
      {/* Summary sidebar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Patrimonio liquido</p>
          <p className={`text-lg font-semibold ${netWorth >= 0 ? "text-accent" : "text-destructive"}`}>
            {formatBRL(netWorth)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Reserva de emergencia</p>
          <p className="text-lg font-semibold">{formatBRL(fp?.emergency_fund ?? 0)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Perfil de risco</p>
          <p className="text-lg font-semibold">{riskLabels[fp?.risk_profile ?? "moderate"]}</p>
        </div>
      </div>

      {/* Income & Expenses */}
      <form action={handleSaveProfile} className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3">Renda & Despesas</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Renda mensal (R$)</Label>
              <Input name="monthly_income" type="number" defaultValue={fp?.monthly_income ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Despesas mensais (R$)</Label>
              <Input name="monthly_expenses" type="number" defaultValue={fp?.monthly_expenses ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Aporte mensal (R$)</Label>
              <Input name="monthly_contribution" type="number" defaultValue={fp?.monthly_contribution ?? 0} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Aposentadoria</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Idade aposentadoria</Label>
              <Input name="retirement_age" type="number" defaultValue={fp?.retirement_age ?? 65} />
            </div>
            <div className="space-y-1.5">
              <Label>Expectativa de vida</Label>
              <Input name="life_expectancy" type="number" defaultValue={fp?.life_expectancy ?? 100} />
            </div>
            <div className="space-y-1.5">
              <Label>Reserva emergencia (R$)</Label>
              <Input name="emergency_fund" type="number" defaultValue={fp?.emergency_fund ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Renda desejada (R$)</Label>
              <Input name="desired_retirement_income" type="number" defaultValue={fp?.desired_retirement_income ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Renda INSS (R$)</Label>
              <Input name="social_security_income" type="number" defaultValue={fp?.social_security_income ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Outras rendas (R$)</Label>
              <Input name="other_income" type="number" defaultValue={fp?.other_income ?? 0} />
            </div>
          </div>
        </div>

        <div>
          <Label>Perfil de risco</Label>
          <Select name="risk_profile" defaultValue={fp?.risk_profile ?? "moderate"}>
            <SelectTrigger className="w-48 mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conservative">Conservador</SelectItem>
              <SelectItem value="moderate">Moderado</SelectItem>
              <SelectItem value="aggressive">Agressivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit">Salvar Perfil Financeiro</Button>
      </form>

      {/* Assets & Liabilities */}
      <AssetTable clientId={client.id} assets={assets} />
      <LiabilityTable clientId={client.id} liabilities={liabilities} />
    </div>
  );
}
```

- [ ] **Step 6: Create projection tab**

Create `src/components/clients/projection-tab.tsx`:

```tsx
"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/kpi-card";
import { MetricCard } from "@/components/metric-card";
import { ProjectionChart } from "@/components/projection-chart";
import { computeRates, computeProjection, generateSeries } from "@/lib/projection-engine";
import { formatBRL, formatBRLCompact, formatPercent } from "@/lib/utils";
import { updateScenarioAction } from "@/app/dashboard/clients/[id]/actions";
import type { Client, FinancialProfile, ProjectionScenario, ProjectionInput } from "@/types";

export function ProjectionTab({
  client,
  financialProfile,
  scenario,
}: {
  client: Client;
  financialProfile: FinancialProfile | null;
  scenario: ProjectionScenario | null;
}) {
  const fp = financialProfile;
  const sc = scenario;

  const birthYear = client.birth_date ? new Date(client.birth_date).getFullYear() : null;
  const currentAge = birthYear ? new Date().getFullYear() - birthYear : 40;

  const [params, setParams] = useState({
    cdiRate: (sc?.cdi_rate ?? 0.07) * 100,
    cdiPercentage: (sc?.cdi_percentage ?? 1.1) * 100,
    taxRate: (sc?.tax_rate ?? 0.15) * 100,
    inflationRate: (sc?.inflation_rate ?? 0.035) * 100,
  });

  const input: ProjectionInput = useMemo(() => ({
    currentAge,
    retirementAge: fp?.retirement_age ?? 65,
    lifeExpectancy: fp?.life_expectancy ?? 100,
    currentAssets: fp?.current_assets ?? 0,
    monthlyContribution: fp?.monthly_contribution ?? 0,
    cdiRate: params.cdiRate / 100,
    cdiPercentage: params.cdiPercentage / 100,
    taxRate: params.taxRate / 100,
    inflationRate: params.inflationRate / 100,
    desiredRetirementIncome: fp?.desired_retirement_income ?? 0,
    socialSecurityIncome: fp?.social_security_income ?? 0,
    otherIncome: fp?.other_income ?? 0,
  }), [fp, currentAge, params]);

  const rates = useMemo(() => computeRates(input), [input]);
  const result = useMemo(() => computeProjection(input, rates), [input, rates]);
  const series = useMemo(() => generateSeries(input, rates), [input, rates]);

  async function handleSaveScenario() {
    if (!sc) return;
    await updateScenarioAction(sc.id, client.id, {
      cdi_rate: params.cdiRate / 100,
      cdi_percentage: params.cdiPercentage / 100,
      tax_rate: params.taxRate / 100,
      inflation_rate: params.inflationRate / 100,
    });
  }

  return (
    <div className="space-y-4">
      {/* Rate parameters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3">Parametros de Taxas</h3>
        <div className="grid grid-cols-5 gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">CDI anual (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={params.cdiRate}
              onChange={(e) => setParams((p) => ({ ...p, cdiRate: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">% do CDI</Label>
            <Input
              type="number"
              step="5"
              value={params.cdiPercentage}
              onChange={(e) => setParams((p) => ({ ...p, cdiPercentage: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Aliquota IR (%)</Label>
            <Input
              type="number"
              step="0.5"
              value={params.taxRate}
              onChange={(e) => setParams((p) => ({ ...p, taxRate: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Inflacao anual (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={params.inflationRate}
              onChange={(e) => setParams((p) => ({ ...p, inflationRate: Number(e.target.value) }))}
            />
          </div>
          <Button size="sm" onClick={handleSaveScenario}>Salvar taxas</Button>
        </div>
        <p className="text-xs text-accent mt-2">
          Taxa real liquida a.a.: {formatPercent(rates.realAnnual * 100)}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KPICard
          label="Viver de renda (preservar capital)"
          value={formatBRLCompact(result.wealthForIncome)}
          subtitle={`Renda: ${formatBRL(result.requiredMonthlyIncome)}/mes em juros`}
          accentColor="blue"
        />
        <KPICard
          label="Consumo de capital"
          value={formatBRLCompact(result.wealthForConsumption)}
          subtitle={`Capital zerado em ${result.distributionYears} anos`}
          accentColor="green"
        />
        <KPICard
          label="Patrimonio projetado (simulacao)"
          value={formatBRLCompact(result.projectedWealth)}
          subtitle={`Aportando ${formatBRL(input.monthlyContribution)}/mes por ${result.accumulationYears} anos`}
          accentColor="red"
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Taxa real liquida a.a."
          value={formatPercent(rates.realAnnual * 100)}
          subtitle={`Mensal: ${formatPercent(rates.realMonthly * 100, 3)}`}
        />
        <MetricCard
          label="Horizonte de acumulacao"
          value={`${result.accumulationYears} anos`}
          subtitle={`${input.currentAge} → ${input.retirementAge} anos`}
        />
        <MetricCard
          label="Renda necessaria do portfolio"
          value={formatBRL(result.requiredMonthlyIncome)}
          subtitle="por mes"
        />
        <MetricCard
          label="Diferenca (simulacao vs meta)"
          value={formatBRLCompact(Math.abs(result.gap))}
          subtitle={result.isGoalAchievable ? "superavit" : "deficit"}
          valueClassName={result.isGoalAchievable ? "text-accent" : "text-destructive"}
        />
      </div>

      {/* Chart */}
      <ProjectionChart series={series} />
    </div>
  );
}
```

- [ ] **Step 7: Verify the full client detail page**

```bash
npm run dev
```

Create a client, navigate to their profile, switch between all 3 tabs. Verify the projection tab renders the chart with KPIs.

- [ ] **Step 8: Commit**

```bash
git add src/app/dashboard/clients/\[id\]/ src/components/clients/
git commit -m "feat: add client detail page with personal, financial, and projection tabs"
```

---

## Task 12: Dashboard Home Page (KPIs & Recent Clients)

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Implement dashboard home**

Replace `src/app/dashboard/page.tsx`:

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KPICard } from "@/components/kpi-card";
import { formatBRLCompact } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select(`
      id, full_name, updated_at, portal_user_id,
      financial_profile (current_assets, desired_retirement_income, social_security_income, other_income, monthly_contribution, retirement_age, life_expectancy)
    `)
    .order("updated_at", { ascending: false });

  const allClients = clients ?? [];
  const totalClients = allClients.length;

  const totalAssets = allClients.reduce(
    (sum, c: any) => sum + (c.financial_profile?.current_assets ?? 0),
    0
  );

  const recentClients = allClients.slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <KPICard
          label="Total de clientes"
          value={String(totalClients)}
          accentColor="blue"
        />
        <KPICard
          label="Patrimonio sob gestao"
          value={formatBRLCompact(totalAssets)}
          accentColor="green"
        />
        <KPICard
          label="Clientes ativos no portal"
          value={String(allClients.filter((c: any) => c.portal_user_id).length)}
          accentColor="amber"
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold">Clientes recentes</h2>
        </div>
        <div className="divide-y divide-border">
          {recentClients.map((client: any) => (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors"
            >
              <span className="text-sm font-medium">{client.full_name}</span>
              <span className="text-xs text-muted-foreground">
                {formatBRLCompact(client.financial_profile?.current_assets ?? 0)}
              </span>
            </Link>
          ))}
          {recentClients.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Nenhum cliente cadastrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify dashboard renders**

```bash
npm run dev
```

Navigate to `/dashboard` — should show KPIs and recent clients list.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add dashboard home with KPIs and recent clients"
```

---

## Task 13: Client Portal (Read-Only)

**Files:**
- Create: `src/app/portal/layout.tsx`, `src/app/portal/profile/page.tsx`, `src/app/portal/projection/page.tsx`

- [ ] **Step 1: Create portal layout**

Create `src/app/portal/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";
import { PortalTopbar } from "./portal-topbar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || profile.role !== "client") redirect("/login");

  // Find which client record this user is linked to
  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("portal_user_id", user.id)
    .single();

  if (!client) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <PortalTopbar profile={profile} />
      <main className="max-w-5xl mx-auto p-6">{children}</main>
    </div>
  );
}
```

Create `src/app/portal/portal-topbar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

const tabs = [
  { href: "/portal/profile", label: "Meu Perfil" },
  { href: "/portal/projection", label: "Minha Projecao" },
];

export function PortalTopbar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold">Pranej Fin</span>
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  pathname === tab.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{profile.full_name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create portal profile page**

Create `src/app/portal/profile/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/utils";

export default async function PortalProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("portal_user_id", user.id)
    .single();

  if (!client) redirect("/login");

  const { data: fp } = await supabase
    .from("financial_profile")
    .select("*")
    .eq("client_id", client.id)
    .single();

  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .eq("client_id", client.id);

  const { data: liabilities } = await supabase
    .from("liabilities")
    .select("*")
    .eq("client_id", client.id);

  const totalAssets = (assets ?? []).reduce((s: number, a: any) => s + a.current_value, 0);
  const totalLiabilities = (liabilities ?? []).reduce((s: number, l: any) => s + l.remaining_amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Meu Perfil Financeiro</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Patrimonio liquido</p>
          <p className="text-xl font-semibold text-accent">{formatBRL(totalAssets - totalLiabilities)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Renda mensal</p>
          <p className="text-xl font-semibold">{formatBRL(fp?.monthly_income ?? 0)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Aporte mensal</p>
          <p className="text-xl font-semibold">{formatBRL(fp?.monthly_contribution ?? 0)}</p>
        </div>
      </div>

      {(assets?.length ?? 0) > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold">Ativos</h2>
          </div>
          <table className="w-full">
            <tbody>
              {assets?.map((a: any) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-sm">{a.name}</td>
                  <td className="p-4 text-sm text-right font-medium">{formatBRL(a.current_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(liabilities?.length ?? 0) > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold">Dividas</h2>
          </div>
          <table className="w-full">
            <tbody>
              {liabilities?.map((l: any) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-sm">{l.name}</td>
                  <td className="p-4 text-sm text-right font-medium">{formatBRL(l.remaining_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create portal projection page**

Create `src/app/portal/projection/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalProjectionView } from "./portal-projection-view";

export default async function PortalProjectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("portal_user_id", user.id)
    .single();

  if (!client) redirect("/login");

  const [fpRes, scenarioRes] = await Promise.all([
    supabase.from("financial_profile").select("*").eq("client_id", client.id).single(),
    supabase.from("projection_scenarios").select("*").eq("client_id", client.id).eq("is_default", true).single(),
  ]);

  return (
    <PortalProjectionView
      client={client}
      financialProfile={fpRes.data}
      scenario={scenarioRes.data}
    />
  );
}
```

Create `src/app/portal/projection/portal-projection-view.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import { KPICard } from "@/components/kpi-card";
import { MetricCard } from "@/components/metric-card";
import { ProjectionChart } from "@/components/projection-chart";
import { computeRates, computeProjection, generateSeries } from "@/lib/projection-engine";
import { formatBRL, formatBRLCompact, formatPercent } from "@/lib/utils";
import type { Client, FinancialProfile, ProjectionScenario, ProjectionInput } from "@/types";

export function PortalProjectionView({
  client,
  financialProfile,
  scenario,
}: {
  client: Client;
  financialProfile: FinancialProfile | null;
  scenario: ProjectionScenario | null;
}) {
  const fp = financialProfile;
  const sc = scenario;

  const birthYear = client.birth_date ? new Date(client.birth_date).getFullYear() : null;
  const currentAge = birthYear ? new Date().getFullYear() - birthYear : 40;

  const input: ProjectionInput = useMemo(() => ({
    currentAge,
    retirementAge: fp?.retirement_age ?? 65,
    lifeExpectancy: fp?.life_expectancy ?? 100,
    currentAssets: fp?.current_assets ?? 0,
    monthlyContribution: fp?.monthly_contribution ?? 0,
    cdiRate: sc?.cdi_rate ?? 0.07,
    cdiPercentage: sc?.cdi_percentage ?? 1.1,
    taxRate: sc?.tax_rate ?? 0.15,
    inflationRate: sc?.inflation_rate ?? 0.035,
    desiredRetirementIncome: fp?.desired_retirement_income ?? 0,
    socialSecurityIncome: fp?.social_security_income ?? 0,
    otherIncome: fp?.other_income ?? 0,
  }), [fp, sc, currentAge]);

  const rates = useMemo(() => computeRates(input), [input]);
  const result = useMemo(() => computeProjection(input, rates), [input, rates]);
  const series = useMemo(() => generateSeries(input, rates), [input, rates]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Minha Projecao Patrimonial</h1>

      <div className="grid grid-cols-3 gap-3">
        <KPICard
          label="Viver de renda"
          value={formatBRLCompact(result.wealthForIncome)}
          subtitle={`${formatBRL(result.requiredMonthlyIncome)}/mes`}
          accentColor="blue"
        />
        <KPICard
          label="Patrimonio projetado"
          value={formatBRLCompact(result.projectedWealth)}
          subtitle={`Em ${result.accumulationYears} anos`}
          accentColor="green"
        />
        <KPICard
          label={result.isGoalAchievable ? "Meta atingivel" : "Revisao necessaria"}
          value={formatBRLCompact(Math.abs(result.gap))}
          subtitle={result.isGoalAchievable ? "superavit" : "deficit"}
          accentColor={result.isGoalAchievable ? "green" : "red"}
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Taxa real liquida a.a."
          value={formatPercent(rates.realAnnual * 100)}
        />
        <MetricCard
          label="Horizonte"
          value={`${result.accumulationYears} anos`}
        />
        <MetricCard
          label="Renda necessaria"
          value={formatBRL(result.requiredMonthlyIncome)}
          subtitle="por mes"
        />
        <MetricCard
          label="Aporte mensal"
          value={formatBRL(input.monthlyContribution)}
        />
      </div>

      <ProjectionChart series={series} />
    </div>
  );
}
```

- [ ] **Step 4: Add portal redirect for root**

Create `src/app/portal/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function PortalPage() {
  redirect("/portal/profile");
}
```

- [ ] **Step 5: Verify portal renders**

```bash
npm run dev
```

Log in as a client user and navigate to `/portal` — should show topbar with tabs, profile page with financial data, and projection page with chart. (Requires a client account linked via `portal_user_id`.)

- [ ] **Step 6: Commit**

```bash
git add src/app/portal/
git commit -m "feat: add client portal with read-only profile and projection views"
```

---

## Task 14: Final Verification & Cleanup

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: All projection engine tests pass.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: Build completes without errors. Fix any TypeScript or import issues.

- [ ] **Step 3: Manual smoke test**

Test the complete flow:
1. Open `/login` — Google OAuth button renders
2. Log in as planner — redirected to `/dashboard`
3. Dashboard shows KPIs (0 clients initially)
4. Navigate to Clients → New Client → fill form → submit
5. Client detail shows 3 tabs: Personal, Financial, Projection
6. Financial tab: add assets, liabilities, save profile
7. Projection tab: chart renders with correct KPIs
8. Adjust tax parameters → chart updates in real-time

- [ ] **Step 4: Commit final state**

```bash
git add -A
git commit -m "chore: final cleanup and build verification for Fase 1"
```
