/// <reference types="node" />
import Collection from '@discordjs/collection';
import { EventEmitter } from 'events';
import type { IHandler } from './handlers/IHandler';
import type { RESTOptions } from './REST';
/**
 * Represents an attachment to be added to the request
 */
export interface RawAttachment {
    fileName: string;
    rawBuffer: Buffer;
}
/**
 * Represents possible data to be given to an endpoint
 */
export interface RequestData {
    /**
     * Files to be attached to this request
     */
    attachments?: RawAttachment[];
    /**
     * If this request needs the `Authorization` header
     * @default true
     */
    auth?: boolean;
    /**
     * The authorization prefix to use for this request, useful if you use this with bearer tokens
     * @default 'Bot'
     */
    authPrefix?: 'Bot' | 'Bearer';
    /**
     * The body to send to this request
     */
    body?: unknown;
    /**
     * Additional headers to add to this request
     */
    headers?: Record<string, string>;
    /**
     * Query string parameters to append to the called endpoint
     */
    query?: URLSearchParams;
    /**
     * Reason to show in the audit logs
     */
    reason?: string;
    /**
     * If this request should be versioned
     * @default true
     */
    versioned?: boolean;
}
/**
 * Possible headers for an API call
 */
export interface RequestHeaders {
    Authorization?: string;
    'User-Agent': string;
    'X-Audit-Log-Reason'?: string;
}
/**
 * Possible API methods to be used when doing requests
 */
export declare const enum RequestMethod {
    Delete = "delete",
    Get = "get",
    Patch = "patch",
    Post = "post",
    Put = "put"
}
export declare type RouteLike = `/${string}`;
/**
 * Internal request options
 *
 * @internal
 */
export interface InternalRequest extends RequestData {
    method: RequestMethod;
    fullRoute: RouteLike;
}
/**
 * Parsed route data for an endpoint
 *
 * @internal
 */
export interface RouteData {
    majorParameter: string;
    bucketRoute: string;
    original: string;
}
/**
 * Represents the class that manages handlers for endpoints
 */
export declare class RequestManager extends EventEmitter {
    #private;
    /**
     * A timeout promise that is set when we hit the global rate limit
     * @default null
     */
    globalTimeout: Promise<void> | null;
    /**
     * API bucket hashes that are cached from provided routes
     */
    readonly hashes: Collection<string, string>;
    /**
     * Request handlers created from the bucket hash and the major parameters
     */
    readonly handlers: Collection<string, IHandler>;
    readonly options: RESTOptions;
    constructor(options: Partial<RESTOptions>);
    /**
     * Sets the authorization token that should be used for requests
     * @param token The authorization token to use
     */
    setToken(token: string): this;
    /**
     * Queues a request to be sent
     * @param request All the information needed to make a request
     * @returns The response from the api request
     */
    queueRequest(request: InternalRequest): Promise<unknown>;
    /**
     * Creates a new rate limit handler from a hash, based on the hash and the major parameter
     * @param hash The hash for the route
     * @param majorParameter The major parameter for this handler
     * @private
     */
    private createHandler;
    /**
     * Formats the request data to a usable format for fetch
     * @param request The request data
     */
    private resolveRequest;
    /**
     * Generates route data for an endpoint:method
     * @param endpoint The raw endpoint to generalize
     * @param method The HTTP method this endpoint is called without
     * @private
     */
    private static generateRouteData;
}
//# sourceMappingURL=RequestManager.d.ts.map