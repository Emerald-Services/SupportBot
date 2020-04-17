// SupportBot
// Created by © 2020 Emerald Services
// Command: Remove

const Discord = require("discord.js");
const bot = new Discord.Client();

const fs = require("fs");
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

exports.run = async (bot, message, args) => {

    console.log(`\u001b[33m`, `[${supportbot.Bot_Name}] > `, `\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${supportbot.Prefix}${supportbot.Remove_Command}`);
  
    let staffGroup = message.guild.roles.cache.find(staffRole => staffRole.name === supportbot.StaffRole);

    const rolerequired = new Discord.MessageEmbed()
        .setTitle("SupportBot Error!")
        .setDescription(`:x: **Error!** Incorrect Permissions, You cannot execute this command as you do not have the required role.\n\nRole Required: \`${supportbot.StaffRole}\`\n\nError Code: \`SB-02\``)
        .setColor(supportbot.ErrorColour); 
    if (!message.member.roles.cache.has(staffGroup.id)) return message.reply({embed: rolerequired});

    const outsideticket = new Discord.MessageEmbed()
        .setTitle("Incorrect Channel")
        .setDescription(`:warning: You cannot execute this command here. This command is used when closing a ticket.`)
        .setColor(supportbot.WarningColour); 
    if (!message.channel.name.startsWith(`${supportbot.Ticket_Channel_Name}-`)) return message.channel.send({embed: outsideticket});

    let rUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));

    const cantfinduser = new Discord.MessageEmbed()
        .setTitle("Invalid User!")
        .setDescription(`:warning: This user doesn't exist, Are they in this server?\n\nTry Again:\`${supportbot.Prefix}${supportbot.Remove_Command} <user#0000>\``)
        .setColor(supportbot.WarningColour); 
    if(!rUser) return message.channel.send({embed: cantfinduser});
    
    message.channel.updateOverwrite(rUser, { VIEW_CHANNEL: false, CREATE_INVITE: false, SEND_MESSAGES: false, READ_MESSAGES: false });

    const useradded = new Discord.MessageEmbed()
        .setColor(supportbot.EmbedColour) 
        .setTitle("User Removed")
        .setDescription(`👍 ${rUser} has been removed from this ticket`)
        .setTimestamp();

    message.channel.send({embed: useradded});

};

exports.help = {
    name: supportbot.Remove_Command,
  }
