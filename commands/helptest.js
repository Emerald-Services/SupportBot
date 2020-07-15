// SupportBot 6.0, Created by Emerald Services
// Links Command

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const { execute } = require("./help");
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.LinksCommand,
    description: supportbot.LinksDesc,

    execute(message, args) {
        
        const LinksEmbed = new Discord.MessageEmbed()
            .setColor(supportbot.EmbedColour)

        let botLinks = supportbot.HELP;
        
        let links = '';
        
        for ( let name in botLinks ) {
            links += `[${name}](${botLinks[ name ]})\n`;
        };

        LinksEmbed.addField(supportbot.HelpTitle, links)

        message.channel.send({ embed: LinksEmbed });

    }
};