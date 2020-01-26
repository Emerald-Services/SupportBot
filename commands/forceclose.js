// SupportBot
// Created by © 2020 Emerald Services
// Command: Forceclose

const Discord = require("discord.js");
const bot = new Discord.Client()

const fs = require("fs")
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

exports.run = async (bot, message, args) => {
    
    console.log(`\u001b[33m`, `[${supportbot.Bot_Name}] > `, `\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${supportbot.Prefix}${supportbot.Forceclose_Command}`);

    let staffGroup = message.guild.roles.find(staffRole => staffRole.name === `${supportbot.StaffRole}`)

    const rolemissing = new Discord.RichEmbed()
        .setDescription(`:x: Looks like this server doesn't have the role **${supportbot.StaffRole}**`)
        .setColor(supportbot.EmbedColour)    
    if (!staffGroup) return message.reply({embed: rolemissing});
    
    const donothaverole = new Discord.RichEmbed()
        .setDescription(`:x: Sorry! You cannot use this command with the role **${supportbot.StaffRole}**`)
        .setColor(supportbot.EmbedColour)    
    if (!message.member.roles.has(staffGroup.id)) return message.reply({embed: donothaverole});

    const outsideticket = new Discord.RichEmbed()
        .setDescription(`:x: Cannot use this command becase you are outside a ticket channel.`)
        .setColor(supportbot.EmbedColour)    
    if (!message.channel.name.startsWith(`${supportbot.Ticket_Channel_Name}-`)) return message.channel.send({embed: outsideticket});

    const log = message.guild.channels.find(channel => channel.name === supportbot.Transcript_Logs)
    const uID = message.author
    const reason = args.join(" ") || "No Reason Provided.";
    const name = message.channel.name;
    const c = message.channel;

    message.channel.send(`Your ticket is currently closing`)

    .then(() => {

        const embed1 = new Discord.RichEmbed()
            .setTitle(supportbot.Transcript_Title)
            .setColor(supportbot.EmbedColour)
            .setFooter(supportbot.EmbedFooter)
            .addField("Ticket Author", uID)
            .addField("Closed By", message.author.tag)
            .addField("Reason", reason)
        message.channel.fetchMessages({ limit: 100 })
        
        .then(msgs => {
            message.channel.fetchMessages({ limit: 100, before: msgs.last().id })
        
        .then(msg => {
            const merged = msgs.concat(msg);
            const output = merged.reduce((out, msg) => {
            out += `[${message.createdAt}] ${message.author.tag}: ${message.cleanContent ? message.cleanContent.replace(/\n/g, '\r\n') : ''}\r\n`;
            return out;
        }, '');

            log.send({ files: [{ attachment: Buffer.from(output, 'utf8'), name: `${name}.txt` }] }).then(c.delete()).catch(console.error); // sends the file to logs
            return log.send(embed1).catch(console.error);
        })
    });
});

}

exports.help = {
    name: supportbot.Forceclose_Command,
}
