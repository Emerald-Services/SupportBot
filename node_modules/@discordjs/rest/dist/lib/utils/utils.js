"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResponse = void 0;
/**
 * Converts the response to usable data
 * @param res The node-fetch response
 */
function parseResponse(res) {
    if (res.headers.get('Content-Type')?.startsWith('application/json')) {
        return res.json();
    }
    return res.buffer();
}
exports.parseResponse = parseResponse;
//# sourceMappingURL=utils.js.map