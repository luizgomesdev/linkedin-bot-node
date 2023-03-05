"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scraper = void 0;
const events_1 = require("events");
const logger_1 = require("../logger/logger");
class Scraper extends events_1.EventEmitter {
    /**
     * @constructor
     * @param {LaunchOptions} options
     */
    constructor(options) {
        super();
        this.options = options;
    }
}
exports.Scraper = Scraper;
/**
 * Enable logger
 * @returns void
 * @static
 */
Scraper.enableLogger = () => logger_1.logger.enable();
/**
 * Disable logger
 * @returns void
 * @static
 */
Scraper.disableLogger = () => logger_1.logger.disable();
/**
 * Enable logger debug namespace
 * @returns void
 * @static
 */
Scraper.enableLoggerDebug = () => logger_1.logger.enableDebug();
/**
 * Enable logger info namespace
 * @returns void
 * @static
 */
Scraper.enableLoggerInfo = () => logger_1.logger.enableInfo();
/**
 * Enable logger warn namespace
 * @returns void
 * @static
 */
Scraper.enableLoggerWarn = () => logger_1.logger.enableWarn();
/**
 * Enable logger error namespace
 * @returns void
 * @static
 */
Scraper.enableLoggerError = () => logger_1.logger.enableError();
