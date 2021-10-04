import { ImageExtension, ImageSize } from './utils/constants';
export interface ImageURLOptions {
    extension?: ImageExtension;
    size?: ImageSize;
    dynamic?: boolean;
}
/**
 * The CDN link builder
 */
export declare class CDN {
    private readonly base;
    constructor(base?: string);
    /**
     * Generates an app asset URL for a client's asset.
     * @param clientID The client ID that has the asset
     * @param assetHash The hash provided by Discord for this asset
     * @param options Optional options for the asset
     */
    appAsset(clientID: string, assetHash: string, options?: ImageURLOptions): string;
    /**
     * Generates an app icon URL for a client's icon.
     * @param clientID The client ID that has the icon
     * @param iconHash The hash provided by Discord for this icon
     * @param options Optional options for the icon
     */
    appIcon(clientID: string, iconHash: string, options?: ImageURLOptions): string;
    /**
     * Generates the default avatar URL for a discriminator.
     * @param discriminator The discriminator modulo 5
     */
    defaultAvatar(discriminator: number): string;
    /**
     * Generates a discovery splash URL for a guild's discovery splash.
     * @param guildID The guild ID that has the discovery splash
     * @param splashHash The hash provided by Discord for this splash
     * @param options Optional options for the splash
     */
    discoverySplash(guildID: string, splashHash: string, options?: ImageURLOptions): string;
    /**
     * Generates an emoji's URL for an emoji.
     * @param emojiID The emoji ID
     * @param extension The extension of the emoji
     */
    emoji(emojiID: string, extension?: ImageExtension): string;
    /**
     * Generates a group DM icon URL for a group DM.
     * @param channelID The group channel ID that has the icon
     * @param iconHash The hash provided by Discord for this group DM channel
     * @param options Optional options for the icon
     */
    groupDMIcon(channelID: string, iconHash: string, options?: ImageURLOptions): string;
    /**
     * Generates a banner URL for a guild's banner.
     * @param guildID The guild ID that has the banner splash
     * @param bannerHash The hash provided by Discord for this banner
     * @param options Optional options for the banner
     */
    guildBanner(guildID: string, bannerHash: string, options?: ImageURLOptions): string;
    /**
     * Generates an icon URL for a guild's icon.
     * @param guildID The guild ID that has the icon splash
     * @param iconHash The hash provided by Discord for this icon
     * @param options Optional options for the icon
     */
    guildIcon(guildID: string, iconHash: string, options?: ImageURLOptions): string;
    /**
     * Generates a guild invite splash URL for a guild's invite splash.
     * @param guildID The guild ID that has the invite splash
     * @param splashHash The hash provided by Discord for this splash
     * @param options Optional options for the splash
     */
    splash(guildID: string, splashHash: string, options?: ImageURLOptions): string;
    /**
     * Generates a team icon URL for a team's icon.
     * @param teamID The team ID that has the icon
     * @param iconHash The hash provided by Discord for this icon
     * @param options Optional options for the icon
     */
    teamIcon(teamID: string, iconHash: string, options?: ImageURLOptions): string;
    /**
     * Generates a user avatar URL for a user's avatar.
     * @param userID The user ID that has the icon
     * @param avatarHash The hash provided by Discord for this avatar
     * @param options Optional options for the avatar
     */
    userAvatar(userID: string, avatarHash: string, { dynamic, ...options }?: ImageURLOptions): string;
    /**
     * Constructs the URL for the resource
     * @param base The base cdn route
     * @param options The extension/size options for the link
     */
    private makeURL;
}
//# sourceMappingURL=CDN.d.ts.map