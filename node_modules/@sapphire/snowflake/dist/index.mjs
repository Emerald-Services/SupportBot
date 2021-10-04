/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __classPrivateFieldGet(receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
}

function __classPrivateFieldSet(receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
}

/* eslint-disable @typescript-eslint/explicit-member-accessibility */
var _Snowflake_increment, _Snowflake_epoch;
/**
 * A class for parsing snowflake ids
 */
class Snowflake {
    /**
     * @param epoch the epoch to use
     */
    constructor(epoch) {
        /**
         * Internal incrementor for generating snowflakes
         * @internal
         */
        _Snowflake_increment.set(this, 0n);
        /**
         * Internal reference of the epoch passed in the constructor
         * @internal
         */
        _Snowflake_epoch.set(this, void 0);
        /**
         * Alias for {@link deconstruct}
         */
        // eslint-disable-next-line @typescript-eslint/unbound-method, @typescript-eslint/no-invalid-this
        Object.defineProperty(this, "decode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.deconstruct
        });
        __classPrivateFieldSet(this, _Snowflake_epoch, BigInt(epoch instanceof Date ? epoch.getTime() : epoch));
    }
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
    generate({ increment = __classPrivateFieldGet(this, _Snowflake_increment), timestamp = Date.now(), workerID = 1n, processID = 1n } = {
        increment: __classPrivateFieldGet(this, _Snowflake_increment),
        timestamp: Date.now(),
        workerID: 1n,
        processID: 1n
    }) {
        if (timestamp instanceof Date)
            timestamp = BigInt(timestamp.getTime());
        if (typeof timestamp === 'number' && !Number.isNaN(timestamp))
            timestamp = BigInt(timestamp);
        if (typeof timestamp !== 'bigint') {
            throw new TypeError(`"timestamp" argument must be a number, BigInt or Date (received ${Number.isNaN(timestamp) ? 'NaN' : typeof timestamp})`);
        }
        if (increment >= 4095n)
            increment = 0n;
        // timestamp, workerID, processID, increment
        return ((timestamp - __classPrivateFieldGet(this, _Snowflake_epoch)) << 22n) | (workerID << 17n) | (processID << 12n) | increment++;
    }
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
    deconstruct(id) {
        const bigIntId = BigInt(id);
        return {
            id: bigIntId,
            timestamp: (bigIntId >> 22n) + __classPrivateFieldGet(this, _Snowflake_epoch),
            workerID: (bigIntId >> 17n) & 31n,
            processID: (bigIntId >> 12n) & 31n,
            increment: bigIntId & 4095n,
            epoch: __classPrivateFieldGet(this, _Snowflake_epoch)
        };
    }
}
_Snowflake_increment = new WeakMap(), _Snowflake_epoch = new WeakMap();

/**
 * A class for parsing snowflake ids using Discord's snowflake epoch
 *
 * Which is 2015-01-01 at 00:00:00.000 UTC+0, {@linkplain https://discord.com/developers/docs/reference#snowflakes}
 */
class DiscordSnowflake extends Snowflake {
    constructor() {
        super(DiscordSnowflake.Epoch);
    }
    /**
     * Deconstructs a snowflake given a snowflake ID
     * @param id the snowflake to deconstruct
     * @returns a deconstructed snowflake
     * @example
     * ```ts
     * const snowflake = DiscordSnowflake.deconstruct('3971046231244935168');
     * ```
     */
    static deconstruct(id) {
        return new DiscordSnowflake().deconstruct(id);
    }
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
    static generate(options = { timestamp: Date.now() }) {
        return new DiscordSnowflake().generate(options);
    }
}
/**
 * Discord epoch (`2015-01-01T00:00:00.000Z`)
 * @see {@linkplain https://discord.com/developers/docs/reference#snowflakes}
 */
Object.defineProperty(DiscordSnowflake, "Epoch", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 1420070400000n
});
/**
 * Deconstructs a snowflake given a snowflake ID
 * @param id the snowflake to deconstruct
 * @returns a deconstructed snowflake
 * @example
 * ```ts
 * const snowflake = DiscordSnowflake.decode('3971046231244935168');
 * ```
 */
// eslint-disable-next-line @typescript-eslint/unbound-method
Object.defineProperty(DiscordSnowflake, "decode", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: DiscordSnowflake.deconstruct
});

/**
 * A class for parsing snowflake ids using Twitter's snowflake epoch
 *
 * Which is 2006-03-21 at 20:50:14.000 UTC+0, the time and date of the first tweet ever made {@linkplain https://twitter.com/jack/status/20}
 */
class TwitterSnowflake extends Snowflake {
    constructor() {
        super(TwitterSnowflake.Epoch);
    }
    /**
     * Deconstructs a snowflake given a snowflake ID
     * @param id the snowflake to deconstruct
     * @returns a deconstructed snowflake
     * @example
     * ```ts
     * const snowflake = TwitterSnowflake.deconstruct('3971046231244935168');
     * ```
     */
    static deconstruct(id) {
        return new TwitterSnowflake().deconstruct(id);
    }
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
    static generate(options = { timestamp: Date.now() }) {
        return new TwitterSnowflake().generate(options);
    }
}
/**
 * Twitter epoch (`2006-03-21T20:50:14.000Z`)
 * @see {@linkplain https://twitter.com/jack/status/20}, first tweet ever made
 */
Object.defineProperty(TwitterSnowflake, "Epoch", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 1142974214000n
});
/**
 * Deconstructs a snowflake given a snowflake ID
 * @param id the snowflake to deconstruct
 * @returns a deconstructed snowflake
 * @example
 * ```ts
 * const snowflake = TwitterSnowflake.decode('3971046231244935168');
 * ```
 */
// eslint-disable-next-line @typescript-eslint/unbound-method
Object.defineProperty(TwitterSnowflake, "decode", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: TwitterSnowflake.deconstruct
});

export { DiscordSnowflake, Snowflake, TwitterSnowflake };
//# sourceMappingURL=index.mjs.map
