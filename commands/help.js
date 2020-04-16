// SupportBot
// Created by © 2020 Emerald Services
// Command: Help

const Discord = require("discord.js");
const bot = new Discord.Client()

const fs = require("fs")
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

exports.run = (bot, message, args) => {

    console.log(`\u001b[33m`, `[${supportbot.Bot_Name}] > `, `\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${supportbot.Prefix}${supportbot.Help_Command}`);

    let userCommands = "";
	    userCommands += `**${supportbot.Prefix}${supportbot.Ticket_Command} <reason>**: Create a support ticket\n`;
        userCommands += `**${supportbot.Prefix}${supportbot.Close_Command}**: Close your support ticket\n`;
        userCommands += `**${supportbot.Prefix}${supportbot.Suggest_Command} <suggestion>**: Create a server suggestion\n`;
        userCommands += `**${supportbot.Prefix}${supportbot.Report_Command} <user> <reason>**: Report a valid user\n`;
        userCommands += `**${supportbot.Prefix}${supportbot.Link_Command}**: Get some important links!\n`;
        userCommands += `**${supportbot.Prefix}${supportbot.Ping_Command}**: Check the bots ping. Pong!\n`;
	
    let supportCommands = "";
	    supportCommands += `**${supportbot.Prefix}${supportbot.Add_Command} <user>**: Adds a user to a ticket\n`;
        supportCommands += `**${supportbot.Prefix}${supportbot.Remove_Command} <user>**: Removes a user from a ticket\n`;
        supportCommands += `**${supportbot.Prefix}${supportbot.Forceclose_Command}**: Forceclose a support ticket\n`;
	    supportCommands += `**${supportbot.Prefix}${supportbot.Rename_Command}**: Rename a support ticket\n`;

    let staffCommands = "";
	    staffCommands += `**${supportbot.Prefix}${supportbot.Announcement_Command} <message>**: Create a bot announcement\n`;
        staffCommands += `**${supportbot.Prefix}${supportbot.Say_Command} <message>**: Send a message as the bot\n`;
        staffCommands += `**${supportbot.Prefix}${supportbot.Lockchat_Command}**: Lock the chat channel\n`;
        staffCommands += `**${supportbot.Prefix}${supportbot.UnLockchat_Command}**: UnLock the chat channel\n`;
	    staffCommands += `**${supportbot.Prefix}${supportbot.Poll_Command}**: Create a poll\n`;

    const embed = new Discord.MessageEmbed()
        .setTitle(supportbot.Bot_Name)
        .addField("🟨 User Commands", userCommands)
        .addField("🎫 Support Commands", supportCommands)
        .addField("🔐 Staff Commands", staffCommands)
        .setColor(supportbot.EmbedColour)
        .setFooter(supportbot.EmbedFooter, message.author.displayAvatarURL);

	message.channel.send(embed);

}

exports.help = {
    name: supportbot.Help_Command,
};
