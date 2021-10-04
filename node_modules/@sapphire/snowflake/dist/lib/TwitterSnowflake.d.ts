import { DeconstructedSnowflake, Snowflake, SnowflakeGenerateOptions } from './Snowflake';
/**
 * A class for parsing snowflake ids using Twitter's snowflake epoch
 *
 * Which is 2006-03-21 at 20:50:14.000 UTC+0, the time and date of the first tweet ever made {@linkplain https://twitter.com/jack/status/20}
 */
export declare class TwitterSnowflake extends Snowflake {
    constructor();
    /**
     * Twitter epoch (`2006-03-21T20:50:14.000Z`)
     * @see {@linkplain https://twitter.com/jack/status/20}, first tweet ever made
     */
    static readonly Epoch = 1142974214000n;
    /**
     * Deconstructs a snowflake given a snowflake ID
     * @param id the snowflake to deconstruct
     * @returns a deconstructed snowflake
     * @example
     * ```ts
     * const snowflake = TwitterSnowflake.decode('3971046231244935168');
     * ```
     */
    static decode: typeof TwitterSnowflake.deconstruct;
    /**
     * Deconstructs a snowflake given a snowflake ID
     * @param id the snowflake to deconstruct
     * @returns a deconstructed snowflake
     * @example
     * ```ts
     * const snowflake = TwitterSnowflake.deconstruct('3971046231244935168');
     * ```
     */
    static deconstruct(id: string | bigint): DeconstructedSnowflake;
    /**
     * Generates a snowflake given an epoch and optionally a timestamp
     * @param options options to pass into the generator, see {@link SnowflakeGenerateOptions}
     *
     * **note** when increment is not provided it defaults to `0n`
     * @example
     * ```ts
     * const snowflake = TwitterSnowflake.generate();
     * ```
     * @returns A unique snowflake
     */
    static generate(options?: SnowflakeGenerateOptions): bigint;
}
//# sourceMappingURL=TwitterSnowflake.d.ts.map