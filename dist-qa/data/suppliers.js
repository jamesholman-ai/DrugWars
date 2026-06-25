"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPLIER_TYPE_LABELS = exports.SUPPLIER_MAP = exports.SUPPLIERS = void 0;
function s(id, name, type, cityId, areaId, drugs, discount, reliability, quality, risk, unlock, description, debtAllowed = 0) {
    return {
        id,
        name,
        type,
        cityId,
        areaId,
        specialtyDrugs: drugs,
        priceDiscount: discount,
        reliability,
        qualityLevel: quality,
        debtAllowed,
        riskLevel: risk,
        unlockRequirements: unlock,
        description,
    };
}
exports.SUPPLIERS = [
    // New York
    s('sup_ny_harlem_plug', 'Tee', 'street_plug', 'new_york', 'new_york_harlem', ['weed', 'crack'], 0.12, 72, 2, 3, {}, 'Corner plug on 125th. Moves green and hard.'),
    s('sup_ny_downtown_club', 'Vix', 'club_supplier', 'new_york', 'new_york_downtown', ['cocaine', 'ketamine', 'mdma'], 0.1, 85, 4, 2, { minReputation: 15 }, 'VIP room connect. Premium product, premium discretion.'),
    s('sup_ny_queens_courier', 'Marco', 'airport_courier', 'new_york', 'new_york_queens', ['cocaine', 'heroin', 'hashish'], 0.08, 78, 3, 4, { minRank: 'runner' }, 'Runs product through JFK corridors. High heat, fast lanes.', 2000),
    // Miami
    s('sup_miami_port', 'El Flaco', 'port_contact', 'miami', 'miami_port', ['cocaine', 'crack', 'heroin'], 0.18, 80, 4, 3, { minReputation: 20 }, 'Dockside contact. Import prices on the water.'),
    s('sup_miami_beach_club', 'Luna', 'club_supplier', 'miami', 'miami_beach_district', ['mdma', 'cocaine', 'ketamine'], 0.11, 88, 4, 2, {}, 'South Beach nightlife pipeline. Party product moves fast.'),
    s('sup_miami_cartel', 'Compadre Rios', 'cartel_supplier', 'miami', 'miami_little_havana', ['cocaine', 'crack', 'heroin'], 0.25, 70, 5, 5, { minRank: 'hustler', minReputation: 30 }, 'Cartel wholesale. Big discounts, bigger consequences.', 5000),
    // Los Angeles
    s('sup_la_hollywood', 'Dash', 'club_supplier', 'los_angeles', 'los_angeles_hollywood', ['cocaine', 'mdma', 'ketamine'], 0.1, 82, 4, 2, { minReputation: 18 }, 'Studio parties and after-hours. Hollywood markup avoided.'),
    s('sup_la_south_central', 'Big Tone', 'street_plug', 'los_angeles', 'los_angeles_south_central', ['crack', 'weed', 'meth'], 0.14, 68, 2, 4, {}, 'South Central corners. Cheap but unpredictable.'),
    s('sup_la_port', 'Harbor Mike', 'port_contact', 'los_angeles', 'los_angeles_port', ['meth', 'heroin', 'cocaine'], 0.16, 75, 3, 3, { minRank: 'runner' }, 'Long Beach lanes. Bulk import pricing.'),
    // Atlanta
    s('sup_atl_zone6', 'Trap King', 'street_plug', 'atlanta', 'atlanta_zone_6', ['weed', 'mdma', 'crack'], 0.13, 74, 2, 3, {}, 'Zone 6 corners. Loud product, loud reputation.'),
    s('sup_atl_buckhead', 'Priya', 'club_supplier', 'atlanta', 'atlanta_buckhead', ['cocaine', 'ketamine'], 0.09, 90, 5, 2, { minReputation: 25 }, 'Buckhead buyer who also moves weight to friends.'),
    // Chicago
    s('sup_chi_south', 'Ghost', 'street_plug', 'chicago', 'chicago_south_side', ['crack', 'heroin'], 0.15, 65, 2, 4, { minRank: 'runner' }, 'South Side ghost. Cheap, risky, always watching.'),
    s('sup_chi_ohare', 'Runway', 'airport_courier', 'chicago', 'chicago_ohare', ['cocaine', 'heroin'], 0.07, 76, 3, 5, { minRank: 'dealer' }, 'O\'Hare smuggling lanes. Customs heat is real.', 3000),
    // Detroit
    s('sup_det_industrial', 'Rust', 'port_contact', 'detroit', 'detroit_industrial', ['meth', 'heroin', 'crack'], 0.17, 71, 3, 4, { minRank: 'hustler' }, 'Rail yard contact. Industrial-grade discounts.'),
    // Las Vegas
    s('sup_vegas_strip', 'Neon', 'club_supplier', 'las_vegas', 'las_vegas_strip', ['ecstasy', 'mdma', 'ketamine', 'cocaine'], 0.12, 86, 4, 2, { minRank: 'plug' }, 'Strip back-of-house. Tourist-grade party packs.'),
    // Seattle
    s('sup_sea_capitol', 'Rain', 'street_plug', 'seattle', 'seattle_capitol_hill', ['weed', 'mushrooms', 'lsd'], 0.2, 80, 3, 1, { minRank: 'dealer' }, 'Capitol Hill green connect. Cheap local product.'),
    // London
    s('sup_london_broker', 'Cheshire', 'international_broker', 'london', 'london_central', ['cocaine', 'hashish', 'heroin'], 0.06, 92, 5, 3, { minRank: 'kingpin', minReputation: 60 }, 'Cross-border broker. Import markups slashed.', 8000),
    // Amsterdam
    s('sup_ams_centrum', 'Jan', 'international_broker', 'amsterdam', 'amsterdam_centrum', ['weed', 'hashish', 'mushrooms'], 0.22, 88, 4, 1, { minRank: 'shot_caller' }, 'Centrum coffee-shop pipeline. Export weed cheap.'),
    // Cartel (Miami + Detroit)
    s('sup_miami_cartel_boss', 'La Jefa', 'cartel_supplier', 'miami', 'miami_port', ['cocaine', 'heroin', 'meth'], 0.28, 62, 5, 6, { minRank: 'plug', minReputation: 45 }, 'Cartel boss direct. Massive volume, massive risk.', 10000),
];
exports.SUPPLIER_MAP = Object.fromEntries(exports.SUPPLIERS.map((sup) => [sup.id, sup]));
exports.SUPPLIER_TYPE_LABELS = {
    street_plug: 'Street Plug',
    club_supplier: 'Club Supplier',
    cartel_supplier: 'Cartel Supplier',
    port_contact: 'Port Contact',
    airport_courier: 'Airport Courier',
    international_broker: 'International Broker',
};
