// SupportBot
// Created by © 2020 Emerald Services
// Command: Links

const Discord = require("discord.js");
const bot = new Discord.Client();

const fs = require("fs");
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

exports.run = ( bot, message, args ) => {

    console.log(`\u001b[33m`, `[${supportbot.Bot_Name}] > `, `\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${supportbot.Prefix}${supportbot.Link_Command}`);

    let botLinks = supportbot.LINKS;

    let links = '';

    for ( let name in botLinks ) {
        links += `[${name}](${botLinks[ name ]})\n`;
    };

    let embed = new Discord.MessageEmbed()
        .setTitle(supportbot.LINKS_TITLE)
        .setDescription(links)
        .setColor(supportbot.EmbedColour)
        .setFooter(supportbot.EmbedFooter);
    message.channel.send(embed);

};

exports.help = {
    name: supportbot.Link_Command,
};
