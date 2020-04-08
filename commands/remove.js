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

    let staffGroup = message.guild.roles.find(staffRole => staffRole.name === supportbot.StaffRole)

    const rolemissing = new Discord.MessageEmbed()
        .setDescription(`:x: Looks like this server doesn't have the role **${supportbot.StaffRole}**`)
        .setColor(supportbot.EmbedColour) 
    if (!staffGroup) return message.reply({embed: rolemissing});

    const donothaverole = new Discord.MessageEmbed()
        .setDescription(`:x: Sorry! You cannot use this command with the role **${supportbot.StaffRole}**`)
        .setColor(supportbot.EmbedColour) 
    if (!message.member.roles.has(staffGroup.id)) return message.reply({embed: donothaverole});

    const outsideticket = new Discord.MessageEmbed()
        .setDescription(`:x: Cannot use this command becase you are outside a ticket channel.`)
        .setColor(supportbot.EmbedColour) 
    if (!message.channel.name.startsWith(`${supportbot.Ticket_Channel_Name}-`)) return message.channel.send({embed: outsideticket});

    let rUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));

    const cantfinduser = new Discord.MessageEmbed()
        .setDescription(`:x: Hmm! Does that user exist? I cannot find the user.`)
        .setColor(supportbot.EmbedColour) 
    if(!rUser) return message.channel.send({embed: cantfinduser});

    const channel = message.guild.channels.find(channel => channel.name === message.channel.name);

    const cantfindchannel = new Discord.MessageEmbed()
        .setDescription(`:x: Hmm! Does that ticket exist? I cannot find the ticket channel.`)
        .setColor(supportbot.EmbedColour) 
    if(!channel) return message.channel.send({embed: cantfindchannel});
   // message.delete().catch(O_o=>{});

    message.channel.overwritePermissions(rUser, { READ_MESSAGES: false, SEND_MESSAGES: false });

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
