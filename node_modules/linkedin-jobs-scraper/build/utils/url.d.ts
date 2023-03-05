/**
 * Extract query params from url
 * @param {string} url
 * @returns { [key: string]: string }
 */
declare const getQueryParams: (url: string) => {
    [key: string]: string;
};
export { getQueryParams, };
