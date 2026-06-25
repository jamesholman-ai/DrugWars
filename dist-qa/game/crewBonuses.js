"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CREW_ROLE_LABELS = void 0;
exports.getRunnerCapacityBonus = getRunnerCapacityBonus;
exports.getLookoutPoliceReduction = getLookoutPoliceReduction;
exports.getEnforcerCombatBonus = getEnforcerCombatBonus;
exports.getSmugglerTravelReduction = getSmugglerTravelReduction;
exports.getAccountantDebtReduction = getAccountantDebtReduction;
exports.getFixerHeatBonus = getFixerHeatBonus;
exports.getFixerBribeBonus = getFixerBribeBonus;
exports.getDealerSaleBonus = getDealerSaleBonus;
exports.getDealerContractBonus = getDealerContractBonus;
exports.getSupplierScoutBonuses = getSupplierScoutBonuses;
exports.getDailyPayroll = getDailyPayroll;
exports.getHiredCrewCount = getHiredCrewCount;
function activeCrew(state) {
    return (state.hiredCrew ?? []).filter((c) => c.status === 'hired');
}
function sumBonus(crew, pick) {
    let total = 0;
    for (const member of crew) {
        const mult = 0.6 + member.skill / 200 + member.loyalty / 200;
        const val = pick(member.bonuses, member.skill, member.loyalty);
        if (val != null)
            total += val * mult;
    }
    return total;
}
function getRunnerCapacityBonus(state) {
    return Math.round(sumBonus(activeCrew(state).filter((c) => c.role === 'runner'), (b) => b.carryCapacity ?? 0));
}
function getLookoutPoliceReduction(state) {
    return clamp01(sumBonus(activeCrew(state).filter((c) => c.role === 'lookout'), (b) => b.policeEncounterReduction ?? 0));
}
function getEnforcerCombatBonus(state) {
    return Math.round(sumBonus(activeCrew(state).filter((c) => c.role === 'enforcer'), (b) => b.combatBonus ?? 0));
}
function getSmugglerTravelReduction(state) {
    return clamp01(sumBonus(activeCrew(state).filter((c) => c.role === 'smuggler'), (b) => b.travelRiskReduction ?? 0));
}
function getAccountantDebtReduction(state) {
    return clamp01(sumBonus(activeCrew(state).filter((c) => c.role === 'accountant'), (b) => b.debtInterestReduction ?? 0));
}
function getFixerHeatBonus(state) {
    return Math.round(sumBonus(activeCrew(state).filter((c) => c.role === 'fixer'), (b) => b.heatReductionBonus ?? 0));
}
function getFixerBribeBonus(state) {
    return clamp01(sumBonus(activeCrew(state).filter((c) => c.role === 'fixer'), (b) => b.bribeBonus ?? 0));
}
function getDealerSaleBonus(state) {
    return clamp01(sumBonus(activeCrew(state).filter((c) => c.role === 'dealer'), (b) => b.salePriceBonus ?? 0));
}
function getDealerContractBonus(state) {
    return clamp01(sumBonus(activeCrew(state).filter((c) => c.role === 'dealer'), (b) => b.contractPayoutBonus ?? 0));
}
function getSupplierScoutBonuses(state) {
    const scout = activeCrew(state).filter((c) => c.role === 'supplier_scout');
    return {
        discount: clamp01(sumBonus(scout, (b) => b.supplierDiscountBonus ?? 0)),
        reliability: clamp01(sumBonus(scout, (b) => b.supplierReliabilityBonus ?? 0)),
    };
}
function getDailyPayroll(state) {
    return activeCrew(state).reduce((sum, c) => sum + c.salaryPerDay, 0);
}
function getHiredCrewCount(state) {
    return activeCrew(state).length;
}
function clamp01(n) {
    return Math.max(0, Math.min(1, n));
}
exports.CREW_ROLE_LABELS = {
    runner: 'Runner',
    lookout: 'Lookout',
    enforcer: 'Enforcer',
    smuggler: 'Smuggler',
    accountant: 'Accountant',
    fixer: 'Fixer',
    dealer: 'Dealer',
    supplier_scout: 'Supplier Scout',
};
