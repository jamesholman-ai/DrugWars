"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildNpcBlock = buildNpcBlock;
exports.attachNpcDialogue = attachNpcDialogue;
const npcDialogue_1 = require("./npcDialogue");
const npcs_1 = require("../data/npcs");
function buildNpcBlock(state, npcId, random) {
    const def = npcs_1.NPC_MAP[npcId];
    const { dialogue, attitude } = (0, npcDialogue_1.generateNpcDialogue)(state, npcId, random);
    return {
        id: npcId,
        name: def?.name ?? npcId,
        type: def?.type ?? 'informant',
        dialogue,
        attitude,
    };
}
function attachNpcDialogue(state, npcId, random) {
    return (0, npcDialogue_1.generateNpcDialogue)(state, npcId, random).dialogue;
}
