// SupportBot, Created by Emerald Services
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
        if (supportbot.DeleteMessages) message.delete();
        
        console.log(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[32m`, `${message.author.tag} has executed ${supportbot.Prefix}${supportbot.LinksCommand}!`);

        const LinksEmbed = new Discord.MessageEmbed()
            .setColor(supportbot.EmbedColour)

        let botLinks = supportbot.LINKS;
        
        let links = '';
        
        for ( let name in botLinks ) {
            links += `[${name}](${botLinks[ name ]})\n`;
        };

        LinksEmbed.addField(supportbot.LinksTitle, links)

        message.channel.send({ embed: LinksEmbed });

    }
};
