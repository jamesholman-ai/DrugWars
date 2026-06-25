"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withMessage = withMessage;
exports.withMessages = withMessages;
const MAX_LOG = 14;
function withMessage(state, message) {
    return {
        ...state,
        lastMessage: message,
        messageLog: [message, ...state.messageLog].slice(0, MAX_LOG),
    };
}
function withMessages(state, messages) {
    const combined = messages[0];
    return {
        ...state,
        lastMessage: combined,
        messageLog: [...messages, ...state.messageLog].slice(0, MAX_LOG),
    };
}
