// SupportBot
// Command: Suggest

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

exports.run = async(bot, message, args) => {
    message.delete();

    const SuggestionEmbed = new Discord.RichEmbed()
        .setTitle(`${bot.settings.Suggestion_Title}`)
        .setDescription(args.join(" "))
        .setFooter(`Suggestion by ${message.author.username}`, message.author.displayAvatarURL)
        .setColor(bot.settings.colour)

    let sc = message.guild.channels.find(SuggestionChannel => SuggestionChannel.name === `${bot.settings.Suggestion_Channel}`);
    if(!sc) return message.channel.send(`:x: Error! Could not find the suggestion channel **${bot.settings.Suggestion_Channel}**`);
    
    sc.send(SuggestionEmbed)

    .then(async function(msg) {
        msg.react(bot.settings.suggestyes).then(() => msg.react(bot.settings.suggestno));
    });

    console.log(`\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.Suggest_Command}`)

}

exports.help = {
    name: bot.settings.Suggest_Command,
}