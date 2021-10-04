import { DeconstructedSnowflake, Snowflake, SnowflakeGenerateOptions } from './Snowflake';
/**
 * A class for parsing snowflake ids using Discord's snowflake epoch
 *
 * Which is 2015-01-01 at 00:00:00.000 UTC+0, {@linkplain https://discord.com/developers/docs/reference#snowflakes}
 */
export declare class DiscordSnowflake extends Snowflake {
    constructor();
    /**
     * Discord epoch (`2015-01-01T00:00:00.000Z`)
     * @see {@linkplain https://discord.com/developers/docs/reference#snowflakes}
     */
    static readonly Epoch = 1420070400000n;
    /**
     * Deconstructs a snowflake given a snowflake ID
     * @param id the snowflake to deconstruct
     * @returns a deconstructed snowflake
     * @example
     * ```ts
     * const snowflake = DiscordSnowflake.decode('3971046231244935168');
     * ```
     */
    static decode: typeof DiscordSnowflake.deconstruct;
    /**
     * Deconstructs a snowflake given a snowflake ID
     * @param id the snowflake to deconstruct
     * @returns a deconstructed snowflake
     * @example
     * ```ts
     * const snowflake = DiscordSnowflake.deconstruct('3971046231244935168');
     * ```
     */
    static deconstruct(id: string | bigint): DeconstructedSnowflake;
    /**
     * Generates a snowflake given an epoch and optionally a timestamp
     * @param options {@link SnowflakeGenerateOptions} to pass into the generator
     *
     * **note** when increment is not provided it defaults to `0n`
     * @example
     * ```ts
     * const snowflake = DiscordSnowflake.generate();
     * ```
     * @returns A unique snowflake
     */
    static generate(options?: SnowflakeGenerateOptions): bigint;
}
//# sourceMappingURL=DiscordSnowflake.d.ts.map