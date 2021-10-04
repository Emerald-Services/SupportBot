// SupportBot | Emerald Services
// Event Structure

const fs = require("fs");

const Discord = require("discord.js");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./Data/supportbot.yml', 'utf8'));

function RunFunction(client, ...eventArgs) {}

class Event {

	constructor(event, runFunction) {
		this.event = event;
		this.run = runFunction;
	}
}

module.exports = Event;