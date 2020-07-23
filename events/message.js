// SupportBot 6.0, Created by Emerald Services
// Message Event

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = async (bot, message) => {
	if(message.author.bot) return;
  	if(message.channel.type === "dm") return;
  	if (message.content.indexOf(supportbot.Prefix) !== 0) return;

  	let messageArray = message.content.split(" ");
  	const args = message.content.slice(supportbot.Prefix.length).trim().split(/ +/g);
  	const command = args.shift().toLowerCase();

  	const cmd = bot.commands.get(command);
  	if(!cmd) return;
  	cmd.execute(message, args);
    message.delete();

};