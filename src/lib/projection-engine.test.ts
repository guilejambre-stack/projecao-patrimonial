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
    expect(rates.nominal).toBeCloseTo(0.077, 4);
    expect(rates.net).toBeCloseTo(0.06545, 4);
    expect(rates.realAnnual).toBeCloseTo(0.02942, 3);
    expect(rates.realMonthly).toBeGreaterThan(0);
    expect(rates.realMonthly).toBeLessThan(rates.realAnnual);
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
