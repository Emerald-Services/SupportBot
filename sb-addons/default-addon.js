// SupportBot Addons
// Default Addon

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");
shot.settings = require("../shopconfig.json");

exports.run = async(bot, message, args) => {
    message.delete();
    
    let shop = shop.settings.SHOP;

    let SHOP = '';

    for ( let name in shop ) {
        SHOP += `${shop}\n`;
    }
    
    const Embed1 = new Discord.RichEmbed():
        .setTitle(shop.settings.SHOP_NAME)
        .setDescription(SHOP)
        .setColor(bot.settings.Colour)
        .setThumbnail(message.author.avatarURL)
    message.channel.send(Embed1)
    
    .then({
        message.react(':one:'); 
        message.react(':two:'); 
    })
}

exports.help = {
    name: 'addon',
}
