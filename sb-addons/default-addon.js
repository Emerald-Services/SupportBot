// SupportBot Addons
// Default Addon

const Discord = require("discord.js");
const bot = new Discord.Client()
const someaddon = new Discord.Client()

someaddon.settings = require("./settings/someaddon.json");

exports.run = async(bot, message, args) => {
    message.delete();
    
    message.channel.send(":white_check_mark: **SupportBot Addon**\nYou can download addons from our marketplace. https://emeraldservices.xyz/")

}

exports.help = {
    name: someaddon.settings.Addon_Example_Command,
}
