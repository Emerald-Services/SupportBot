import type { APIApplicationCommandOption } from 'discord-api-types/v9';
import { SharedNameAndDescription } from './mixins/NameAndDescription';
import { SharedSlashCommandOptions } from './mixins/CommandOptions';
import { SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from './SlashCommandSubcommands';
export declare class SlashCommandBuilder {
    /**
     * The name of this slash command
     */
    readonly name: string;
    /**
     * The description of this slash command
     */
    readonly description: string;
    /**
     * The options of this slash command
     */
    readonly options: ToAPIApplicationCommandOptions[];
    /**
     * Returns the final data that should be sent to Discord.
     *
     * **Note:** Calling this function will validate required properties based on their conditions.
     */
    toJSON(): {
        name: string;
        description: string;
        options: APIApplicationCommandOption[];
    };
    /**
     * Adds a new subcommand group to this command
     * @param input A function that returns a subcommand group builder, or an already built builder
     */
    addSubcommandGroup(input: SlashCommandSubcommandGroupBuilder | ((subcommandGroup: SlashCommandSubcommandGroupBuilder) => SlashCommandSubcommandGroupBuilder)): SlashCommandSubcommandGroupsOnlyBuilder;
    /**
     * Adds a new subcommand to this command
     * @param input A function that returns a subcommand builder, or an already built builder
     */
    addSubcommand(input: SlashCommandSubcommandBuilder | ((subcommandGroup: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder)): SlashCommandSubcommandsOnlyBuilder;
}
export interface SlashCommandBuilder extends SharedNameAndDescription, SharedSlashCommandOptions {
}
export interface SlashCommandSubcommandsOnlyBuilder extends SharedNameAndDescription, Pick<SlashCommandBuilder, 'toJSON' | 'addSubcommand'> {
}
export interface SlashCommandSubcommandGroupsOnlyBuilder extends SharedNameAndDescription, Pick<SlashCommandBuilder, 'toJSON' | 'addSubcommandGroup'> {
}
export interface SlashCommandOptionsOnlyBuilder extends SharedNameAndDescription, SharedSlashCommandOptions, Pick<SlashCommandBuilder, 'toJSON'> {
}
export interface ToAPIApplicationCommandOptions {
    toJSON(): APIApplicationCommandOption;
}
//# sourceMappingURL=SlashCommandBuilder.d.ts.map