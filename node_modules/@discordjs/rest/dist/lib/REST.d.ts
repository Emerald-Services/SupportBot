/// <reference types="node" />
import { EventEmitter } from 'events';
import { CDN } from './CDN';
import { InternalRequest, RequestData, RequestManager, RouteLike } from './RequestManager';
/**
 * Options to be passed when creating the REST instance
 */
export interface RESTOptions {
    /**
     * The base api path, without version
     * @default 'https://discord.com/api'
     */
    api: string;
    /**
     * The cdn path
     * @default 'https://cdn.discordapp.com'
     */
    cdn: string;
    /**
     * The extra offset to add to rate limits in milliseconds
     * @default 50
     */
    offset: number;
    /**
     * The number of retries for errors with the 500 code, or errors
     * that timeout
     * @default 3
     */
    retries: number;
    /**
     * The time to wait in milliseconds before a request is aborted
     * @default 15_000
     */
    timeout: number;
    /**
     * Extra information to add to the user agent
     * @default `Node.js ${process.version}`
     */
    userAgentAppendix: string;
    /**
     * The version of the API to use
     * @default '8'
     */
    version: string;
}
/**
 * Data emitted on `RESTEvents.Debug`
 */
export interface RatelimitData {
    /**
     * The time, in milliseconds, until the request-lock is reset
     */
    timeToReset: number;
    /**
     * The amount of requests we can perform before locking requests
     */
    limit: number;
    /**
     * The HTTP method being performed
     */
    method: string;
    /**
     * The bucket hash for this request
     */
    hash: string;
    /**
     * The route being hit in this request
     */
    route: string;
    /**
     * The major parameter of the route
     *
     * For example, in `/channels/x`, this will be `x`.
     * If there is no major parameter (e.g: `/bot/gateway`) this will be `global`.
     */
    majorParameter: string;
}
interface RestEvents {
    restDebug: [info: string];
    rateLimited: [rateLimitInfo: RatelimitData];
}
export interface REST {
    on<K extends keyof RestEvents>(event: K, listener: (...args: RestEvents[K]) => void): this;
    on<S extends string | symbol>(event: Exclude<S, keyof RestEvents>, listener: (...args: any[]) => void): this;
    once<K extends keyof RestEvents>(event: K, listener: (...args: RestEvents[K]) => void): this;
    once<S extends string | symbol>(event: Exclude<S, keyof RestEvents>, listener: (...args: any[]) => void): this;
    emit<K extends keyof RestEvents>(event: K, ...args: RestEvents[K]): boolean;
    emit<S extends string | symbol>(event: Exclude<S, keyof RestEvents>, ...args: any[]): boolean;
    off<K extends keyof RestEvents>(event: K, listener: (...args: RestEvents[K]) => void): this;
    off<S extends string | symbol>(event: Exclude<S, keyof RestEvents>, listener: (...args: any[]) => void): this;
    removeAllListeners<K extends keyof RestEvents>(event?: K): this;
    removeAllListeners<S extends string | symbol>(event?: Exclude<S, keyof RestEvents>): this;
}
export declare class REST extends EventEmitter {
    readonly cdn: CDN;
    readonly requestManager: RequestManager;
    constructor(options?: Partial<RESTOptions>);
    /**
     * Sets the authorization token that should be used for requests
     * @param token The authorization token to use
     */
    setToken(token: string): this;
    /**
     * Runs a get request from the api
     * @param fullRoute The full route to query
     * @param options Optional request options
     */
    get(fullRoute: RouteLike, options?: RequestData): Promise<unknown>;
    /**
     * Runs a delete request from the api
     * @param fullRoute The full route to query
     * @param options Optional request options
     */
    delete(fullRoute: RouteLike, options?: RequestData): Promise<unknown>;
    /**
     * Runs a post request from the api
     * @param fullRoute The full route to query
     * @param options Optional request options
     */
    post(fullRoute: RouteLike, options?: RequestData): Promise<unknown>;
    /**
     * Runs a put request from the api
     * @param fullRoute The full route to query
     * @param options Optional request options
     */
    put(fullRoute: RouteLike, options?: RequestData): Promise<unknown>;
    /**
     * Runs a patch request from the api
     * @param fullRoute The full route to query
     * @param options Optional request options
     */
    patch(fullRoute: RouteLike, options?: RequestData): Promise<unknown>;
    /**
     * Runs a request from the api
     * @param options Request options
     */
    request(options: InternalRequest): Promise<unknown>;
}
export {};
//# sourceMappingURL=REST.d.ts.map