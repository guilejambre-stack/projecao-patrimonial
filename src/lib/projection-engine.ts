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

  const wealthForIncome =
    r > 0 ? requiredMonthlyIncome / r : requiredMonthlyIncome * 1200;

  const wealthForConsumption =
    r === 0
      ? requiredMonthlyIncome * nD
      : (requiredMonthlyIncome * (1 - Math.pow(1 + r, -nD))) / r;

  const projectedWealth =
    ra === 0
      ? input.currentAssets + input.monthlyContribution * nA
      : input.currentAssets * Math.pow(1 + ra, nA) +
        (input.monthlyContribution * (Math.pow(1 + ra, nA) - 1)) / ra;

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
            (input.monthlyContribution * (Math.pow(1 + ra, months) - 1)) / ra;

      simulated.push(Math.round(pat));
      incomePreserving.push(Math.round(result.wealthForIncome));
      capitalConsumption.push(Math.round(result.wealthForConsumption));
    } else {
      const monthsInRetirement = (age - input.retirementAge) * 12;

      const decumulate = (principal: number, rate: number): number => {
        if (rate === 0)
          return Math.max(0, principal - rmi * monthsInRetirement);
        return Math.max(
          0,
          principal * Math.pow(1 + rate, monthsInRetirement) -
            (rmi * (Math.pow(1 + rate, monthsInRetirement) - 1)) / rate
        );
      };

      incomePreserving.push(Math.round(result.wealthForIncome));
      capitalConsumption.push(
        Math.round(decumulate(result.wealthForConsumption, r))
      );
      simulated.push(Math.round(decumulate(result.projectedWealth, r)));
    }
  }

  return { ages, incomePreserving, capitalConsumption, simulated };
}
