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
