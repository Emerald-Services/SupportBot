import { RequestInit } from 'node-fetch';
import type { RequestManager, RouteData } from '../RequestManager';
/**
 * The structure used to handle requests for a given bucket
 */
export declare class SequentialHandler {
    #private;
    private readonly manager;
    private readonly hash;
    private readonly majorParameter;
    /**
     * The unique ID of the handler
     */
    readonly id: string;
    /**
     * The time this rate limit bucket will reset
     */
    private reset;
    /**
     * The remaining requests that can be made before we are rate limited
     */
    private remaining;
    /**
     * The total number of requests that can be made before we are rate limited
     */
    private limit;
    /**
     * @param manager The request manager
     * @param hash The hash that this RequestHandler handles
     * @param majorParameter The major parameter for this handler
     */
    constructor(manager: RequestManager, hash: string, majorParameter: string);
    /**
     * If the bucket is currently inactive (no pending requests)
     */
    get inactive(): boolean;
    /**
     * If the rate limit bucket is currently limited
     */
    private get limited();
    /**
     * The time until queued requests can continue
     */
    private get timeToReset();
    /**
     * Emits a debug message
     * @param message The message to debug
     */
    private debug;
    /**
     * Queues a request to be sent
     * @param routeID The generalized api route with literal ids for major parameters
     * @param url The url to do the request on
     * @param options All the information needed to make a request
     */
    queueRequest(routeID: RouteData, url: string, options: RequestInit): Promise<unknown>;
    /**
     * The method that actually makes the request to the api, and updates info about the bucket accordingly
     * @param routeID The generalized api route with literal ids for major parameters
     * @param url The fully resolved url to make the request to
     * @param options The node-fetch options needed to make the request
     * @param retries The number of retries this request has already attempted (recursion)
     */
    private runRequest;
}
//# sourceMappingURL=SequentialHandler.d.ts.map