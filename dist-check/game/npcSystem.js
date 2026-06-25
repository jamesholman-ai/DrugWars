"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultRelation = createDefaultRelation;
exports.getNpcRelation = getNpcRelation;
exports.getRelationTier = getRelationTier;
exports.getTrustLabel = getTrustLabel;
exports.getNpcMemoryNotes = getNpcMemoryNotes;
exports.listNpcRelations = listNpcRelations;
exports.getNpcEventWeightMultiplier = getNpcEventWeightMultiplier;
exports.applyTrustDelta = applyTrustDelta;
const npcs_1 = require("../data/npcs");
function createDefaultRelation(npcId) {
    const def = npcs_1.NPC_MAP[npcId];
    return {
        attitude: def?.baseAttitude ?? 0,
        trust: 50,
        encounters: 0,
        lastSeenDay: 0,
    };
}
function getNpcRelation(state, npcId) {
    return state.npcRelations[npcId] ?? createDefaultRelation(npcId);
}
function getRelationTier(attitude) {
    if (attitude >= 50)
        return { label: 'ALLY', tone: 'ally' };
    if (attitude >= 15)
        return { label: 'NEUTRAL', tone: 'neutral' };
    if (attitude >= -20)
        return { label: 'WARY', tone: 'wary' };
    return { label: 'HOSTILE', tone: 'hostile' };
}
function getTrustLabel(trust) {
    if (trust >= 75)
        return 'High trust';
    if (trust >= 45)
        return 'Mixed trust';
    return 'Low trust';
}
/** Memory flags relevant to a given NPC archetype. */
function getNpcMemoryNotes(npcId, flags) {
    const notes = [];
    switch (npcId) {
        case 'vance':
            if (flags.bribedCop)
                notes.push('You bribed Vance before.');
            if (flags.helpedCop)
                notes.push('You cooperated with police.');
            break;
        case 'razor':
            if (flags.snitchedOnRival)
                notes.push('You snitched on Razor.');
            break;
        case 'mama_silk':
            if (flags.stiffedSupplier)
                notes.push('You stiffed Silk on a deal.');
            break;
        case 'bruno':
            if (flags.paidCollector)
                notes.push('You paid Bruno recently.');
            break;
        case 'chip':
            if (flags.soldToBuyer)
                notes.push('Chip bought from you before.');
            break;
        case 'whisper':
            if (flags.ignoredInformant)
                notes.push('You ignored Whisper\'s tips.');
            break;
        default:
            break;
    }
    return notes;
}
function listNpcRelations(state) {
    return npcs_1.NPCS.map((npc) => ({
        npcId: npc.id,
        name: npc.name,
        type: npc.type,
        ...getNpcRelation(state, npc.id),
    })).sort((a, b) => b.encounters - a.encounters || b.attitude - a.attitude);
}
/** Event weight multiplier based on NPC relationship (recurring characters). */
function getNpcEventWeightMultiplier(state, npcId) {
    const rel = getNpcRelation(state, npcId);
    let mult = 1;
    if (rel.encounters >= 3)
        mult += 0.15;
    if (rel.attitude >= 40)
        mult += 0.2;
    if (rel.attitude <= -30)
        mult += 0.25;
    if (rel.trust >= 70)
        mult += 0.1;
    if (rel.trust <= 25)
        mult += 0.15;
    return mult;
}
function applyTrustDelta(trust, delta) {
    return Math.min(100, Math.max(0, trust + delta));
}
