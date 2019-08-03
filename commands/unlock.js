// SupportBot
// Command: Lockchat

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

exports.run = async(bot, message, args) => {
    message.delete();

    let staffGroup = message.guild.roles.find(staffRole => staffRole.name === `${bot.settings.staff}`)
    let lockedRole = message.guild.roles.find(lc => lc.name === `${bot.settings.locked_role}`)

    const rolemissing = new Discord.RichEmbed()
        .setDescription(`:x: Looks like this server doesn't have the role **${bot.settings.staff}**`)
        .setColor(bot.settings.colour)
    if (!staffGroup) return message.reply(rolemissing).catch(err=>{console.error(err)})
        
    const donothaverole = new Discord.RichEmbed()
        .setDescription(`:x: Sorry! You cannot use this command with the role **${bot.settings.staff}**`)
        .setColor(bot.settings.colour)
    if (!message.member.roles.has(staffGroup.id)) return message.reply(donothaverole)
    
    message.channel.overwritePermissions(lockedRole, { READ_MESSAGES: true, SEND_MESSAGES: true });
    message.channel.overwritePermissions(staffGroup, { READ_MESSAGES: true, SEND_MESSAGES: true });
    const lockmsg = new Discord.RichEmbed()
        .setDescription(":white_check_mark: **Chat Un-Locked**")
        .setColor(bot.settings.colour)
    message.channel.send(lockmsg)

    console.log(`\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.UnLockchat_Command}`)

    const CMDLog = new Discord.RichEmbed()
        .setTitle(bot.settings.Commands_Log_Title)
        .addField(`User`, `<@${message.author.id}>`)
        .addField(`Command`, bot.settings.UnLockchat_Command, true)
        .addField(`Executed At`, message.createdAt, true)
        .setColor(bot.settings.colour)
        .setFooter(bot.settings.footer)

    let CommandLog = message.guild.channels.find(LogsChannel => LogsChannel.name === `${bot.settings.Command_Log_Channel}`);
    if(!CommandLog) return message.channel.send(`:x: Error! Could not find the logs channel. **${bot.settings.Command_Log_Channel}**\nThis can be changed via ``settings.json```);
    
    CommandLog.send(CMDLog);


}

exports.help = {
    name: bot.settings.UnLockchat_Command,
}