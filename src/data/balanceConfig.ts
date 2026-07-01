/**
 * Central economy tuning knobs for progression pacing.
 * Mid/late game costs and upkeep scale up; early game stays playable.
 */
export const BALANCE = {
  /** Multiplier on commodity volatility rolls (lower = calmer markets). */
  priceVolatility: 0.88,
  /** Chance of extreme price spike per commodity roll (was ~6%). */
  extremeSpikeChance: 0.035,
  /** Chance of extreme price crash (was ~8%). */
  extremeCrashChance: 0.05,
  /** Scales hustler+ supplier discount bonus. */
  supplierDiscountScale: 0.82,
  /** Scales trust-based supplier discount growth. */
  supplierTrustDiscountScale: 0.85,
  /** Scales contract payout multiplier band. */
  contractPayoutScale: 0.88,
  /** Scales generated business daily income. */
  businessIncomeScale: 0.78,
  /** Scales generated business purchase cost. */
  businessCostScale: 1.35,
  /** Scales crew salary and hire cost. */
  payrollScale: 1.22,
  /** Scales business/property upkeep. */
  upkeepScale: 1.28,
  /** Scales laundering capacity (lower = more valuable). */
  launderingScale: 0.72,
  /** Scales rank-gated business tier requirements. */
  rankRequirementScale: 1,
  /** Daily debt interest (base 2.5%). */
  debtInterestRate: 0.027,
  /** Travel cost multiplier. */
  travelCostScale: 1.12,
  /** Property / upgrade cost multiplier. */
  upgradeCostScale: 1.25,
} as const;

export type BalanceConfig = typeof BALANCE;
