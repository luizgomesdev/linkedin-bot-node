"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const debug_1 = __importDefault(require("debug"));
const namespace = "scraper";
const namespaces = {
    DEBUG: `${namespace}:debug`,
    INFO: `${namespace}:info`,
    WARN: `${namespace}:warn`,
    ERROR: `${namespace}:error`,
};
const logger = {
    debug: (0, debug_1.default)(namespaces.DEBUG),
    info: (0, debug_1.default)(namespaces.INFO),
    warn: (0, debug_1.default)(namespaces.WARN),
    error: (0, debug_1.default)(namespaces.ERROR),
    enable: () => {
        debug_1.default.enable(`${namespace}:*`);
    },
    disable: () => {
        debug_1.default.disable();
    },
    enableDebug: () => {
        debug_1.default.enable(`${namespace}:*`);
    },
    enableInfo: () => {
        debug_1.default.enable(`${namespaces.INFO},${namespaces.WARN},${namespaces.ERROR}`);
    },
    enableWarn: () => {
        debug_1.default.enable(`${namespaces.WARN},${namespaces.ERROR}`);
    },
    enableError: () => {
        debug_1.default.enable(namespaces.ERROR);
    },
};
exports.logger = logger;
// Bind INFO to console (default is stderr)
logger.info.log = console.log.bind(console);
if (!process.env.DEBUG) {
    logger.enableInfo();
}
