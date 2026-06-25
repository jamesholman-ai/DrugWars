"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNpcAttitude = getNpcAttitude;
exports.generateNpcDialogue = generateNpcDialogue;
exports.pickRandomNpcOfType = pickRandomNpcOfType;
const npcs_1 = require("../data/npcs");
const random_1 = require("../utils/random");
function pickFromPool(pool, random) {
    if (pool.length === 0)
        return '...';
    const idx = Math.floor(random() * pool.length);
    return pool[idx];
}
function getNpcAttitude(state, npcId, random = Math.random) {
    const npc = npcs_1.NPC_MAP[npcId];
    if (!npc)
        return 0;
    const relation = state.npcRelations[npcId];
    const baseAttitude = relation?.attitude ?? npc.baseAttitude;
    const trustBonus = Math.floor(((relation?.trust ?? 50) - 50) / 10);
    const repeatBonus = (relation?.encounters ?? 0) >= 3 ? 5 : 0;
    const repBonus = Math.floor((state.player.reputation - 50) / 10);
    const heatPenalty = state.player.heat > 60 ? -10 : 0;
    const debtPenalty = state.player.debt > 10000 ? -5 : 0;
    return baseAttitude + repBonus + heatPenalty + debtPenalty + trustBonus + repeatBonus;
}
function isMemoryHostile(state, npc) {
    const mem = state.memoryFlags;
    switch (npc.type) {
        case 'corrupt_cop':
            return mem.helpedCop === false && mem.bribedCop === false && state.player.heat > 50;
        case 'rival':
            return mem.snitchedOnRival;
        case 'supplier':
            return mem.stiffedSupplier;
        case 'debt_collector':
            return !mem.paidCollector && state.player.debt > 8000;
        case 'street_buyer':
            return !mem.soldToBuyer;
        case 'informant':
            return mem.ignoredInformant;
        default:
            return false;
    }
}
function generateNpcDialogue(state, npcId, random = Math.random) {
    const npc = npcs_1.NPC_MAP[npcId];
    if (!npc) {
        return { dialogue: '...', attitude: 0 };
    }
    const attitude = getNpcAttitude(state, npcId, random);
    const ctx = {
        reputation: state.player.reputation,
        heat: state.player.heat,
        debt: state.player.debt,
        attitude,
        memoryHostile: isMemoryHostile(state, npc),
    };
    let pool;
    if (ctx.memoryHostile || attitude < -20) {
        pool = npc.dialogueLines.hostile;
    }
    else if (attitude > 30) {
        pool = npc.dialogueLines.friendly;
    }
    else if (ctx.heat > 65) {
        pool = npc.dialogueLines.highHeat;
    }
    else if (ctx.debt > 12000) {
        pool = npc.dialogueLines.highDebt;
    }
    else if (ctx.reputation >= 55) {
        pool = npc.dialogueLines.highRep;
    }
    else if (ctx.reputation < 25) {
        pool = npc.dialogueLines.lowRep;
    }
    else {
        pool = [
            ...npc.dialogueLines.friendly,
            ...npc.dialogueLines.lowRep,
        ];
    }
    return {
        dialogue: pickFromPool(pool, random),
        attitude,
    };
}
function pickRandomNpcOfType(type, random = Math.random) {
    const matches = Object.values(npcs_1.NPC_MAP).filter((n) => n.type === type);
    return (0, random_1.pickRandom)(matches);
}
