// SupportBot 6.0, Created by Emerald Services
// Links Command

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const { execute } = require("./help");
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: "bob",

    execute(message, args) {
        console.log(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[32m`, `${message.author.tag} has executed ${supportbot.Prefix}${supportbot.CloseTicket}!`);
        
        if (supportbot.Close === "staff") {
            member.roles.cache.has(``)
        }

        if (supportbot.Close === "user") {

        }
    }
};