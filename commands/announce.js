// SupportBot
// Created by © 2020 Emerald Services
// Command: Announce (including @everyone)

const Discord = require("discord.js");
const bot = new Discord.Client();

bot.settings = require("../settings.json");

exports.run = (bot, message, args) => {
    message.delete();

    console.log(`\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${bot.settings.prefix}${bot.settings.Announcement_Command}`);
    
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

    ac.send("@everyone").then((msg) => {
        ac.send(embed);
    });

    const AccSuccessEmbed = new Discord.RichEmbed()
        .setTitle("Announcement Created")
        .setDescription(`👍 Successfully sent your announcement to <#${ac.id}>`)
        .setColor(bot.settings.colour)
    message.channel.send({embed: AccSucessEmbed});

}

exports.help = {
    name: bot.settings.Announcement_Command,
}
