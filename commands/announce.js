// SupportBot
// Created by © 2020 Emerald Services
// Command: Announce (including @everyone)

const Discord = require("discord.js");
const bot = new Discord.Client();

const fs = require("fs")
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

exports.run = (bot, message, args) => {

    console.log(`\u001b[33m`, `[${supportbot.Bot_Name}] > `, `\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${supportbot.Prefix}${supportbot.Announcement_Command}`);
    
    let staffGroup = message.guild.roles.cache.find(staffRole => staffRole.name === supportbot.StaffRole);

    const rolerequired = new Discord.MessageEmbed()
        .setTitle("SupportBot Error!")
        .setDescription(`:x: **Error!** Incorrect Permissions, You cannot execute this command as you do not have the required role.\n\nRole Required: \`${supportbot.StaffRole}\`\n\nError Code: \`SB-02\``)
        .setColor(supportbot.ErrorColour); 
    if (!message.member.roles.cache.has(staffGroup.id)) return message.reply({embed: rolerequired});

    const embed = new Discord.MessageEmbed()
        .setTitle(`${supportbot.Announcement_Title}`)
        .setDescription(args.join(" "))
        .setTimestamp()
        .setColor(supportbot.EmbedColour)
        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.displayAvatarURL)

    let locateChannel = message.guild.channels.cache.find(LocateChannel => LocateChannel.name === `${supportbot.Announcement_Channel}`)

    const errornochannel = new Discord.MessageEmbed()
        .setTitle("SupportBot Error!")
        .setDescription(`:x: **Error!** Channel not Found, This command cannot be executed proberbly as their is no channel within this server.\nThis is configurable via **supportbot-config.yml**\n\nChannel Required: \`${supportbot.Announcement_Channel}\`\n\nError Code: \`SB-03\``)
        .setColor(supportbot.ErrorColour);
    if(!locateChannel) return message.channel.send(errornochannel);
        
    locateChannel.send(supportbot.everyone).then((msg) => {
        locateChannel.send(embed);
    });


    const AccSuccessEmbed = new Discord.MessageEmbed()
        .setTitle("Announcement Created")
        .setDescription(`👍 Successfully sent your announcement to <#${locateChannel.id}>`)
        .setColor(supportbot.EmbedColour)
    message.channel.send({embed: AccSuccessEmbed});

}

exports.help = {
    name: supportbot.Announcement_Command,
}
