"use strict";
var _SequentialHandler_asyncQueue;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequentialHandler = void 0;
const tslib_1 = require("tslib");
const promises_1 = require("timers/promises");
const async_queue_1 = require("@sapphire/async-queue");
const abort_controller_1 = tslib_1.__importDefault(require("abort-controller"));
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
const DiscordAPIError_1 = require("../errors/DiscordAPIError");
const HTTPError_1 = require("../errors/HTTPError");
require("../utils/constants");
const utils_1 = require("../utils/utils");
/**
 * The structure used to handle requests for a given bucket
 */
class SequentialHandler {
    /**
     * @param manager The request manager
     * @param hash The hash that this RequestHandler handles
     * @param majorParameter The major parameter for this handler
     */
    constructor(manager, hash, majorParameter) {
        this.manager = manager;
        this.hash = hash;
        this.majorParameter = majorParameter;
        /**
         * The time this rate limit bucket will reset
         */
        this.reset = -1;
        /**
         * The remaining requests that can be made before we are rate limited
         */
        this.remaining = 1;
        /**
         * The total number of requests that can be made before we are rate limited
         */
        this.limit = Infinity;
        /**
         * The interface used to sequence async requests sequentially
         */
        // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
        _SequentialHandler_asyncQueue.set(this, new async_queue_1.AsyncQueue());
        this.id = `${hash}:${majorParameter}`;
    }
    /**
     * If the bucket is currently inactive (no pending requests)
     */
    get inactive() {
        return tslib_1.__classPrivateFieldGet(this, _SequentialHandler_asyncQueue, "f").remaining === 0 && !this.limited;
    }
    /**
     * If the rate limit bucket is currently limited
     */
    get limited() {
        return this.remaining <= 0 && Date.now() < this.reset;
    }
    /**
     * The time until queued requests can continue
     */
    get timeToReset() {
        return this.reset - Date.now();
    }
    /**
     * Emits a debug message
     * @param message The message to debug
     */
    debug(message) {
        this.manager.emit("restDebug" /* Debug */, `[REST ${this.id}] ${message}`);
    }
    /**
     * Queues a request to be sent
     * @param routeID The generalized api route with literal ids for major parameters
     * @param url The url to do the request on
     * @param options All the information needed to make a request
     */
    async queueRequest(routeID, url, options) {
        // Wait for any previous requests to be completed before this one is run
        await tslib_1.__classPrivateFieldGet(this, _SequentialHandler_asyncQueue, "f").wait();
        try {
            // Wait for any global rate limits to pass before continuing to process requests
            await this.manager.globalTimeout;
            // Check if this request handler is currently rate limited
            if (this.limited) {
                // Let library users know they have hit a rate limit
                this.manager.emit("rateLimited" /* RateLimited */, {
                    timeToReset: this.timeToReset,
                    limit: this.limit,
                    method: options.method,
                    hash: this.hash,
                    route: routeID.bucketRoute,
                    majorParameter: this.majorParameter,
                });
                this.debug(`Waiting ${this.timeToReset}ms for rate limit to pass`);
                // Wait the remaining time left before the rate limit resets
                await promises_1.setTimeout(this.timeToReset);
            }
            // Make the request, and return the results
            return await this.runRequest(routeID, url, options);
        }
        finally {
            // Allow the next request to fire
            tslib_1.__classPrivateFieldGet(this, _SequentialHandler_asyncQueue, "f").shift();
        }
    }
    /**
     * The method that actually makes the request to the api, and updates info about the bucket accordingly
     * @param routeID The generalized api route with literal ids for major parameters
     * @param url The fully resolved url to make the request to
     * @param options The node-fetch options needed to make the request
     * @param retries The number of retries this request has already attempted (recursion)
     */
    async runRequest(routeID, url, options, retries = 0) {
        const controller = new abort_controller_1.default();
        const timeout = setTimeout(() => controller.abort(), this.manager.options.timeout);
        let res;
        try {
            res = await node_fetch_1.default(url, { ...options, signal: controller.signal });
        }
        catch (error) {
            const err = error;
            // Retry the specified number of times for possible timed out requests
            if (err.name === 'AbortError' && retries !== this.manager.options.retries) {
                return this.runRequest(routeID, url, options, ++retries);
            }
            throw err;
        }
        finally {
            clearTimeout(timeout);
        }
        let retryAfter = 0;
        const method = options.method ?? 'get';
        const limit = res.headers.get('X-RateLimit-Limit');
        const remaining = res.headers.get('X-RateLimit-Remaining');
        const reset = res.headers.get('X-RateLimit-Reset-After');
        const hash = res.headers.get('X-RateLimit-Bucket');
        const retry = res.headers.get('Retry-After');
        // Update the total number of requests that can be made before the rate limit resets
        this.limit = limit ? Number(limit) : Infinity;
        // Update the number of remaining requests that can be made before the rate limit resets
        this.remaining = remaining ? Number(remaining) : 1;
        // Update the time when this rate limit resets (reset-after is in seconds)
        this.reset = reset ? Number(reset) * 1000 + Date.now() + this.manager.options.offset : Date.now();
        // Amount of time in milliseconds until we should retry if rate limited (globally or otherwise)
        if (retry)
            retryAfter = Number(retry) * 1000 + this.manager.options.offset;
        // Handle buckets via the hash header retroactively
        if (hash && hash !== this.hash) {
            // Let library users know when rate limit buckets have been updated
            this.debug(['Received bucket hash update', `  Old Hash  : ${this.hash}`, `  New Hash  : ${hash}`].join('\n'));
            // This queue will eventually be eliminated via attrition
            this.manager.hashes.set(`${method}:${routeID.bucketRoute}`, hash);
        }
        // Handle global rate limit
        if (res.headers.get('X-RateLimit-Global')) {
            this.debug(`We are globally rate limited, blocking all requests for ${retryAfter}ms`);
            // Set the manager's global timeout as the promise for other requests to "wait"
            this.manager.globalTimeout = promises_1.setTimeout(retryAfter).then(() => {
                // After the timer is up, clear the promise
                this.manager.globalTimeout = null;
            });
        }
        if (res.ok) {
            return utils_1.parseResponse(res);
        }
        else if (res.status === 429) {
            // A rate limit was hit - this may happen if the route isn't associated with an official bucket hash yet, or when first globally rate limited
            this.debug([
                'Encountered unexpected 429 rate limit',
                `  Bucket         : ${routeID.bucketRoute}`,
                `  Major parameter: ${routeID.majorParameter}`,
                `  Hash           : ${this.hash}`,
                `  Retry After    : ${retryAfter}ms`,
            ].join('\n'));
            // Wait the retryAfter amount of time before retrying the request
            await promises_1.setTimeout(retryAfter);
            // Since this is not a server side issue, the next request should pass, so we don't bump the retries counter
            return this.runRequest(routeID, url, options, retries);
        }
        else if (res.status >= 500 && res.status < 600) {
            // Retry the specified number of times for possible server side issues
            if (retries !== this.manager.options.retries) {
                return this.runRequest(routeID, url, options, ++retries);
            }
            // We are out of retries, throw an error
            throw new HTTPError_1.HTTPError(res.statusText, res.constructor.name, res.status, method, url);
        }
        else {
            // Handle possible malformed requests
            if (res.status >= 400 && res.status < 500) {
                // If we receive this status code, it means the token we had is no longer valid.
                if (res.status === 401) {
                    this.manager.setToken(null);
                }
                // The request will not succeed for some reason, parse the error returned from the api
                const data = (await utils_1.parseResponse(res));
                // throw the API error
                throw new DiscordAPIError_1.DiscordAPIError(data, data.code, res.status, method, url);
            }
            return null;
        }
    }
}
exports.SequentialHandler = SequentialHandler;
_SequentialHandler_asyncQueue = new WeakMap();
//# sourceMappingURL=SequentialHandler.js.map