/**
 * Represents a HTTP error
 */
export declare class HTTPError extends Error {
    name: string;
    status: number;
    method: string;
    url: string;
    /**
     * @param message The error message
     * @param name The name of the error
     * @param status The status code of the response
     * @param method The method of the request that erred
     * @param url The url of the request that erred
     */
    constructor(message: string, name: string, status: number, method: string, url: string);
}
//# sourceMappingURL=HTTPError.d.ts.map