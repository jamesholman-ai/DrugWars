"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_HIRED_CREW = exports.MAX_CREW_RECRUITS = exports.CREW_TEMPLATE_MAP = exports.CREW_TEMPLATES = void 0;
exports.templateToOffer = templateToOffer;
function t(id, name, role, cityId, areaId, skill, salary, hire, bonuses, traits, unlock = {}) {
    return {
        id,
        name,
        role,
        cityId,
        areaId,
        skill,
        loyalty: 55 + Math.floor(skill / 5),
        salaryPerDay: salary,
        hireCost: hire,
        bonuses,
        riskTraits: traits,
        ...unlock,
    };
}
exports.CREW_TEMPLATES = [
    // Early — NY / Miami / Atlanta
    t('crew_ny_runner_tee', 'Little Tee', 'runner', 'new_york', 'new_york_harlem', 42, 70, 550, { carryCapacity: 15 }, ['Fast', 'Talkative'], {}),
    t('crew_ny_lookout_jax', 'Jax', 'lookout', 'new_york', 'new_york_brooklyn', 38, 75, 650, { policeEncounterReduction: 0.08 }, ['Paranoid'], {}),
    t('crew_miami_runner_coco', 'Coco', 'runner', 'miami', 'miami_little_havana', 40, 72, 600, { carryCapacity: 12 }, ['Bilingual'], {}),
    t('crew_atl_lookout_spark', 'Spark', 'lookout', 'atlanta', 'atlanta_zone_6', 36, 75, 550, { policeEncounterReduction: 0.06 }, ['Night owl'], {}),
    // Mid
    t('crew_chi_enforcer_iron', 'Iron Mike', 'enforcer', 'chicago', 'chicago_south_side', 62, 180, 2200, { combatBonus: 8 }, ['Violent past'], { minRank: 'hustler' }),
    t('crew_miami_smuggler_wave', 'Wave', 'smuggler', 'miami', 'miami_port', 58, 200, 2800, { travelRiskReduction: 0.12 }, ['Coast guard contacts'], { minRank: 'hustler', minReputation: 25 }),
    t('crew_det_enforcer_rust', 'Rust Jaw', 'enforcer', 'detroit', 'detroit_east_side', 55, 170, 2000, { combatBonus: 6 }, ['Reckless'], { minRank: 'dealer' }),
    t('crew_vegas_dealer_neon', 'Neon', 'dealer', 'las_vegas', 'las_vegas_strip', 60, 160, 2400, { salePriceBonus: 0.06, contractPayoutBonus: 0.05 }, ['Strip savvy'], { minRank: 'dealer' }),
    t('crew_sea_scout_rain', 'Rain', 'supplier_scout', 'seattle', 'seattle_capitol_hill', 52, 140, 1800, { supplierDiscountBonus: 0.04, supplierReliabilityBonus: 0.06 }, ['Connected'], { minRank: 'dealer' }),
    // Late
    t('crew_ny_fixer_silk', 'Silk', 'fixer', 'new_york', 'new_york_downtown', 72, 320, 5500, { heatReductionBonus: 3, bribeBonus: 0.1 }, ['City hall ties'], { minRank: 'plug', minReputation: 45 }),
    t('crew_la_smuggler_jet', 'Jetstream', 'smuggler', 'los_angeles', 'los_angeles_port', 68, 280, 4800, { travelRiskReduction: 0.18 }, ['Customs bribes'], { minRank: 'plug' }),
    t('crew_ny_accountant_ledger', 'Ledger', 'accountant', 'new_york', 'new_york_downtown', 70, 350, 6000, { debtInterestReduction: 0.15 }, ['Clean books'], { minRank: 'shot_caller', minReputation: 55 }),
    t('crew_london_fixer_cheshire', 'Cheshire', 'fixer', 'london', 'london_central', 75, 400, 8000, { heatReductionBonus: 4, bribeBonus: 0.12 }, ['Old money'], { minRank: 'kingpin' }),
    t('crew_miami_dealer_boss', 'Boss Lady', 'dealer', 'miami', 'miami_beach_district', 65, 220, 3500, { salePriceBonus: 0.08, contractPayoutBonus: 0.08 }, ['VIP list'], { minRank: 'shot_caller' }),
];
exports.CREW_TEMPLATE_MAP = Object.fromEntries(exports.CREW_TEMPLATES.map((c) => [c.id, c]));
exports.MAX_CREW_RECRUITS = 5;
exports.MAX_HIRED_CREW = 6;
function templateToOffer(template, day) {
    return {
        id: `recruit_${day}_${template.id}`,
        templateId: template.id,
        name: template.name,
        role: template.role,
        cityId: template.cityId,
        areaId: template.areaId,
        skill: template.skill,
        loyalty: template.loyalty,
        salaryPerDay: template.salaryPerDay,
        hireCost: template.hireCost,
        bonuses: template.bonuses,
        riskTraits: template.riskTraits,
        expiresDay: day + 3,
        minRank: template.minRank,
        minReputation: template.minReputation,
    };
}
