interface DiscordErrorFieldInformation {
    code: string;
    message: string;
}
interface DiscordErrorGroupWrapper {
    _errors: DiscordError[];
}
declare type DiscordError = DiscordErrorGroupWrapper | DiscordErrorFieldInformation | {
    [k: string]: DiscordError;
} | string;
export interface DiscordErrorData {
    code: number;
    message: string;
    errors?: DiscordError;
}
/**
 * Represents an API error returned by Discord
 * @extends Error
 */
export declare class DiscordAPIError extends Error {
    rawError: DiscordErrorData;
    code: number;
    status: number;
    method: string;
    url: string;
    /**
     * @param rawError The error reported by Discord
     * @param code The error code reported by Discord
     * @param status The status code of the response
     * @param method The method of the request that erred
     * @param url The url of the request that erred
     */
    constructor(rawError: DiscordErrorData, code: number, status: number, method: string, url: string);
    /**
     * The name of the error
     */
    get name(): string;
    private static getMessage;
    private static flattenDiscordError;
}
export {};
//# sourceMappingURL=DiscordAPIError.d.ts.map