// SupportBot
// Command: Suggest

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

exports.run = async(bot, message, args) => {
    message.delete();

    const SuggestionEmbed = new Discord.RichEmbed()
        .setTitle(`${bot.settings.Suggestion_Title}`)
        .setDescription(`\`\`\`${args.join(" ")}\`\`\`\nFrom <@${message.author.id}>`)
        .setFooter(`${bot.settings.footer}`, message.author.avatarURL)
        .setTimestamp(new Date())
        .setColor(bot.settings.colour);
    
    let sc = message.guild.channels.find(SuggestionChannel => SuggestionChannel.name === `${bot.settings.Suggestion_Channel}`);
    if(!sc) return message.channel.send(`:x: Error! Could not find the suggestion channel **${bot.settings.Suggestion_Channel}**`);
    
    sc.send(SuggestionEmbed)

    .then(async function(msg) {
        msg.react(bot.settings.suggestyes).then(() => msg.react(bot.settings.suggestno));
    });

    const SuggestionSuccessEmbed = new Discord.RichEmbed()
        .setDescription(`:white_check_mark: You have successfully created your suggestion. <#${sc.id}>`)
        .setColor(bot.settings.colour)
    message.channel.send(SuggestionSuccessEmbed);

    console.log(`\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.Suggest_Command}`)

    const CMDLog = new Discord.RichEmbed()
        .setTitle(bot.settings.Commands_Log_Title)
        .addField(`User`, `<@${message.author.id}>`)
        .addField(`Command`, bot.settings.Suggest_Command, true)
        .addField(`Channel`, message.channel, true)
        .addField(`Executed At`, message.createdAt, true)
        .setColor(bot.settings.colour)
        .setFooter(bot.settings.footer)

    let CommandLog = message.guild.channels.find(LogsChannel => LogsChannel.name === `${bot.settings.Command_Log_Channel}`);
    if(!CommandLog) return message.channel.send(`:x: Error! Could not find the logs channel. **${bot.settings.Command_Log_Channel}**`);
    
    CommandLog.send(CMDLog);

}

exports.help = {
    name: bot.settings.Suggest_Command,
}
