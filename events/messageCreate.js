// SupportBot | Emerald Services
// Message Create Event

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./Data/supportbot.yml', 'utf8'));

const Event = require("../Structures/Event.js");

module.exports = new Event("messageCreate", (client, message) => {
	if (message.author.bot) return;

	if (!message.content.startsWith(client.prefix)) return;

	const args = message.content.substring(client.prefix.length).split(/ +/);

	const command = client.commands.find(cmd => cmd.name == args[0]);

    const NotValid = new Discord.MessageEmbed()
        .setDescription(`:x: \`${args[0]}\` is an Invalid Command `)
		.setColor(supportbot.ErrorColour)

	if (!command) return message.reply({
		embeds: [NotValid]
	});

    const OnlySlashCmd = new Discord.MessageEmbed()
        .setDescription(`:warning: That command is only useable as a \`Slash Command\` `)
		.setColor(supportbot.WarnColour)

	if (!["BOTH", "TEXT"].includes(command.type))
		return message.reply({
			embeds: [OnlySlashCmd]
		})

	const permission = message.member.permissions.has(command.permission, true);

    const ValidPerms = new Discord.MessageEmbed()
        .setDescription(":x: Do you have the \`${command.permission}\` permissions to execute this command?")
		.setColor(supportbot.ErrorColour)

	if (!permission)
		return message.reply(
			`You do not have the permission \`${command.permission}\` to run this command!`
		);

	command.run(message, args, client);
});