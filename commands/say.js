// SupportBot
// Created by © 2020 Emerald Services
// Command: Say

const Discord = require("discord.js");
const bot = new Discord.Client();

const fs = require("fs");
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

exports.run = (bot, message, args) => {

    console.log(`\u001b[33m`, `[${supportbot.Bot_Name}] > `, `\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${supportbot.Prefix}${supportbot.Say_Command}`);

    let staffGroup = message.guild.roles.find(staffRole => staffRole.name === `${supportbot.StaffRole}`)

    const rolemissing = new Discord.MessageEmbed()
        .setDescription(`:x: Looks like this server doesn't have the role **${supportbot.StaffRole}**`)
        .setColor(supportbot.EmbedColour)
    if (!staffGroup) return message.reply(rolemissing).catch(err=>{console.error(err)})
        
    const donothaverole = new Discord.MessageEmbed()
        .setDescription(`:x: Sorry! You cannot use this command with the role **${supportbot.StaffRole}**`)
        .setColor(supportbot.EmbedColour)
    if (!message.member.roles.has(staffGroup.id)) return message.reply(donothaverole)
    
    const embed = new Discord.MessageEmbed()
        .setTitle(`${supportbot.Announcement_Title}`)
        .setDescription(args.join(" "))
        .setTimestamp()
        .setColor(supportbot.EmbedColour)
        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.displayAvatarURL)

    message.channel.send(embed);

};

exports.help = {
    name: supportbot.Say_Command,
}
