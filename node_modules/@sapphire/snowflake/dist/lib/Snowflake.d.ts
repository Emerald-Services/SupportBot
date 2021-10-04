/**
 * A class for parsing snowflake ids
 */
export declare class Snowflake {
    #private;
    /**
     * Alias for {@link deconstruct}
     */
    decode: (id: string | bigint) => DeconstructedSnowflake;
    /**
     * @param epoch the epoch to use
     */
    constructor(epoch: number | bigint | Date);
    /**
     * Generates a snowflake given an epoch and optionally a timestamp
     * @param options options to pass into the generator, see {@link SnowflakeGenerateOptions}
     *
     * **note** when increment is not provided it defaults to the private increment of the instance
     * @example
     * ```ts
     * const epoch = new Date('2000-01-01T00:00:00.000Z');
     * const snowflake = new Snowflake(epoch).generate();
     * ```
     * @returns A unique snowflake
     */
    generate({ increment, timestamp, workerID, processID }?: SnowflakeGenerateOptions): bigint;
    /**
     * Deconstructs a snowflake given a snowflake ID
     * @param id the snowflake to deconstruct
     * @returns a deconstructed snowflake
     * @example
     * ```ts
     * const epoch = new Date('2000-01-01T00:00:00.000Z');
     * const snowflake = new Snowflake(epoch).deconstruct('3971046231244935168');
     * ```
     */
    deconstruct(id: string | bigint): DeconstructedSnowflake;
}
/**
 * Options for Snowflake#generate
 */
export interface SnowflakeGenerateOptions {
    /**
     * Timestamp or date of the snowflake to generate
     * @default Date.now()
     */
    timestamp?: number | bigint | Date;
    /**
     * The increment to use
     * @default 0n
     * @remark keep in mind that this bigint is auto-incremented between generate calls
     */
    increment?: bigint;
    /**
     * The worker ID to use
     * @default 1n
     */
    workerID?: bigint;
    /**
     * The process ID to use
     * @default 1n
     */
    processID?: bigint;
}
/**
 * Object returned by Snowflake#deconstruct
 */
export interface DeconstructedSnowflake {
    /**
     * The id in BigInt form
     */
    id: bigint;
    /**
     * The timestamp stored in the snowflake
     */
    timestamp: bigint;
    /**
     * The worker id stored in the snowflake
     */
    workerID: bigint;
    /**
     * The process id stored in the snowflake
     */
    processID: bigint;
    /**
     * The increment stored in the snowflake
     */
    increment: bigint;
    /**
     * The epoch to use in the snowflake
     */
    epoch: bigint;
}
//# sourceMappingURL=Snowflake.d.ts.map