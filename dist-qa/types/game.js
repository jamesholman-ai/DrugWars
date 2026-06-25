"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultHeatCooldowns = createDefaultHeatCooldowns;
exports.createDefaultPlayerLegalFields = createDefaultPlayerLegalFields;
exports.createEmptyMemoryFlags = createEmptyMemoryFlags;
function createDefaultHeatCooldowns() {
    return {
        layLowUntilDay: 0,
        bribePoliceUntilDay: 0,
        informantProtectionUntilDay: 0,
        safehouseUsedUntilDay: 0,
    };
}
function createDefaultPlayerLegalFields() {
    return {
        legalStatus: 'clean',
        federalCaseSeverity: 0,
        daysInJail: 0,
        debtCollectorWarnings: 0,
    };
}
function createEmptyMemoryFlags() {
    return {
        helpedCop: false,
        snitchedOnRival: false,
        stiffedSupplier: false,
        paidCollector: false,
        soldToBuyer: false,
        bribedCop: false,
        ignoredInformant: false,
    };
}
