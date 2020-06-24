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

        if (!message.channel.name.startsWith( `${TicketChannel}-` )) {
            const Exists = new Discord.MessageEmbed()
                .setTitle("Incorrect Channel")
                .setDescription(`:warning: You cannot execute this command here. This command is used when closing a ticket.`)
                .setColor(supportbot.WarningColour);
            message.channel.send({ embed: Exists });

            return;

        }

        if (supportbot.CloseConfirmation === "true") {
            const CloseTicketRequest = new Discord.MessageEmbed()
                .setDescription(`**${supportbot.ClosingTicket}**`)
                .addField("Please confirm by repeating the following word..", `**${supportbot.ClosingConfirmation_Word}**`)

        }


    }
};