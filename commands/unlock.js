// SupportBot
// Command: Lockchat

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

exports.run = async(bot, message, args) => {
    message.delete();

    let staffGroup = message.guild.roles.find(staffRole => staffRole.name === `${bot.settings.staff}`)
    let everyoneRole = message.guild.roles.find(everyone => everyone.name === `${bot.settings.everyone}`)

    const rolemissing = new Discord.RichEmbed()
        .setDescription(`:x: Looks like this server doesn't have the role **${bot.settings.staff}**`)
        .setColor(bot.settings.colour)
    if (!staffGroup) return message.reply(rolemissing).catch(err=>{console.error(err)})
        
    const donothaverole = new Discord.RichEmbed()
        .setDescription(`:x: Sorry! You cannot use this command with the role **${bot.settings.staff}**`)
        .setColor(bot.settings.colour)
    if (!message.member.roles.has(staffGroup.id)) return message.reply(donothaverole)
    
    message.channel.overwritePermissions(everyoneRole, { READ_MESSAGES: true, SEND_MESSAGES: true });

    const lockmsg = new Discord.RichEmbed()
        .setDescription(":white_check_mark: **Chat Un-Locked**")
        .setColor(bot.settings.colour)
    message.channel.send(lockmsg)

    console.log(`\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.UnLockchat_Command}`)

}

exports.help = {
    name: bot.settings.UnLockchat_Command,
}