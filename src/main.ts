import fs from "fs/promises";
import { merge } from "lodash";
import puppeteer, {
  Browser,
  Page,
  Protocol,
  PuppeteerLaunchOptions,
} from "puppeteer";
import readline from "readline";
import { LI_AI_COOKIE_PATH, browserDefaults } from "./constants";
import LoggerService from "./utils/logger.util";
import LinkedInJobsService, { IQuery } from "./services/linked-in-job.service";
import { OnSiteOrRemoteFilterEnum } from "./enums/on-site-or-remote-filter.enum";
import { RelevanceFilterEnum } from "./enums/relevance-filter.enum";
import { TimeFilterEnum } from "./enums/time-filter.enum";

class LinkedInJobs {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  private readonly logger: LoggerService = new LoggerService("LinkedInJobs");

  private LI_AT_COOKIE: Protocol.Network.CookieParam | null = null;

  constructor() {
    this.logger.info("LinkedInJobs initialized!");
    this.logger.setLogLevel(4);
  }

  init = async (queries: IQuery[], options?: PuppeteerLaunchOptions) => {
    this.logger.info("Initializing browser.");

    const browserOptions = merge(browserDefaults, options);
    this.logger.debug("Browser options:", browserOptions);

    this.browser = await puppeteer.launch(browserOptions);
    this.logger.info("Browser initialized!");
    this.logger.debug("Browser version:", await this.browser.version());

    this.page = await this.browser.newPage();
    this.logger.info("Page initialized!");

    if (!this.page) {
      this.logger.error("Page is not initialized.");
      return;
    }

    try {
      const authCookie = await fs.readFile(LI_AI_COOKIE_PATH, "utf-8");
      this.LI_AT_COOKIE = JSON.parse(authCookie);
    } catch (error: any) {
      this.logger.warn(error);
    }

    this.LI_AT_COOKIE
      ? await this.authByCookie()
      : await this.authByCredentials();

    this.logger.info("Page is ready!");

    const linkedInJobsService = new LinkedInJobsService(this.page);

    await linkedInJobsService.init(queries);
  };

  close = async () => {
    if (!this.browser) {
      this.logger.warn("Browser is not initialized.");
      return;
    }
  };

  authByCookie = async () => {
    this.logger.info("Authenticating by cookie...");

    if (!this.LI_AT_COOKIE) {
      this.logger.error("LI_AT_COOKIE is not set.");
      return this.authByCredentials();
    }
    this.logger.info("LI_AT_COOKIE:", this.LI_AT_COOKIE);

    this.logger.info("Setting cookie...");
    await this.page?.setCookie(this.LI_AT_COOKIE);

    await this.page?.goto("https://www.linkedin.com");
  };

  authByCredentials = async () => {
    this.logger.info("Authenticating by credentials...");
    await this.page?.goto("https://www.linkedin.com");
    await this.login();
  };

  login = async () => {
    this.logger.info("Getting user credentials...");
    const { username, password } = await this.getUserCredentials();
    this.logger.info("Got user credentials. Logging in...");

    await this.page?.waitForSelector(".nav__button-secondary");
    await this.page?.click(".nav__button-secondary");

    await this.page?.waitForSelector("#username");
    await this.page?.waitForSelector("#password");

    await this.page?.type("#username", username);
    await this.page?.type("#password", password);

    await this.page?.click("button[type=submit]");

    await this.page?.waitForNavigation();

    const cookies = await this.page?.cookies();
    this.logger.info("Cookies:", cookies);

    const li_at_cookie = cookies?.find((cookie) => cookie.name === "li_at");

    if (!li_at_cookie) {
      this.logger.error("li_at cookie not found.");
      this.close();
    }

    this.logger.info("li_at cookie:", li_at_cookie);

    await fs.writeFile(LI_AI_COOKIE_PATH, JSON.stringify(li_at_cookie), {
      flag: "wx",
    });

    this.logger.info("Logged in!");
  };

  getUserCredentials = async () => {
    this.logger.info("Getting user credentials...");

    const username: string = await new Promise((resolve) => {
      this.rl.question("Username: ", (username) => {
        resolve(username);
      });
    });

    const password: string = await new Promise((resolve) => {
      this.rl.question("Password: ", (password) => {
        resolve(password);
      });
    });

    this.rl.close();

    return { username, password };
  };
}

const generateQueryWithLocation = (
  query: IQuery,
  location: string
): IQuery => ({
  ...query,
  options: {
    ...query.options,
    location,
  },
});

(async () => {
  const linkedInJobs = new LinkedInJobs();

  const query = {
    query: "Node",
    options: {
      locations: "",
      blackListCompanies: ["Toro"],
      filters: {
        onSiteOrRemote: OnSiteOrRemoteFilterEnum.REMOTE,
        relevance: RelevanceFilterEnum.RECENT,
        timeFilter: TimeFilterEnum.WEEK,
        simplifiedJob: true,
        descriptionKeywords: [
          "Node",
          "JavaScript",
          "TypeScript",
          "React",
          "NestJS",
          "NextJS",
          "GraphQL",
          "AWS",
        ],
      },
    },
  };

  const locations = [
    // "América do Norte",
    // "América Latina",
    // "Europa, Oriente Médio e África",
    "Toronto e Região, Canadá",
  ];

  const queries = locations.map((location) =>
    generateQueryWithLocation(query, location)
  );

  await linkedInJobs.init(queries, { headless: false });
})();
