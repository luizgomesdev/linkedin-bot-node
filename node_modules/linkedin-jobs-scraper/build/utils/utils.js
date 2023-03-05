"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = void 0;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve.bind(null, ms), ms));
exports.sleep = sleep;
