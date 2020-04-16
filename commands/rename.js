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

    let staffGroup = message.guild.roles.cache.find(staffRole => staffRole.name === supportbot.StaffRole);

    const rolerequired = new Discord.MessageEmbed()
        .setTitle("SupportBot Error!")
        .setDescription(`:x: **Error!** Incorrect Permissions, You cannot execute this command as you do not have the required role.\n\nRole Required: \`${supportbot.StaffRole}\`\n\nError Code: \`SB-02\``)
        .setColor(supportbot.ErrorColour); 
    if (!message.member.roles.cache.has(staffGroup.id)) return message.reply({embed: rolerequired});
    
    const outsideticket = new Discord.MessageEmbed()
		.setDescription(`:x: Cannot use this command becase you are outside a ticket channel.`)
		.setColor(supportbot.colour) 
	if (!message.channel.name.startsWith(`${supportbot.Ticket_Channel_Name}-`)) return message.channel.send({embed: outsideticket});
	const renameto = args.join(" ")
	message.channel.setName(`${supportbot.Ticket_Channel_Name}-${renameto}`)
	
    // Renamed Ticket Logistic   
	const logEmbed = new Discord.MessageEmbed()
        .setTitle(":ticket: Ticket Renamed")
		.setDescription(`<@${message.author.id}> has renamed a ticket to ${supportbot.Ticket_Channel_Name}-${renameto}`)
        .setColor(supportbot.EmbedColour)
        .setFooter(supportbot.EmbedFooter)
  
    let locateChannel = message.guild.channels.cache.find(LocateChannel => LocateChannel.name === `${supportbot.Ticket_Logs}`)

    const errornochannel = new Discord.MessageEmbed()
        .setTitle("SupportBot Error!")
        .setDescription(`:x: **Error!** Channel not Found, This command cannot be executed proberbly as their is no channel within this server.\nThis is configurable via **supportbot-config.yml**\n\nChannel Required: \`${supportbot.Ticket_Logs}\`\n\nError Code: \`SB-03\``)
        .setColor(supportbot.ErrorColour);
    if(!locateChannel) return message.channel.send(errornochannel);
        
    locateChannel.send(logEmbed)

};

exports.help = {
    name: supportbot.Rename_Command,
}
