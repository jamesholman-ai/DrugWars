/** Gameplay effects granted by a store product — fixed, never random. */
export interface ProductEffects {
  dirtyCash?: number;
  debtReduction?: number;
  intelTips?: number;
  lawyerTokens?: number;
  heatReduction?: number;
  localHeatReduction?: number;
  temporaryStorage?: { capacity: number; days: number };
  propertyCondition?: number;
  robberyProtectionTokens?: number;
  policeReductionDays?: number;
  crewLoyalty?: number;
  payrollDays?: number;
  clearCrewPenalty?: boolean;
  businessCondition?: number;
  businessUpkeepDays?: number;
  businessRaidProtectionDays?: number;
  oncePerRun?: boolean;
}
