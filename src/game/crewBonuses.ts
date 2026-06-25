import { GameState } from '../types/game';
import { CrewBonuses, CrewRole, HiredCrewMember } from '../types/crew';

function activeCrew(state: GameState): HiredCrewMember[] {
  return (state.hiredCrew ?? []).filter((c) => c.status === 'hired');
}

function sumBonus(
  crew: HiredCrewMember[],
  pick: (b: CrewBonuses, skill: number, loyalty: number) => number | undefined
): number {
  let total = 0;
  for (const member of crew) {
    const mult = 0.6 + member.skill / 200 + member.loyalty / 200;
    const val = pick(member.bonuses, member.skill, member.loyalty);
    if (val != null) total += val * mult;
  }
  return total;
}

export function getRunnerCapacityBonus(state: GameState): number {
  return Math.round(
    sumBonus(
      activeCrew(state).filter((c) => c.role === 'runner'),
      (b) => b.carryCapacity ?? 0
    )
  );
}

export function getLookoutPoliceReduction(state: GameState): number {
  return clamp01(
    sumBonus(
      activeCrew(state).filter((c) => c.role === 'lookout'),
      (b) => b.policeEncounterReduction ?? 0
    )
  );
}

export function getEnforcerCombatBonus(state: GameState): number {
  return Math.round(
    sumBonus(
      activeCrew(state).filter((c) => c.role === 'enforcer'),
      (b) => b.combatBonus ?? 0
    )
  );
}

export function getSmugglerTravelReduction(state: GameState): number {
  return clamp01(
    sumBonus(
      activeCrew(state).filter((c) => c.role === 'smuggler'),
      (b) => b.travelRiskReduction ?? 0
    )
  );
}

export function getAccountantDebtReduction(state: GameState): number {
  return clamp01(
    sumBonus(
      activeCrew(state).filter((c) => c.role === 'accountant'),
      (b) => b.debtInterestReduction ?? 0
    )
  );
}

export function getFixerHeatBonus(state: GameState): number {
  return Math.round(
    sumBonus(
      activeCrew(state).filter((c) => c.role === 'fixer'),
      (b) => b.heatReductionBonus ?? 0
    )
  );
}

export function getFixerBribeBonus(state: GameState): number {
  return clamp01(
    sumBonus(
      activeCrew(state).filter((c) => c.role === 'fixer'),
      (b) => b.bribeBonus ?? 0
    )
  );
}

export function getDealerSaleBonus(state: GameState): number {
  return clamp01(
    sumBonus(
      activeCrew(state).filter((c) => c.role === 'dealer'),
      (b) => b.salePriceBonus ?? 0
    )
  );
}

export function getDealerContractBonus(state: GameState): number {
  return clamp01(
    sumBonus(
      activeCrew(state).filter((c) => c.role === 'dealer'),
      (b) => b.contractPayoutBonus ?? 0
    )
  );
}

export function getSupplierScoutBonuses(state: GameState): {
  discount: number;
  reliability: number;
} {
  const scout = activeCrew(state).filter((c) => c.role === 'supplier_scout');
  return {
    discount: clamp01(
      sumBonus(scout, (b) => b.supplierDiscountBonus ?? 0)
    ),
    reliability: clamp01(
      sumBonus(scout, (b) => b.supplierReliabilityBonus ?? 0)
    ),
  };
}

export function getDailyPayroll(state: GameState): number {
  return activeCrew(state).reduce((sum, c) => sum + c.salaryPerDay, 0);
}

export function getHiredCrewCount(state: GameState): number {
  return activeCrew(state).length;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export const CREW_ROLE_LABELS: Record<CrewRole, string> = {
  runner: 'Runner',
  lookout: 'Lookout',
  enforcer: 'Enforcer',
  smuggler: 'Smuggler',
  accountant: 'Accountant',
  fixer: 'Fixer',
  dealer: 'Dealer',
  supplier_scout: 'Supplier Scout',
};
