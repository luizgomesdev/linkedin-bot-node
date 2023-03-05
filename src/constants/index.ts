import path from "path";
import { PuppeteerLaunchOptions } from "puppeteer";
import { IQueryOptions } from "../services/linked-in-job.service";

const defaultWidth = 1366;
const defaultHeight = 768;

export const browserDefaults: PuppeteerLaunchOptions = {
  executablePath: "google-chrome",
  headless: true,
  args: [
    "--enable-automation",
    "--start-maximized",
    `--window-size=${defaultWidth},${defaultHeight}`,
    // "--single-process",
    "--lang=en-GB",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-accelerated-2d-canvas",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--proxy-server='direct://",
    "--proxy-bypass-list=*",
    "--allow-running-insecure-content",
    "--disable-web-security",
    "--disable-client-side-phishing-detection",
    "--disable-notifications",
    "--mute-audio",
  ],
  // @ts-ignore
  defaultViewport: null,
  pipe: true,
  slowMo: 300
};

export const INPUT_DELAY = 50;
export const TMP_DIR = path.join(__dirname, "..", "..", "tmp");
export const LI_AI_COOKIE_PATH = path.join(TMP_DIR, "li_at_cookie.json");
export const APPLIED_JOBS_PATH = path.join(TMP_DIR, "applied_jobs.json");