"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeString = void 0;
const normalizeString = (s) => {
    return s.replace(/[\n\r\t ]+/g, ' ').trim();
};
exports.normalizeString = normalizeString;
