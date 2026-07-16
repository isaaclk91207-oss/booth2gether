"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROOM_CODE_CHARS = exports.ROOM_CODE_LENGTH = exports.DISCONNECT_TIMEOUT_SECONDS = exports.TOTAL_SHOTS = exports.SHOT_INTERVAL_MS = exports.COUNTDOWN_DURATION = exports.ROOM_MAX_USERS = exports.USER_ROLES = exports.ROOM_STATES = void 0;
exports.ROOM_STATES = {
    WAITING: 'WAITING',
    JOINED: 'JOINED',
    READY: 'READY',
    SHOOTING: 'SHOOTING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    CLOSED: 'CLOSED',
};
exports.USER_ROLES = {
    HOST: 'HOST',
    GUEST: 'GUEST',
};
exports.ROOM_MAX_USERS = 2;
exports.COUNTDOWN_DURATION = 3;
exports.SHOT_INTERVAL_MS = 2000;
exports.TOTAL_SHOTS = 4;
exports.DISCONNECT_TIMEOUT_SECONDS = 30;
exports.ROOM_CODE_LENGTH = 6;
exports.ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
//# sourceMappingURL=index.js.map