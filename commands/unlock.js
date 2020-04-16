// SupportBot
// Created by © 2020 Emerald Services
// Command: Say

const Discord = require("discord.js");
const bot = new Discord.Client();

const fs = require("fs");
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

exports.run = async(bot, message, args) => {

    console.log(`\u001b[33m`, `[${supportbot.Bot_Name}] > `, `\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${supportbot.Prefix}${supportbot.UnLockchat_Command}`);

    let staffGroup = message.guild.roles.cache.find(staffRole => staffRole.name === `${supportbot.StaffRole}`)
    let lockedRole = message.guild.roles.cache.find(lc => lc.name === `${supportbot.locked_role}`)

    const rolerequired = new Discord.MessageEmbed()
        .setTitle("SupportBot Error!")
        .setDescription(`:x: **Error!** Incorrect Permissions, You cannot execute this command as you do not have the required role.\n\nRole Required: \`${supportbot.StaffRole}\`\n\nError Code: \`SB-02\``)
        .setColor(supportbot.ErrorColour); 
    if (!message.member.roles.cache.has(staffGroup.id)) return message.reply({embed: rolerequired});
    
    message.channel.overwritePermissions(lockedRole, { READ_MESSAGES: true, SEND_MESSAGES: true });
    message.channel.overwritePermissions(staffGroup, { READ_MESSAGES: true, SEND_MESSAGES: true });

    const lockmsg = new Discord.MessageEmbed()
        .setDescription(":white_check_mark: **Chat Un-Locked**")
        .setColor(supportbot.EmbedColour);
    message.channel.send(lockmsg);

};

exports.help = {
    name: supportbot.UnLockchat_Command,
}
