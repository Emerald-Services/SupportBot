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

    const SuggestionEmbed = new Discord.RichEmbed()
        .setTitle(`${supportbot.Suggestion_Title}`)
        .setDescription(`\`\`\`${args.join(" ")}\`\`\`\nFrom <@${message.author.id}>`)
        .setFooter(`${supportbot.EmbedFooter}`, message.author.avatarURL)
        .setTimestamp(new Date())
        .setColor(supportbot.EmbedColour)
    
    let sc = message.guild.channels.find(SuggestionChannel => SuggestionChannel.name === `${supportbot.Suggestion_Channel}`);
    if(!sc) return message.channel.send(`:x: Error! Could not find the suggestion channel **${supportbot.Suggestion_Channel}**`);
    
    sc.send(SuggestionEmbed)

    .then(async function(msg) {
        msg.react(supportbot.suggestyes).then(() => msg.react(supportbot.suggestno));
    });

    const SuggestionSuccessEmbed = new Discord.RichEmbed()
        .setDescription(`👍 Suggestion has been successfully created\nYou can view your suggestion in <#${sc.id}>`)
        .setColor(supportbot.EmbedColour)
    message.channel.send(SuggestionSuccessEmbed);

};

exports.help = {
    name: supportbot.Suggest_Command,
}
