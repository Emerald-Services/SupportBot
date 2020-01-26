// SupportBot
// Created by © 2020 Emerald Services
// Command: Rename

const Discord = require("discord.js");
const bot = new Discord.Client();

const fs = require("fs");
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

exports.run = async (bot, message, args) => {

    console.log(`\u001b[33m`, `[${supportbot.Bot_Name}] > `, `\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${supportbot.Prefix}${supportbot.Rename_Command}`);

	let staffGroup = message.guild.roles.find(staffRole => staffRole.name === supportbot.StaffRole)

	const rolemissing = new Discord.RichEmbed()
		.setDescription(`:x: Looks like this server doesn't have the role **${supportbot.StaffRole}**`)
		.setColor(supportbot.colour) 
	if (!staffGroup) return message.reply({embed: rolemissing});

	const donothaverole = new Discord.RichEmbed()
		.setDescription(`:x: Sorry! You cannot use this command with the role **${supportbot.StaffRole}**`)
		.setColor(supportbot.colour) 
	if (!message.member.roles.has(staffGroup.id)) return message.reply({embed: donothaverole});
	
    const outsideticket = new Discord.RichEmbed()
		.setDescription(`:x: Cannot use this command becase you are outside a ticket channel.`)
		.setColor(supportbot.colour) 
	if (!message.channel.name.startsWith(`${supportbot.Ticket_Channel_Name}-`)) return message.channel.send({embed: outsideticket});
	const renameto = args.join(" ")
	message.channel.setName(`${supportbot.Ticket_Channel_Name}-${renameto}`)
	
    // Renamed Ticket Logistic   
	const logEmbed = new Discord.RichEmbed()
        .setTitle(":ticket: Ticket Renamed")
		.setDescription(`<@${message.author.id}> has renamed a ticket to ${supportbot.Ticket_Channel_Name}-${renameto}`)
        .setColor(supportbot.EmbedColour)
        .setFooter(supportbot.EmbedFooter)
  
    let logChannel = message.guild.channels.find(TicketChannel => TicketChannel.name === `${supportbot.Ticket_Logs}`);
    if(!logChannel) return message.channel.send(`:x: Error! Could not find the logs channel **${supportbot.Ticket_Logs}**`);
    
    logChannel.send({embed: logEmbed});

};

exports.help = {
    name: supportbot.Rename_Command,
}
