// SupportBot | Emerald Services
// Ping Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./Data/supportbot.yml', 'utf8'));

const Command = require("../Structures/Command.js");

module.exports = new Command({
	name: "ping",
	description: "Shows the ping of the bot!",
	type: "BOTH",
	slashCommandOptions: [],
	permission: "SEND_MESSAGES",

	async run(message, args, client) {

		const PingEmbed = new Discord.MessageEmbed()
			.setDescription(`:ping_pong: **Ping:** \`${client.ws.ping} ms\``)
			.setColor(supportbot.EmbedColour)

		message.channel.send({
			embeds: [PingEmbed]
		});
	}
});