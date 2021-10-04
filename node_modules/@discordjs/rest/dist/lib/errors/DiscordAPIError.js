"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordAPIError = void 0;
function isErrorGroupWrapper(error) {
    return Reflect.has(error, '_errors');
}
function isErrorResponse(error) {
    return typeof Reflect.get(error, 'message') === 'string';
}
/**
 * Represents an API error returned by Discord
 * @extends Error
 */
class DiscordAPIError extends Error {
    /**
     * @param rawError The error reported by Discord
     * @param code The error code reported by Discord
     * @param status The status code of the response
     * @param method The method of the request that erred
     * @param url The url of the request that erred
     */
    constructor(rawError, code, status, method, url) {
        super(DiscordAPIError.getMessage(rawError));
        this.rawError = rawError;
        this.code = code;
        this.status = status;
        this.method = method;
        this.url = url;
    }
    /**
     * The name of the error
     */
    get name() {
        return `${DiscordAPIError.name}[${this.code}]`;
    }
    static getMessage(error) {
        let flattened = '';
        if (error.errors) {
            flattened = [...this.flattenDiscordError(error.errors)].join('\n');
        }
        return error.message && flattened
            ? `${error.message}\n${flattened}`
            : error.message || flattened || 'Unknown Error';
    }
    static *flattenDiscordError(obj, key = '') {
        if (isErrorResponse(obj)) {
            return yield `${key.length ? `${key}[${obj.code}]` : `${obj.code}`}: ${obj.message}`.trim();
        }
        for (const [k, v] of Object.entries(obj)) {
            const nextKey = k.startsWith('_') ? key : key ? (Number.isNaN(Number(k)) ? `${key}.${k}` : `${key}[${k}]`) : k;
            if (typeof v === 'string') {
                yield v;
            }
            else if (isErrorGroupWrapper(v)) {
                for (const error of v._errors) {
                    yield* this.flattenDiscordError(error, nextKey);
                }
            }
            else {
                yield* this.flattenDiscordError(v, nextKey);
            }
        }
    }
}
exports.DiscordAPIError = DiscordAPIError;
//# sourceMappingURL=DiscordAPIError.js.map