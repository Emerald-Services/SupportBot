
// SupportBot
// Created by © 2020 Emerald Services
// Command: Say

const Discord = require("discord.js");
const bot = new Discord.Client();

const fs = require("fs");
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

exports.run = async(bot, message, args) => {
    
    console.log(`\u001b[33m`, `[${supportbot.Bot_Name}] > `, `\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${supportbot.Prefix}${supportbot.Suggest_Command}`);

    const SuggestionEmbed = new Discord.MessageEmbed()
        .setTitle(`${supportbot.Suggestion_Title}`)
        .setDescription(`\`\`\`${args.join(" ")}\`\`\`\nFrom <@${message.author.id}>`)
        .setThumbnail(message.author.avatarURL)
        .setFooter(`${supportbot.EmbedFooter}`)
        .setTimestamp(new Date())
        .setColor(supportbot.EmbedColour)

    let locateChannel = message.guild.channels.cache.find(LocateChannel => LocateChannel.name === `${supportbot.Suggestion_Channel}`)

    const errornochannel = new Discord.MessageEmbed()
        .setTitle("SupportBot Error!")
        .setDescription(`:x: **Error!** Channel not Found, This command cannot be executed proberbly as their is no channel within this server.\nThis is configurable via **supportbot-config.yml**\n\nChannel Required: \`${supportbot.Suggestion_Channel}\`\n\nError Code: \`SB-03\``)
        .setColor(supportbot.ErrorColour);
    if(!locateChannel) return message.channel.send(errornochannel);
        
    locateChannel.send(SuggestionEmbed)

    .then(async function(msg) {
        msg.react(supportbot.suggestyes).then(() => msg.react(supportbot.suggestno));
    });

    const SuggestionSuccessEmbed = new Discord.MessageEmbed()
        .setDescription(`👍 Suggestion has been successfully created\nYou can view your suggestion in <#${locateChannel.id}>`)
        .setColor(supportbot.EmbedColour)
    message.channel.send(SuggestionSuccessEmbed);

};

exports.help = {
    name: supportbot.Suggest_Command,
}
