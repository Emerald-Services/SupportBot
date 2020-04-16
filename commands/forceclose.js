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

    let staffGroup = message.guild.roles.cache.find(staffRole => staffRole.name === supportbot.StaffRole);

    const rolerequired = new Discord.MessageEmbed()
        .setTitle("SupportBot Error!")
        .setDescription(`:x: **Error!** Incorrect Permissions, You cannot execute this command as you do not have the required role.\n\nRole Required: \`${supportbot.StaffRole}\`\n\nError Code: \`SB-02\``)
        .setColor(supportbot.ErrorColour); 
    if (!message.member.roles.cache.has(staffGroup.id)) return message.reply({embed: rolerequired});

    const outsideticket = new Discord.MessageEmbed()
        .setTitle("Incorrect Channel")
        .setDescription(`:warning: You cannot execute this command here. This command is used when closing a ticket.`)
        .setColor(supportbot.WarningColour);   
    if (!message.channel.name.startsWith(`${supportbot.Ticket_Channel_Name}-`)) return message.channel.send({embed: outsideticket});

    const log = message.guild.channels.cache.find(channel => channel.name === supportbot.Transcript_Log)
    const uID = message.author
    const reason = args.join(" ") || "No Reason Provided.";
    const name = message.channel.name;
    const c = message.channel;

    message.channel.send(`Your ticket is currently closing`)

    .then(() => {

        const embed1 = new Discord.MessageEmbed()
            .setTitle(supportbot.Transcript_Title)
            .setColor(supportbot.EmbedColour)
            .setFooter(supportbot.EmbedFooter)
            .addField("Ticket Author", uID)
            .addField("Closed By", message.author.tag)
            .addField("Reason", reason)
        message.channel.messages.fetch({ limit: 100 })
        
        .then(msgs => {
            message.channel.messages.fetch({ limit: 100, before: msgs.last().id })
        
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
