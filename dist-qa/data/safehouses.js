"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAFEHOUSE_TIER_LABELS = exports.SAFEHOUSE_MAP = exports.SAFEHOUSES = void 0;
function sh(id, name, tier, cityId, areaId, cost, storage, heat, robbery, policeMod, upkeep, description, unlock = {}) {
    return {
        id,
        name,
        tier,
        cityId,
        areaId,
        purchaseCost: cost,
        storageCapacity: storage,
        heatReductionPerDay: heat,
        robberyProtection: robbery,
        policeRiskModifier: policeMod,
        upkeepPerDay: upkeep,
        description,
        ...unlock,
    };
}
exports.SAFEHOUSES = [
    sh('sh_ny_harlem_motel', 'Harlem Motel Room', 'motel_room', 'new_york', 'new_york_harlem', 1500, 25, 1, 0.08, 0.95, 35, 'Hourly motel. Low profile, low space.'),
    sh('sh_miami_havana_apt', 'Little Havana Apartment', 'apartment', 'miami', 'miami_little_havana', 3200, 40, 2, 0.12, 0.92, 65, 'Second-floor walk-up behind a bodega.'),
    sh('sh_atl_zone6_trap', 'Zone 6 Trap House', 'trap_house', 'atlanta', 'atlanta_zone_6', 4500, 55, 2, 0.15, 0.9, 80, 'Boarded windows. Corners know not to ask questions.'),
    sh('sh_det_industrial_wh', 'Industrial Warehouse', 'warehouse', 'detroit', 'detroit_industrial', 9000, 120, 3, 0.22, 0.88, 150, 'Rail-side storage. Serious bulk.', { minRank: 'hustler' }),
    sh('sh_vegas_strip_club', 'Strip Backroom', 'nightclub_backroom', 'las_vegas', 'las_vegas_strip', 12000, 80, 2, 0.2, 0.85, 200, 'Casino service corridor locker network.', { minRank: 'dealer' }),
    sh('sh_ny_downtown_pent', 'Midtown Penthouse', 'penthouse', 'new_york', 'new_york_downtown', 22000, 70, 4, 0.25, 0.8, 350, 'Skyline views. Heat melts upstairs.', { minRank: 'plug', minReputation: 40 }),
    sh('sh_miami_port_compound', 'Port Compound', 'private_compound', 'miami', 'miami_port', 35000, 200, 5, 0.3, 0.75, 500, 'Gated dockside estate. Cartel-grade storage.', { minRank: 'kingpin' }),
    sh('sh_la_hollywood_apt', 'Hollywood Apartment', 'apartment', 'los_angeles', 'los_angeles_hollywood', 3800, 45, 2, 0.1, 0.93, 70, 'Off-strip unit. Party crowd cover noise.'),
    sh('sh_chi_loop_motel', 'Loop Motel', 'motel_room', 'chicago', 'chicago_downtown', 2000, 30, 1, 0.08, 0.94, 45, 'Business district hourly rooms.'),
    sh('sh_london_flat', 'Central Flat', 'apartment', 'london', 'london_central', 14000, 60, 3, 0.18, 0.87, 280, 'Council flat with hidden floor safe.', { minRank: 'kingpin' }),
];
exports.SAFEHOUSE_MAP = Object.fromEntries(exports.SAFEHOUSES.map((s) => [s.id, s]));
exports.SAFEHOUSE_TIER_LABELS = {
    motel_room: 'Motel Room',
    apartment: 'Apartment',
    trap_house: 'Trap House',
    warehouse: 'Warehouse',
    nightclub_backroom: 'Nightclub Backroom',
    penthouse: 'Penthouse',
    private_compound: 'Private Compound',
};
