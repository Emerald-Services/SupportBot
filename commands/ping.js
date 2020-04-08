// SupportBot
// Created by © 2020 Emerald Services
// Command: Ping

const Discord = require("discord.js");
const bot = new Discord.Client();

const fs = require("fs");
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

exports.run = (bot, message, args) => {

    console.log(`\u001b[33m`, `[${supportbot.Bot_Name}] > `, `\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${supportbot.Prefix}${supportbot.Ping_Command}`);

    const embed = new Discord.MessageEmbed()
        .setDescription(`:ping_pong: **Pong!** \`${bot.ping}ms\` `)
        .setColor(supportbot.EmbedColour)
    message.channel.send(embed).catch(console.error);

};

exports.help = {
    name: supportbot.Ping_Command,
}
