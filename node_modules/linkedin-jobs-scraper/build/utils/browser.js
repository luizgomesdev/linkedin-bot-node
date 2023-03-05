"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.killChromium = exports.getRandomUserAgent = void 0;
const child_process_1 = require("child_process");
const randomUserAgent = require("random-useragent");
const browsers = [
    {
        name: "Chrome",
        minVersion: 55
    },
    {
        name: "Firefox",
        minVersion: 50
    },
];
const folders = [
    "/Browsers - Linux",
    "/Browsers - Mac",
    // "Browsers - Windows",
];
const getRandomUserAgent = () => {
    return randomUserAgent.getRandom((ua) => {
        return folders.some(e => e === ua.folder) &&
            browsers.some(e => ua.browserName === e.name && parseInt(ua.browserMajor, 10) > e.minVersion);
    });
};
exports.getRandomUserAgent = getRandomUserAgent;
const killChromium = () => {
    return new Promise((resolve, reject) => {
        console.log("Killing Chromium processes");
        const cmd = "ps aux | grep -v grep | grep -i \"chromium\" | awk -F ' +' '{print $2}' | xargs kill -9 || :";
        (0, child_process_1.exec)(cmd, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return reject(err);
            }
            console.log(stdout);
            return resolve();
        });
    });
};
exports.killChromium = killChromium;
