"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialProgression = createInitialProgression;
exports.getReputationTier = getReputationTier;
exports.computeRankId = computeRankId;
exports.getCurrentRank = getCurrentRank;
exports.getNextRank = getNextRank;
exports.getRankProgress = getRankProgress;
exports.getLocationUnlockHint = getLocationUnlockHint;
exports.isLocationUnlocked = isLocationUnlocked;
exports.computeUnlockedLocations = computeUnlockedLocations;
exports.sanitizePurchasedUpgrades = sanitizePurchasedUpgrades;
exports.computeInventoryCapacity = computeInventoryCapacity;
exports.getExtraHeatDecayAtLocation = getExtraHeatDecayAtLocation;
exports.getRobberyWeightMultiplier = getRobberyWeightMultiplier;
exports.getNextInventoryUpgrade = getNextInventoryUpgrade;
exports.syncProgression = syncProgression;
exports.applyProgressionAfterAction = applyProgressionAfterAction;
exports.addLifetimeProfit = addLifetimeProfit;
exports.purchaseInventoryUpgrade = purchaseInventoryUpgrade;
exports.purchaseStashHouse = purchaseStashHouse;
exports.formatNextRankRequirements = formatNextRankRequirements;
exports.migrateLegacyProgression = migrateLegacyProgression;
const progression_1 = require("../data/progression");
const locations_1 = require("../data/locations");
const economy_1 = require("./economy");
const messages_1 = require("./messages");
function createInitialProgression() {
    return {
        rankId: 'wannabe',
        lifetimeProfit: 0,
        unlockedLocations: [...progression_1.STARTING_UNLOCKED_LOCATIONS],
        ownedStashHouses: [],
        purchasedInventoryUpgrades: [],
    };
}
function getReputationTier(reputation) {
    let tier = progression_1.REPUTATION_TIERS[0];
    for (const entry of progression_1.REPUTATION_TIERS) {
        if (reputation >= entry.minReputation) {
            tier = entry;
        }
    }
    return tier;
}
function rankIndex(rankId) {
    return progression_1.RANKS.findIndex((r) => r.id === rankId);
}
function meetsRequirements(req, stats) {
    if (req.reputation != null && stats.reputation < req.reputation)
        return false;
    if (req.netWorth != null && stats.netWorth < req.netWorth)
        return false;
    if (req.lifetimeProfit != null && stats.lifetimeProfit < req.lifetimeProfit) {
        return false;
    }
    if (req.daysSurvived != null && stats.daysSurvived < req.daysSurvived)
        return false;
    return true;
}
function computeRankId(player, progression, marketPrices) {
    const stats = {
        reputation: player.reputation,
        netWorth: (0, economy_1.getNetWorth)(player, marketPrices),
        lifetimeProfit: progression.lifetimeProfit,
        daysSurvived: player.day,
    };
    let best = 'wannabe';
    for (const rank of progression_1.RANKS) {
        if (meetsRequirements(rank.requirements, stats)) {
            best = rank.id;
        }
    }
    return best;
}
function getCurrentRank(state) {
    return progression_1.RANK_MAP[state.progression.rankId] ?? progression_1.RANK_MAP.wannabe;
}
function getNextRank(rankId) {
    const idx = rankIndex(rankId);
    if (idx < 0 || idx >= progression_1.RANKS.length - 1)
        return null;
    return progression_1.RANKS[idx + 1];
}
function getRankProgress(state) {
    const stats = {
        reputation: state.player.reputation,
        netWorth: (0, economy_1.getNetWorth)(state.player, state.marketPrices),
        lifetimeProfit: state.progression.lifetimeProfit,
        daysSurvived: state.player.day,
    };
    return {
        current: getCurrentRank(state),
        next: getNextRank(state.progression.rankId),
        stats,
    };
}
function meetsLocationUnlock(locationId, state) {
    if (progression_1.STARTING_UNLOCKED_LOCATIONS.includes(locationId)) {
        return true;
    }
    const req = progression_1.LOCATION_UNLOCK_REQUIREMENTS[locationId];
    if (!req)
        return true;
    const { player, progression, marketPrices } = state;
    const netWorth = (0, economy_1.getNetWorth)(player, marketPrices);
    const rankIdx = rankIndex(progression.rankId);
    const requiredRankIdx = req.rankId ? rankIndex(req.rankId) : -1;
    if (requiredRankIdx >= 0 && rankIdx >= requiredRankIdx)
        return true;
    if (req.reputation != null && player.reputation >= req.reputation)
        return true;
    if (req.cash != null && player.cash >= req.cash)
        return true;
    if (req.netWorth != null && netWorth >= req.netWorth)
        return true;
    if (req.daysSurvived != null && player.day >= req.daysSurvived)
        return true;
    return false;
}
function getLocationUnlockHint(locationId) {
    const req = progression_1.LOCATION_UNLOCK_REQUIREMENTS[locationId];
    if (!req)
        return 'Available';
    const parts = [];
    if (req.rankId)
        parts.push(`${progression_1.RANK_MAP[req.rankId]?.name ?? req.rankId} rank`);
    if (req.reputation != null)
        parts.push(`${req.reputation}+ rep`);
    if (req.cash != null)
        parts.push(`$${req.cash} cash`);
    if (req.netWorth != null)
        parts.push(`$${req.netWorth} net worth`);
    if (req.daysSurvived != null)
        parts.push(`day ${req.daysSurvived}+`);
    return `Unlock: ${parts.join(' · ')} (any)`;
}
function isLocationUnlocked(state, locationId) {
    return state.progression.unlockedLocations.includes(locationId);
}
function computeUnlockedLocations(state) {
    const unlocked = new Set([
        ...progression_1.STARTING_UNLOCKED_LOCATIONS,
        ...state.progression.unlockedLocations,
        state.player.currentLocation,
    ]);
    for (const location of locations_1.LOCATIONS) {
        if (meetsLocationUnlock(location.id, state)) {
            unlocked.add(location.id);
        }
    }
    return locations_1.LOCATIONS.filter((l) => unlocked.has(l.id)).map((l) => l.id);
}
function sanitizePurchasedUpgrades(purchased) {
    const valid = [];
    for (const upgrade of progression_1.INVENTORY_UPGRADES) {
        if (purchased.includes(upgrade.id)) {
            valid.push(upgrade.id);
        }
        else {
            break;
        }
    }
    return valid;
}
function computeInventoryCapacity(progression) {
    let capacity = progression_1.BASE_INVENTORY_CAPACITY;
    const upgrades = sanitizePurchasedUpgrades(progression.purchasedInventoryUpgrades);
    for (const upgradeId of upgrades) {
        capacity += progression_1.INVENTORY_UPGRADE_MAP[upgradeId]?.capacityBonus ?? 0;
    }
    const ownedStash = [...new Set(progression.ownedStashHouses)];
    for (const stashId of ownedStash) {
        capacity += progression_1.STASH_HOUSE_MAP[stashId]?.capacityBonus ?? 0;
    }
    return capacity;
}
function getExtraHeatDecayAtLocation(progression, locationId) {
    let bonus = 0;
    for (const stashId of progression.ownedStashHouses) {
        const stash = progression_1.STASH_HOUSE_MAP[stashId];
        if (stash?.locationId === locationId) {
            bonus += stash.extraHeatDecay;
        }
    }
    return bonus;
}
/** Robbery weight multiplier at player's current location (lower = safer). */
function getRobberyWeightMultiplier(state) {
    const locationId = state.player.currentLocation;
    let reduction = 0;
    for (const stashId of state.progression.ownedStashHouses) {
        const stash = progression_1.STASH_HOUSE_MAP[stashId];
        if (stash?.locationId === locationId) {
            reduction = Math.max(reduction, stash.robberyReduction);
        }
    }
    return Math.max(0.4, 1 - reduction);
}
function getNextInventoryUpgrade(progression) {
    const valid = sanitizePurchasedUpgrades(progression.purchasedInventoryUpgrades);
    if (valid.length >= progression_1.INVENTORY_UPGRADES.length) {
        return null;
    }
    return progression_1.INVENTORY_UPGRADES[valid.length] ?? null;
}
function syncProgression(state, options = {}) {
    const progression = state.progression ?? createInitialProgression();
    const previousRankId = progression.rankId;
    const rankId = computeRankId(state.player, progression, state.marketPrices);
    const syncedProgression = {
        ...progression,
        rankId,
        purchasedInventoryUpgrades: sanitizePurchasedUpgrades(progression.purchasedInventoryUpgrades),
        ownedStashHouses: [...new Set(progression.ownedStashHouses)],
    };
    const unlockedLocations = computeUnlockedLocations({
        ...state,
        progression: syncedProgression,
    });
    const inventoryCapacity = computeInventoryCapacity({
        ...syncedProgression,
        unlockedLocations,
    });
    let updated = {
        ...state,
        progression: {
            ...syncedProgression,
            unlockedLocations,
        },
        player: {
            ...state.player,
            inventoryCapacity,
        },
    };
    if (options.announceRankUp && rankId !== previousRankId && rankIndex(rankId) > rankIndex(previousRankId)) {
        const rank = progression_1.RANK_MAP[rankId];
        updated = (0, messages_1.withMessage)(updated, `RANK UP — You are now a ${rank.name}. ${rank.description}`);
    }
    return updated;
}
function applyProgressionAfterAction(state) {
    return syncProgression(state, { announceRankUp: true });
}
function addLifetimeProfit(state, profit) {
    if (profit <= 0)
        return state;
    return {
        ...state,
        progression: {
            ...state.progression,
            lifetimeProfit: state.progression.lifetimeProfit + profit,
        },
    };
}
function purchaseInventoryUpgrade(state) {
    const next = getNextInventoryUpgrade(state.progression);
    if (!next) {
        return (0, messages_1.withMessage)(state, 'All inventory upgrades purchased.');
    }
    if (state.player.cash < next.cost) {
        return (0, messages_1.withMessage)(state, `Need $${next.cost} for ${next.name}. You have $${state.player.cash}.`);
    }
    const cashAfter = Math.max(0, state.player.cash - next.cost);
    let updated = {
        ...state,
        player: {
            ...state.player,
            cash: cashAfter,
        },
        progression: {
            ...state.progression,
            purchasedInventoryUpgrades: [
                ...sanitizePurchasedUpgrades(state.progression.purchasedInventoryUpgrades),
                next.id,
            ],
        },
    };
    updated = applyProgressionAfterAction(updated);
    return (0, messages_1.withMessage)(updated, `Purchased ${next.name} (+${next.capacityBonus} stash). Capacity: ${updated.player.inventoryCapacity}.`);
}
function purchaseStashHouse(state, stashId) {
    const stash = progression_1.STASH_HOUSE_MAP[stashId];
    if (!stash) {
        return (0, messages_1.withMessage)(state, 'Unknown stash house.');
    }
    if (state.progression.ownedStashHouses.includes(stashId)) {
        return (0, messages_1.withMessage)(state, 'You already own this stash house.');
    }
    const ownsStashInDistrict = state.progression.ownedStashHouses.some((id) => progression_1.STASH_HOUSE_MAP[id]?.locationId === stash.locationId);
    if (ownsStashInDistrict) {
        const locName = locations_1.LOCATION_MAP[stash.locationId]?.name ?? stash.locationId;
        return (0, messages_1.withMessage)(state, `You already have a stash house in ${locName}.`);
    }
    if (!isLocationUnlocked(state, stash.locationId)) {
        const locName = locations_1.LOCATION_MAP[stash.locationId]?.name ?? stash.locationId;
        return (0, messages_1.withMessage)(state, `${locName} must be unlocked before buying a stash there.`);
    }
    if (state.player.cash < stash.cost) {
        return (0, messages_1.withMessage)(state, `Need $${stash.cost} for ${stash.name}. You have $${state.player.cash}.`);
    }
    const cashAfter = Math.max(0, state.player.cash - stash.cost);
    let updated = {
        ...state,
        player: {
            ...state.player,
            cash: cashAfter,
        },
        progression: {
            ...state.progression,
            ownedStashHouses: [...state.progression.ownedStashHouses, stashId],
        },
    };
    updated = applyProgressionAfterAction(updated);
    const locName = locations_1.LOCATION_MAP[stash.locationId]?.name ?? stash.locationId;
    return (0, messages_1.withMessage)(updated, `Bought ${stash.name} in ${locName} (+${stash.capacityBonus} stash, −${Math.round(stash.robberyReduction * 100)}% robbery risk there).`);
}
function formatNextRankRequirements(state) {
    const next = getNextRank(state.progression.rankId);
    if (!next)
        return ['Maximum rank reached.'];
    const { stats } = getRankProgress(state);
    const req = next.requirements;
    const lines = [];
    if (req.reputation != null) {
        lines.push(`Rep ${stats.reputation}/${req.reputation}`);
    }
    if (req.netWorth != null) {
        lines.push(`Net worth $${stats.netWorth}/$${req.netWorth}`);
    }
    if (req.lifetimeProfit != null) {
        lines.push(`Lifetime profit $${stats.lifetimeProfit}/$${req.lifetimeProfit}`);
    }
    if (req.daysSurvived != null) {
        lines.push(`Days ${stats.daysSurvived}/${req.daysSurvived}`);
    }
    return lines.length > 0 ? lines : ['Keep grinding.'];
}
function migrateLegacyProgression(raw, player, marketPrices, isLegacySave) {
    const defaults = createInitialProgression();
    if (!isRecord(raw)) {
        if (isLegacySave) {
            const legacy = {
                ...defaults,
                unlockedLocations: locations_1.LOCATIONS.map((l) => l.id),
            };
            legacy.rankId = computeRankId(player, legacy, marketPrices);
            return legacy;
        }
        return defaults;
    }
    const rankIdRaw = readString(raw.rankId, defaults.rankId);
    const rankId = progression_1.RANK_MAP[rankIdRaw] ? rankIdRaw : defaults.rankId;
    const unlockedRaw = Array.isArray(raw.unlockedLocations)
        ? raw.unlockedLocations.filter((id) => typeof id === 'string' && id in locations_1.LOCATION_MAP)
        : isLegacySave
            ? locations_1.LOCATIONS.map((l) => l.id)
            : [...progression_1.STARTING_UNLOCKED_LOCATIONS];
    const purchasedInventoryUpgrades = sanitizePurchasedUpgrades(Array.isArray(raw.purchasedInventoryUpgrades)
        ? raw.purchasedInventoryUpgrades.filter((id) => typeof id === 'string' && id in progression_1.INVENTORY_UPGRADE_MAP)
        : []);
    const ownedStashHouses = [
        ...new Set(Array.isArray(raw.ownedStashHouses)
            ? raw.ownedStashHouses.filter((id) => typeof id === 'string' && id in progression_1.STASH_HOUSE_MAP)
            : []),
    ];
    const progression = {
        rankId,
        lifetimeProfit: readNumber(raw.lifetimeProfit, defaults.lifetimeProfit, 0),
        unlockedLocations: unlockedRaw,
        ownedStashHouses,
        purchasedInventoryUpgrades,
    };
    if (!progression.unlockedLocations.includes(player.currentLocation)) {
        progression.unlockedLocations.push(player.currentLocation);
    }
    progression.rankId = computeRankId(player, progression, marketPrices);
    if (isLegacySave) {
        progression.unlockedLocations = locations_1.LOCATIONS.map((l) => l.id);
    }
    return progression;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function readString(value, fallback) {
    return typeof value === 'string' ? value : fallback;
}
function readNumber(value, fallback, min) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return fallback;
    return min != null ? Math.max(min, value) : value;
}
