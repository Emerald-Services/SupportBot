"use strict";
var _RequestManager_token;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestManager = exports.RequestMethod = void 0;
const tslib_1 = require("tslib");
const collection_1 = tslib_1.__importDefault(require("@discordjs/collection"));
const form_data_1 = tslib_1.__importDefault(require("form-data"));
const snowflake_1 = require("@sapphire/snowflake");
const events_1 = require("events");
const https_1 = require("https");
const SequentialHandler_1 = require("./handlers/SequentialHandler");
const constants_1 = require("./utils/constants");
const agent = new https_1.Agent({ keepAlive: true });
/**
 * Possible API methods to be used when doing requests
 */
var RequestMethod;
(function (RequestMethod) {
    RequestMethod["Delete"] = "delete";
    RequestMethod["Get"] = "get";
    RequestMethod["Patch"] = "patch";
    RequestMethod["Post"] = "post";
    RequestMethod["Put"] = "put";
})(RequestMethod = exports.RequestMethod || (exports.RequestMethod = {}));
/**
 * Represents the class that manages handlers for endpoints
 */
class RequestManager extends events_1.EventEmitter {
    constructor(options) {
        super();
        /**
         * A timeout promise that is set when we hit the global rate limit
         * @default null
         */
        this.globalTimeout = null;
        /**
         * API bucket hashes that are cached from provided routes
         */
        this.hashes = new collection_1.default();
        /**
         * Request handlers created from the bucket hash and the major parameters
         */
        this.handlers = new collection_1.default();
        // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
        _RequestManager_token.set(this, null);
        this.options = { ...constants_1.DefaultRestOptions, ...options };
        this.options.offset = Math.max(0, this.options.offset);
    }
    /**
     * Sets the authorization token that should be used for requests
     * @param token The authorization token to use
     */
    setToken(token) {
        tslib_1.__classPrivateFieldSet(this, _RequestManager_token, token, "f");
        return this;
    }
    /**
     * Queues a request to be sent
     * @param request All the information needed to make a request
     * @returns The response from the api request
     */
    async queueRequest(request) {
        // Generalize the endpoint to its route data
        const routeID = RequestManager.generateRouteData(request.fullRoute, request.method);
        // Get the bucket hash for the generic route, or point to a global route otherwise
        const hash = this.hashes.get(`${request.method}:${routeID.bucketRoute}`) ?? `Global(${request.method}:${routeID.bucketRoute})`;
        // Get the request handler for the obtained hash, with its major parameter
        const handler = this.handlers.get(`${hash}:${routeID.majorParameter}`) ?? this.createHandler(hash, routeID.majorParameter);
        // Resolve the request into usable fetch/node-fetch options
        const { url, fetchOptions } = this.resolveRequest(request);
        // Queue the request
        return handler.queueRequest(routeID, url, fetchOptions);
    }
    /**
     * Creates a new rate limit handler from a hash, based on the hash and the major parameter
     * @param hash The hash for the route
     * @param majorParameter The major parameter for this handler
     * @private
     */
    createHandler(hash, majorParameter) {
        // Create the async request queue to handle requests
        const queue = new SequentialHandler_1.SequentialHandler(this, hash, majorParameter);
        // Save the queue based on its ID
        this.handlers.set(queue.id, queue);
        return queue;
    }
    /**
     * Formats the request data to a usable format for fetch
     * @param request The request data
     */
    resolveRequest(request) {
        const { options } = this;
        let query = '';
        // If a query option is passed, use it
        if (request.query) {
            query = `?${request.query.toString()}`;
        }
        // Create the required headers
        const headers = {
            'User-Agent': `${constants_1.DefaultUserAgent} ${options.userAgentAppendix}`.trim(),
        };
        // If this request requires authorization (allowing non-"authorized" requests for webhooks)
        if (request.auth !== false) {
            // If we haven't received a token, throw an error
            if (!tslib_1.__classPrivateFieldGet(this, _RequestManager_token, "f")) {
                throw new Error('Expected token to be set for this request, but none was present');
            }
            headers.Authorization = `${request.authPrefix ?? 'Bot'} ${tslib_1.__classPrivateFieldGet(this, _RequestManager_token, "f")}`;
        }
        // If a reason was set, set it's appropriate header
        if (request.reason?.length) {
            headers['X-Audit-Log-Reason'] = encodeURIComponent(request.reason);
        }
        // Format the full request URL (api base, optional version, endpoint, optional querystring)
        const url = `${options.api}${request.versioned === false ? '' : `/v${options.version}`}${request.fullRoute}${query}`;
        let finalBody;
        let additionalHeaders = {};
        if (request.attachments?.length) {
            const formData = new form_data_1.default();
            // Attach all files to the request
            for (const attachment of request.attachments) {
                formData.append(attachment.fileName, attachment.rawBuffer, attachment.fileName);
            }
            // If a JSON body was added as well, attach it to the form data
            // eslint-disable-next-line no-eq-null
            if (request.body != null) {
                formData.append('payload_json', JSON.stringify(request.body));
            }
            // Set the final body to the form data
            finalBody = formData;
            // Set the additional headers to the form data ones
            additionalHeaders = formData.getHeaders();
            // eslint-disable-next-line no-eq-null
        }
        else if (request.body != null) {
            // Stringify the JSON data
            finalBody = JSON.stringify(request.body);
            // Set the additional headers to specify the content-type
            additionalHeaders = { 'Content-Type': 'application/json' };
        }
        const fetchOptions = {
            agent,
            body: finalBody,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            headers: { ...(request.headers ?? {}), ...additionalHeaders, ...headers },
            method: request.method,
        };
        return { url, fetchOptions };
    }
    /**
     * Generates route data for an endpoint:method
     * @param endpoint The raw endpoint to generalize
     * @param method The HTTP method this endpoint is called without
     * @private
     */
    static generateRouteData(endpoint, method) {
        const majorIDMatch = /^\/(?:channels|guilds|webhooks)\/(\d{16,19})/.exec(endpoint);
        // Get the major ID for this route - global otherwise
        const majorID = majorIDMatch?.[1] ?? 'global';
        const baseRoute = endpoint
            // Strip out all IDs
            .replace(/\d{16,19}/g, ':id')
            // Strip out reaction as they fall under the same bucket
            .replace(/\/reactions\/(.*)/, '/reactions/:reaction');
        let exceptions = '';
        // Hard-Code Old Message Deletion Exception (2 week+ old messages are a different bucket)
        // https://github.com/discord/discord-api-docs/issues/1295
        if (method === "delete" /* Delete */ && baseRoute === '/channels/:id/messages/:id') {
            const id = /\d{16,19}$/.exec(endpoint)[0];
            const snowflake = snowflake_1.DiscordSnowflake.deconstruct(id);
            if (Date.now() - Number(snowflake.timestamp) > 1000 * 60 * 60 * 24 * 14) {
                exceptions += '/Delete Old Message';
            }
        }
        return {
            majorParameter: majorID,
            bucketRoute: baseRoute + exceptions,
            original: endpoint,
        };
    }
}
exports.RequestManager = RequestManager;
_RequestManager_token = new WeakMap();
//# sourceMappingURL=RequestManager.js.map