// SupportBot Addons
// Default Addon

const Discord = require("discord.js");
const bot = new Discord.Client()
const someaddon = new Discord.Client()

bot.settings = require("../settings.json");
someaddon.settings = require("./settings/someaddon.json");

exports.run = async(bot, message, args) => {
    message.delete();
    
    message.channel.send(":white_check_mark: **SupportBot Addon**\nThis addon is here by default.\nWe are currently working on some super amazing addons for SupportBot\nHowever, If you would like to start creating your own support bot addon\ncontact us at EmeraldServices.\n")

}

exports.help = {
    name: someaddon.settings.Addon_Example_Command,
}
