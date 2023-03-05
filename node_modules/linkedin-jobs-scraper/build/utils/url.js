"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueryParams = void 0;
/**
 * Extract query params from url
 * @param {string} url
 * @returns { [key: string]: string }
 */
const getQueryParams = (url) => {
    const params = {};
    const parsed = new URL(url);
    const search = parsed.search.substr(1);
    const tokens = search.split("&");
    for (const t of tokens) {
        const [key, value] = t.split("=");
        params[key] = decodeURIComponent(value);
    }
    return params;
};
exports.getQueryParams = getQueryParams;
