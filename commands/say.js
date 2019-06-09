// SupportBot
// Command: Say

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

exports.run = (bot, message, args) => {
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

    console.log(`\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.Say_Command}`)

}

exports.help = {
    name: bot.settings.Say_Command,
}