import { ElementHandle, Page } from "puppeteer";
import LoggerService from "../utils/logger.util";
import { RelevanceFilterEnum } from "../enums/relevance-filter.enum";
import { OnSiteOrRemoteFilterEnum } from "../enums/on-site-or-remote-filter.enum";
import { TimeFilterEnum } from "../enums/time-filter.enum";
import { delay } from "../utils/delay.util";
import fs from "fs/promises";
import { APPLIED_JOBS_PATH } from "../constants";

export interface IQueryOptions {
  location?: string;
  limit?: number;
  maxPages?: number;
  filters?: {
    relevance?: RelevanceFilterEnum;
    onSiteOrRemote?: OnSiteOrRemoteFilterEnum | OnSiteOrRemoteFilterEnum[];
    timeFilter?: TimeFilterEnum;
    simplifiedJob?: boolean;
    descriptionKeywords?: string[];
  };
  descriptionFn?: () => string;
  optimize?: boolean;
  applyLink?: boolean;
  skipPromotedJobs?: boolean;
  blackListCompanies?: string[];
}

export interface IQuery {
  query?: string;
  options?: IQueryOptions;
}

export interface IApplyForJobOptions {
  blackListCompanies?: string[];
  descriptionKeywords?: string[];
}

export const selectors = {
  container: ".jobs-search-results-list",
  jobs: "div.job-card-container",
  details: ".jobs-details__main-content",
  detailsDescription: ".jobs-description",
  detailsTitle: ".jobs-unified-top-card__job-title",
  detailsCompany: ".jobs-unified-top-card__company-name",
  jobApply: ".jobs-apply-button",
  jobApllyButton: ".artdeco-button.artdeco-button--primary",
  jobsResumeItem: ".jobs-resume-picker__resume",
  jobApplyClose: ".artdeco-modal__dismiss",
  jobApplyPorcentBar: ".artdeco-completeness-meter-linear__progress-element",
  confirmCancelApplyButton:
    ".artdeco-modal__confirm-dialog-btn.artdeco-button--secondary",
  paginationNextBtn: "li[data-test-pagination-page-btn].selected + li",
};

interface IAppliedJob {
  title: string;
  company: string;
  appliedSuccessfully: boolean;
}

class LinkedInJobsService {
  private readonly logger: LoggerService = new LoggerService(
    LinkedInJobsService.name
  );

  private page: Page | null = null;
  private appliedJobs: IAppliedJob[] = [];

  constructor(page: Page) {
    this.page = page;
    this.logger.setLogLevel(4);
  }

  public init = async (queries: IQuery[]) => {
    const appliedJobs = await fs.readFile(APPLIED_JOBS_PATH, "utf8");
    this.appliedJobs = JSON.parse(appliedJobs);

    // next page
    let nextPageBtn;
    let page = 1;
    do {
      await this.getJobs(queries);

      try {
        this.logger.info(`Trying to go to next page.`);
        nextPageBtn = await this.page?.$(selectors.paginationNextBtn);
        if (nextPageBtn) {
          this.logger.info(`Next page button found. Going to page ${page + 1}`);
          page++;
          await nextPageBtn.click();
          await this.page?.waitForSelector(selectors.container);
        }
      } catch (error) {
        this.logger.error("Error while trying to go to next page.");
        break;
      }
    } while (nextPageBtn && page < 5);
  };

  private getJobs = async (queries: IQuery[]) => {
    if (!Array.isArray(queries)) {
      queries = [queries];
    }

    this.logger.info(`Opening ${queries.length} queries.`);
    for (const query of queries) {
      try {
        const url = this.buildUrl(query.query, query.options);
        this.logger.info(`Opening ${url}`);
        this.page?.goto(url);

        await this.page?.waitForSelector(selectors.container);

        const jobsContainer = await this.page?.$(selectors.container);
        await jobsContainer?.evaluate((container) => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        });

        const jobs = await this.loadJobs();

        if (!jobs) {
          this.logger.warn("No jobs found.");
          return;
        }

        const blackListCompanies = query.options?.blackListCompanies || [];
        const descriptionKeywords = query.options?.filters?.descriptionKeywords;
        for (const job of jobs) {
          try {
            await this.applyForJob(job, {
              blackListCompanies,
              descriptionKeywords,
            });
          } catch (error) {
            this.logger.error("Error on apply for job", error);
            this.closeApply(true);
          }
        }
      } catch (error: any) {
        this.logger.error(`Error on query ${query.query}`, error);
      }
    }
  };

  private buildUrl = (query?: string, options?: IQueryOptions) => {
    const url = new URL("https://www.linkedin.com/jobs/search/");

    if (query) {
      url.searchParams.set("keywords", query);
    }

    if (options?.location) {
      url.searchParams.set("location", options.location);
    }

    if (options?.filters?.relevance) {
      url.searchParams.set("sortBy", options.filters.relevance);
    }

    if (options?.filters?.timeFilter) {
      url.searchParams.set("f_TPR", options.filters.timeFilter);
    }

    if (options?.filters?.onSiteOrRemote) {
      const onSiteOrRemoteFilter = Array.isArray(options.filters.onSiteOrRemote)
        ? options.filters.onSiteOrRemote.join(",")
        : options.filters.onSiteOrRemote;

      url.searchParams.set("f_WT", onSiteOrRemoteFilter);
    }

    if (options?.filters?.simplifiedJob) {
      url.searchParams.set("f_AL", "true");
    }

    return url.toString();
  };

  private loadJobs = async () => {
    const jobs = await this.page?.$$(selectors.jobs);
    this.logger.info(`Found ${jobs?.length} jobs.`);
    return jobs;
  };

  private loadJobDetails = async () => {
    this.logger.info("Loading job details.");

    await this.page?.waitForSelector(selectors.details);

    const details = await this.page?.evaluate(
      (titleSelector, companySelector, descriptionSelector) => {
        const title = document.querySelector(titleSelector);
        const company = document.querySelector(companySelector);
        const description = document.querySelector(descriptionSelector);

        return {
          title: title?.textContent?.replace(/\s+/g, " ").trim(),
          company: company?.textContent?.replace(/\s+/g, " ").trim(),
          description: description?.textContent?.replace(/\s+/g, " ").trim(),
        };
      },
      selectors.detailsTitle,
      selectors.detailsCompany,
      selectors.detailsDescription
    );

    this.logger.debug("Job details loaded.", details);

    return details;
  };

  private applyForJob = async (
    job: ElementHandle<Element>,
    options?: IApplyForJobOptions
  ) => {
    //@ts-ignore
    await job.evaluate((job) => job.click());

    const jobDetails = await this.loadJobDetails();

    if (!jobDetails) {
      this.logger.warn("No job details found.");
      return;
    }

    if (
      !jobDetails?.title ||
      !jobDetails?.company ||
      !jobDetails?.description
    ) {
      this.logger.warn("Job title or company not found.");
      return;
    }

    if (this.appliedJobs.length > 0) {
      const appliedJob = this.appliedJobs.find(
        (appliedJob) =>
          appliedJob.title === jobDetails.title &&
          appliedJob.company === jobDetails.company
      );

      if (appliedJob) {
        this.logger.warn(
          `Job already applied: ${jobDetails?.title} with appliedSuccessfully: ${appliedJob?.appliedSuccessfully}`
        );
        return;
      }
    }

    if (
      jobDetails?.company &&
      options?.blackListCompanies?.includes(jobDetails?.company)
    ) {
      this.logger.warn(`Job from blacklisted company: ${jobDetails?.company}`);
      return;
    }

    if (
      jobDetails?.description &&
      options?.descriptionKeywords &&
      !options?.descriptionKeywords.some((keyword) =>
        jobDetails?.description
          ?.toLocaleLowerCase()
          .includes(keyword.toLocaleLowerCase())
      )
    ) {
      this.logger.warn(
        `Job description does not contain any of the keywords: ${options?.descriptionKeywords.join(
          ", "
        )}`
      );
      return;
    }

    try {
      await this.page?.click(selectors.jobApply);
    } catch (error) {
      this.logger.warn("Job already applied.");
      return;
    }

    this.logger.info(`Applying for job: ${jobDetails?.title}`);
    await this.page?.waitForSelector(selectors.jobApllyButton);
    await this.page?.click(selectors.jobApllyButton);

    const porcentBar = await this.page?.waitForSelector(
      selectors.jobApplyPorcentBar
    );

    const porcentValue = await porcentBar?.evaluate(
      (porcentBar) => porcentBar.ariaValueNow
    );

    if (porcentValue) {
      const value = parseInt(porcentValue);
      if (value === 0) {
        this.writeAppliedJobs({
          title: jobDetails?.title,
          company: jobDetails?.company,
          appliedSuccessfully: false,
        });
        this.logger.warn("Progress bar is 0%, job not applied.");
        this.closeApply(true);
        return;
      }
    }

    try {
      this.logger.info("Selecting resume.");
      await this.page?.waitForSelector(selectors.jobsResumeItem);
      await this.page?.click(`${selectors.jobsResumeItem} button`);
      await this.page?.click(selectors.jobApllyButton);
    } catch (error) {
      this.logger.warn("No resume found.");
      this.writeAppliedJobs({
        title: jobDetails?.title,
        company: jobDetails?.company,
        appliedSuccessfully: false,
      });

      this.closeApply(true);
    }

    let porcentNumber: number = 0;
    do {
      const porcentBar = await this.page?.waitForSelector(
        selectors.jobApplyPorcentBar
      );

      this.logger.debug("porcentBar: ", porcentBar);
      const porcentValue = await porcentBar?.evaluate(
        (porcentBar) => porcentBar.ariaValueNow
      );

      this.logger.debug("porcentValue: ", porcentValue);

      if (porcentValue) {
        const value = parseInt(porcentValue);

        this.logger.debug("value: ", value);
        this.logger.debug("porcentValue: ", porcentValue);

        if (value != 0 && value === porcentNumber) {
          this.logger.error(`Failed to apply for job: ${jobDetails?.title}`);
          this.writeAppliedJobs({
            title: jobDetails.title,
            company: jobDetails.company,
            appliedSuccessfully: false,
          });

          this.logger.info("Closing job because progress is stuck.");
          await this.closeApply(true);
          break;
        }

        porcentNumber = parseInt(porcentValue);
      }

      // Infinite condition
      await this.page?.waitForSelector(selectors.jobApllyButton);
      await this.page?.click(selectors.jobApllyButton);
    } while (porcentNumber < 100);

    if (porcentNumber === 100) {
      this.logger.info(
        `Applied for job: ${jobDetails?.title}, company: ${jobDetails?.company}`
      );

      this.writeAppliedJobs({
        title: jobDetails.title,
        company: jobDetails.company,
        appliedSuccessfully: true,
      });

      this.logger.info("Closing job apply.");
      await this.closeApply();
    }
  };

  private closeApply = async (confirm?: boolean) => {
    await this.page?.waitForSelector(selectors.jobApplyClose);
    await this.page?.click(selectors.jobApplyClose);

    if (confirm) {
      await this.page?.waitForSelector(selectors.confirmCancelApplyButton);
      await this.page?.click(selectors.confirmCancelApplyButton);
    }
  };

  private writeAppliedJobs = async (appliedJob: IAppliedJob) => {
    this.appliedJobs.push(appliedJob);
    await fs.writeFile(APPLIED_JOBS_PATH, JSON.stringify(this.appliedJobs));
  };
}

export default LinkedInJobsService;
