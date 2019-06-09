// SupportBot
// Command: Ping

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

exports.run = (bot, message, args) => {
    message.delete();

    const embed = new Discord.RichEmbed()
        .setDescription(`:ping_pong: **Pong!** \`${bot.ping}ms\` `)
        .setColor(bot.settings.colour)
    message.channel.send(embed).catch(console.error);

    console.log(`\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.Ping_Command}`)

}

exports.help = {
    name: bot.settings.Ping_Command,
}