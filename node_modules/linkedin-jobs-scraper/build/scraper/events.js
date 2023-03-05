"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.events = void 0;
const events = {
    scraper: {
        data: "scraper:data",
        error: "scraper:error",
        metrics: "scraper:metrics",
        invalidSession: "scraper:invalid-session",
        end: "scraper:end",
    },
    puppeteer: {
        browser: {
            disconnected: "disconnected",
            targetchanged: "targetchanged",
            targetcreated: "targetcreated",
            targetdestroyed: "targetdestroyed",
        },
    },
};
exports.events = events;
