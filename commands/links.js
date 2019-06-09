// SupportBot
// Command: Help

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

exports.run = (bot, message, args) => {
    message.delete();

    let BotLinks = "";
        BotLinks += `[${bot.settings.LINK_1_NAME}](${bot.settings.LINK_1})\n`;
        BotLinks += `[${bot.settings.LINK_2_NAME}](${bot.settings.LINK_2})\n`;
        BotLinks += `[${bot.settings.LINK_3_NAME}](${bot.settings.LINK_3})\n`;

    const links = new Discord.RichEmbed()
        .setTitle(`${bot.settings.LINKS_TITLE}`)
        .setDescription(BotLinks)
        .setColor(bot.settings.colour)
        .setFooter(bot.settings.footer)
    message.channel.send(links)

    console.log(`\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.Link_Command}`)

}

exports.help = {
    name: bot.settings.Link_Command,
}