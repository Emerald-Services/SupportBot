// SupportBot
// Command: Forceclose Ticket

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

exports.run = (bot, message, args) => {
    message.delete();

    let staffGroup = message.guild.roles.find(staffRole => staffRole.name === `${bot.settings.support}`)

const rolemissing = new Discord.RichEmbed()
    .setDescription(`:x: Looks like this server doesn't have the role **${bot.settings.support}**`)
    .setColor(bot.settings.colour)    
if (!staffGroup) return message.reply({embed: rolemissing});
    
const donothaverole = new Discord.RichEmbed()
    .setDescription(`:x: Sorry! You cannot use this command with the role **${bot.settings.support}**`)
    .setColor(bot.settings.colour)    
if (!message.member.roles.has(staffGroup.id)) return message.reply({embed: donothaverole});

const outsideticket = new Discord.RichEmbed()
    .setDescription(`:x: Cannot use this command becase you are outside a ticket channel.`)
    .setColor(bot.settings.colour)    
if (!message.channel.name.startsWith(`ticket-`)) return message.channel.send({embed: outsideticket});
message.channel.delete();

console.log(`\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.Forceclose_Command}`)

}

exports.help = {
    name: bot.settings.Forceclose_Command,
}