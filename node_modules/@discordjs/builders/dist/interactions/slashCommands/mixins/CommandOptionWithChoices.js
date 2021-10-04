"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationCommandOptionWithChoicesBase = void 0;
const tslib_1 = require("tslib");
require("discord-api-types/v9");
const ow_1 = tslib_1.__importDefault(require("ow"));
const Assertions_1 = require("../Assertions");
const CommandOptionBase_1 = require("./CommandOptionBase");
const stringPredicate = ow_1.default.string.minLength(1).maxLength(100);
const integerPredicate = ow_1.default.number.finite;
// TODO: See resolution for sindresorhus/ow#217 in relation to this cast
const choicesPredicate = ow_1.default.array.ofType(ow_1.default.array.exactShape([stringPredicate, ow_1.default.any(ow_1.default.string, integerPredicate)]));
class ApplicationCommandOptionWithChoicesBase extends CommandOptionBase_1.SlashCommandOptionBase {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "choices", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    /**
     * Adds a choice for this option
     * @param name The name of the choice
     * @param value The value of the choice
     */
    addChoice(name, value) {
        this.choices ?? (this.choices = []);
        Assertions_1.validateMaxChoicesLength(this.choices);
        // Validate name
        ow_1.default(name, `${this.type === 3 /* String */ ? 'string' : 'integer'} choice name`, stringPredicate);
        // Validate the value
        if (this.type === 3 /* String */)
            ow_1.default(value, 'string choice value', stringPredicate);
        else
            ow_1.default(value, 'integer choice value', integerPredicate);
        this.choices.push({ name, value });
        return this;
    }
    /**
     * Adds multiple choices for this option
     * @param choices The choices to add
     */
    addChoices(choices) {
        ow_1.default(choices, `${this.type === 3 /* String */ ? 'string' : 'integer'} choices`, choicesPredicate);
        for (const [label, value] of choices)
            this.addChoice(label, value);
        return this;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            choices: this.choices,
        };
    }
}
exports.ApplicationCommandOptionWithChoicesBase = ApplicationCommandOptionWithChoicesBase;
//# sourceMappingURL=CommandOptionWithChoices.js.map