// SupportBot | Emerald Services
// Addon Structure

const fs = require("fs");

const Discord = require("discord.js");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./Data/supportbot.yml', 'utf8'));

function RunFunction(message, args, client) {}

class Addon {
	constructor(options) {
		this.name = options.name;
		this.description = options.description;
		this.permission = options.permission;
		this.type = ["BOTH", "SLASH", "TEXT"].includes(options.type) ? options.type : "TEXT";
		this.slashCommandOptions = options.slashCommandOptions || [];
		this.run = options.run;
	}
}

module.exports = Addon;