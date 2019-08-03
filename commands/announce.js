// SupportBot
// Command: Say

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

exports.run = async(bot, message, args) => {
    message.delete();

    let staffGroup = message.guild.roles.find(staffRole => staffRole.name === `${bot.settings.staff}`)

    const rolemissing = new Discord.RichEmbed()
        .setDescription(`:x: Looks like this server doesn't have the role **${bot.settings.staff}**`)
        .setColor(bot.settings.colour)
    if (!staffGroup) return message.reply(rolemissing).catch(err=>{console.error(err)})
        
    const donothaverole = new Discord.RichEmbed()
        .setDescription(`:x: Sorry! You cannot use this command with the role **${bot.settings.staff}**`)
        .setColor(bot.settings.colour)
    if (!message.member.roles.has(staffGroup.id)) return message.reply(donothaverole)

    const embed = new Discord.RichEmbed()
        .setTitle(`${bot.settings.Announcement_Title}`)
        .setDescription(args.join(" "))
        .setTimestamp()
        .setColor(bot.settings.colour)
        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.displayAvatarURL)
    
    let ac = message.guild.channels.find(AnnounceChannel => AnnounceChannel.name === `${bot.settings.Announcement_Channel}`)
    if(!ac) return message.channel.send(`:x: Error! Could not find the logs channel **${bot.settings.Announcement_Channel}**`)

    ac.send(embed)
 //   ac.send("@everyone")

    const SuggestionSuccessEmbed = new Discord.RichEmbed()
        .setDescription(`:white_check_mark: You have successfully created an announcement. <#${ac.id}>`)
        .setColor(bot.settings.colour)
    message.channel.send(SuggestionSuccessEmbed);

    console.log(`\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.Announcement_Command}`)

    const CMDLog = new Discord.RichEmbed()
        .setTitle(bot.settings.Commands_Log_Title)
        .addField(`User`, `<@${message.author.id}>`)
        .addField(`Command`, bot.settings.Announcement_Command, true)
        .addField(`Channel`, message.channel, true)
        .addField(`Executed At`, message.createdAt, true)
        .setColor(bot.settings.colour)
        .setFooter(bot.settings.footer)

    let CommandLog = message.guild.channels.find(LogsChannel => LogsChannel.name === `${bot.settings.Command_Log_Channel}`);
    if(!CommandLog) return message.channel.send(`:x: Error! Could not find the logs channel. **${bot.settings.Command_Log_Channel}**\nThis can be changed via ``settings.json```);
    
    CommandLog.send(CMDLog);


}

exports.help = {
    name: bot.settings.Announcement_Command,
}