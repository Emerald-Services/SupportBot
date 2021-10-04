"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPError = void 0;
/**
 * Represents a HTTP error
 */
class HTTPError extends Error {
    /**
     * @param message The error message
     * @param name The name of the error
     * @param status The status code of the response
     * @param method The method of the request that erred
     * @param url The url of the request that erred
     */
    constructor(message, name, status, method, url) {
        super(message);
        this.name = name;
        this.status = status;
        this.method = method;
        this.url = url;
    }
}
exports.HTTPError = HTTPError;
//# sourceMappingURL=HTTPError.js.map