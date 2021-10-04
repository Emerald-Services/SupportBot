"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlashCommandBuilder = void 0;
const tslib_1 = require("tslib");
const ts_mixer_1 = require("ts-mixer");
const Assertions_1 = require("./Assertions");
const NameAndDescription_1 = require("./mixins/NameAndDescription");
const CommandOptions_1 = require("./mixins/CommandOptions");
const SlashCommandSubcommands_1 = require("./SlashCommandSubcommands");
let SlashCommandBuilder = class SlashCommandBuilder {
    constructor() {
        /**
         * The name of this slash command
         */
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        /**
         * The description of this slash command
         */
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        /**
         * The options of this slash command
         */
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
    }
    /**
     * Returns the final data that should be sent to Discord.
     *
     * **Note:** Calling this function will validate required properties based on their conditions.
     */
    toJSON() {
        Assertions_1.validateRequiredParameters(this.name, this.description, this.options);
        return {
            name: this.name,
            description: this.description,
            options: this.options.map((option) => option.toJSON()),
        };
    }
    /**
     * Adds a new subcommand group to this command
     * @param input A function that returns a subcommand group builder, or an already built builder
     */
    addSubcommandGroup(input) {
        const { options } = this;
        // First, assert options conditions - we cannot have more than 25 options
        Assertions_1.validateMaxOptionsLength(options);
        // Make sure there is no subcommand at the root level - if there is, throw
        const hasSubcommands = options.some((item) => item instanceof SlashCommandSubcommands_1.SlashCommandSubcommandBuilder);
        if (hasSubcommands)
            throw new RangeError(`You cannot mix subcommands and subcommand groups at the root level.`);
        // Get the final result
        const result = typeof input === 'function' ? input(new SlashCommandSubcommands_1.SlashCommandSubcommandGroupBuilder()) : input;
        Assertions_1.assertReturnOfBuilder(result, SlashCommandSubcommands_1.SlashCommandSubcommandGroupBuilder);
        // Push it
        options.push(result);
        return this;
    }
    /**
     * Adds a new subcommand to this command
     * @param input A function that returns a subcommand builder, or an already built builder
     */
    addSubcommand(input) {
        const { options } = this;
        // First, assert options conditions - we cannot have more than 25 options
        Assertions_1.validateMaxOptionsLength(options);
        // Make sure there is no subcommand at the root level - if there is, throw
        const hasSubcommandGroups = options.some((item) => item instanceof SlashCommandSubcommands_1.SlashCommandSubcommandGroupBuilder);
        if (hasSubcommandGroups)
            throw new RangeError(`You cannot mix subcommands and subcommand groups at the root level.`);
        // Get the final result
        const result = typeof input === 'function' ? input(new SlashCommandSubcommands_1.SlashCommandSubcommandBuilder()) : input;
        Assertions_1.assertReturnOfBuilder(result, SlashCommandSubcommands_1.SlashCommandSubcommandBuilder);
        // Push it
        options.push(result);
        return this;
    }
};
SlashCommandBuilder = tslib_1.__decorate([
    ts_mixer_1.mix(CommandOptions_1.SharedSlashCommandOptions, NameAndDescription_1.SharedNameAndDescription)
], SlashCommandBuilder);
exports.SlashCommandBuilder = SlashCommandBuilder;
//# sourceMappingURL=SlashCommandBuilder.js.map