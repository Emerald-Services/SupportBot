"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDN = void 0;
const constants_1 = require("./utils/constants");
/**
 * The CDN link builder
 */
class CDN {
    constructor(base = constants_1.DefaultRestOptions.cdn) {
        this.base = base;
    }
    /**
     * Generates an app asset URL for a client's asset.
     * @param clientID The client ID that has the asset
     * @param assetHash The hash provided by Discord for this asset
     * @param options Optional options for the asset
     */
    appAsset(clientID, assetHash, options) {
        return this.makeURL(`/app-assets/${clientID}/${assetHash}`, options);
    }
    /**
     * Generates an app icon URL for a client's icon.
     * @param clientID The client ID that has the icon
     * @param iconHash The hash provided by Discord for this icon
     * @param options Optional options for the icon
     */
    appIcon(clientID, iconHash, options) {
        return this.makeURL(`/app-icons/${clientID}/${iconHash}`, options);
    }
    /**
     * Generates the default avatar URL for a discriminator.
     * @param discriminator The discriminator modulo 5
     */
    defaultAvatar(discriminator) {
        return this.makeURL(`/embed/avatars/${discriminator}`);
    }
    /**
     * Generates a discovery splash URL for a guild's discovery splash.
     * @param guildID The guild ID that has the discovery splash
     * @param splashHash The hash provided by Discord for this splash
     * @param options Optional options for the splash
     */
    discoverySplash(guildID, splashHash, options) {
        return this.makeURL(`/discovery-splashes/${guildID}/${splashHash}`, options);
    }
    /**
     * Generates an emoji's URL for an emoji.
     * @param emojiID The emoji ID
     * @param extension The extension of the emoji
     */
    emoji(emojiID, extension) {
        return this.makeURL(`/emojis/${emojiID}`, { extension });
    }
    /**
     * Generates a group DM icon URL for a group DM.
     * @param channelID The group channel ID that has the icon
     * @param iconHash The hash provided by Discord for this group DM channel
     * @param options Optional options for the icon
     */
    groupDMIcon(channelID, iconHash, options) {
        return this.makeURL(`/channel-icons/${channelID}/${iconHash}`, options);
    }
    /**
     * Generates a banner URL for a guild's banner.
     * @param guildID The guild ID that has the banner splash
     * @param bannerHash The hash provided by Discord for this banner
     * @param options Optional options for the banner
     */
    guildBanner(guildID, bannerHash, options) {
        return this.makeURL(`/banners/${guildID}/${bannerHash}`, options);
    }
    /**
     * Generates an icon URL for a guild's icon.
     * @param guildID The guild ID that has the icon splash
     * @param iconHash The hash provided by Discord for this icon
     * @param options Optional options for the icon
     */
    guildIcon(guildID, iconHash, options) {
        return this.makeURL(`/icons/${guildID}/${iconHash}`, options);
    }
    /**
     * Generates a guild invite splash URL for a guild's invite splash.
     * @param guildID The guild ID that has the invite splash
     * @param splashHash The hash provided by Discord for this splash
     * @param options Optional options for the splash
     */
    splash(guildID, splashHash, options) {
        return this.makeURL(`/splashes/${guildID}/${splashHash}`, options);
    }
    /**
     * Generates a team icon URL for a team's icon.
     * @param teamID The team ID that has the icon
     * @param iconHash The hash provided by Discord for this icon
     * @param options Optional options for the icon
     */
    teamIcon(teamID, iconHash, options) {
        return this.makeURL(`/team-icons/${teamID}/${iconHash}`, options);
    }
    /**
     * Generates a user avatar URL for a user's avatar.
     * @param userID The user ID that has the icon
     * @param avatarHash The hash provided by Discord for this avatar
     * @param options Optional options for the avatar
     */
    userAvatar(userID, avatarHash, { dynamic = false, ...options } = {}) {
        if (dynamic && avatarHash.startsWith('a_')) {
            options.extension = 'gif';
        }
        return this.makeURL(`/avatars/${userID}/${avatarHash}`, options);
    }
    /**
     * Constructs the URL for the resource
     * @param base The base cdn route
     * @param options The extension/size options for the link
     */
    makeURL(base, { extension = 'png', size } = {}) {
        extension = String(extension).toLowerCase();
        if (!constants_1.ALLOWED_EXTENSIONS.includes(extension)) {
            throw new RangeError(`Invalid extension provided: ${extension}\nMust be one of: ${constants_1.ALLOWED_EXTENSIONS.join(', ')}`);
        }
        if (size && !constants_1.ALLOWED_SIZES.includes(size)) {
            throw new RangeError(`Invalid size provided: ${size}\nMust be one of: ${constants_1.ALLOWED_SIZES.join(', ')}`);
        }
        const url = new URL(`${this.base}${base}.${extension}`);
        if (size) {
            url.searchParams.set('size', String(size));
        }
        return url.toString();
    }
}
exports.CDN = CDN;
//# sourceMappingURL=CDN.js.map