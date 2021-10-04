"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REST = void 0;
const events_1 = require("events");
const CDN_1 = require("./CDN");
const RequestManager_1 = require("./RequestManager");
const constants_1 = require("./utils/constants");
class REST extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.cdn = new CDN_1.CDN(options.cdn ?? constants_1.DefaultRestOptions.cdn);
        this.requestManager = new RequestManager_1.RequestManager(options)
            .on("restDebug" /* Debug */, this.emit.bind(this, "restDebug" /* Debug */))
            .on("rateLimited" /* RateLimited */, this.emit.bind(this, "rateLimited" /* RateLimited */));
    }
    /**
     * Sets the authorization token that should be used for requests
     * @param token The authorization token to use
     */
    setToken(token) {
        this.requestManager.setToken(token);
        return this;
    }
    /**
     * Runs a get request from the api
     * @param fullRoute The full route to query
     * @param options Optional request options
     */
    get(fullRoute, options = {}) {
        return this.request({ ...options, fullRoute, method: "get" /* Get */ });
    }
    /**
     * Runs a delete request from the api
     * @param fullRoute The full route to query
     * @param options Optional request options
     */
    delete(fullRoute, options = {}) {
        return this.request({ ...options, fullRoute, method: "delete" /* Delete */ });
    }
    /**
     * Runs a post request from the api
     * @param fullRoute The full route to query
     * @param options Optional request options
     */
    post(fullRoute, options = {}) {
        return this.request({ ...options, fullRoute, method: "post" /* Post */ });
    }
    /**
     * Runs a put request from the api
     * @param fullRoute The full route to query
     * @param options Optional request options
     */
    put(fullRoute, options = {}) {
        return this.request({ ...options, fullRoute, method: "put" /* Put */ });
    }
    /**
     * Runs a patch request from the api
     * @param fullRoute The full route to query
     * @param options Optional request options
     */
    patch(fullRoute, options = {}) {
        return this.request({ ...options, fullRoute, method: "patch" /* Patch */ });
    }
    /**
     * Runs a request from the api
     * @param options Request options
     */
    request(options) {
        return this.requestManager.queueRequest(options);
    }
}
exports.REST = REST;
//# sourceMappingURL=REST.js.map