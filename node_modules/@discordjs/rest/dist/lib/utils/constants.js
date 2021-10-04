"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_SIZES = exports.ALLOWED_EXTENSIONS = exports.RESTEvents = exports.DefaultRestOptions = exports.DefaultUserAgent = void 0;
const v8_1 = require("discord-api-types/v8");
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Package = require('../../../package.json');
// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
exports.DefaultUserAgent = `DiscordBot (${Package.homepage}, ${Package.version})`;
exports.DefaultRestOptions = {
    api: 'https://discord.com/api',
    cdn: 'https://cdn.discordapp.com',
    offset: 50,
    retries: 3,
    timeout: 15000,
    userAgentAppendix: `Node.js ${process.version}`,
    version: v8_1.APIVersion,
};
/**
 * The events that the REST manager emits
 */
var RESTEvents;
(function (RESTEvents) {
    RESTEvents["Debug"] = "restDebug";
    RESTEvents["RateLimited"] = "rateLimited";
})(RESTEvents = exports.RESTEvents || (exports.RESTEvents = {}));
exports.ALLOWED_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg', 'gif'];
exports.ALLOWED_SIZES = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
//# sourceMappingURL=constants.js.map