// SupportBot
// Created by © 2020 Emerald Services
// Command: Announce (including @everyone)

const Discord = require("discord.js");
const bot = new Discord.Client();
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

exports.run = (bot, message, args) => {
    message.delete();

    console.log(`\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${supportbot.Prefix}${supportbot.Announcement_Command}`);
    
    let staffGroup = message.guild.roles.find(staffRole => staffRole.name === `${supportbot.StaffRole}`)

    const rolemissing = new Discord.RichEmbed()
        .setDescription(`:x: Looks like this server doesn't have the role **${supportbot.StaffRole}**`)
        .setColor(supportbot.EmbedColour)
    if (!staffGroup) return message.reply(rolemissing).catch(err=>{console.error(err)})
        
    const donothaverole = new Discord.RichEmbed()
        .setDescription(`:x: Sorry! You cannot use this command with the role **${supportbot.StaffRole}**`)
        .setColor(supportbot.EmbedColour)
    if (!message.member.roles.has(staffGroup.id)) return message.reply(donothaverole)

    const embed = new Discord.RichEmbed()
        .setTitle(`${supportbot.Announcement_Title}`)
        .setDescription(args.join(" "))
        .setTimestamp()
        .setColor(supportbot.EmbedColour)
        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.displayAvatarURL)
    
    let ac = message.guild.channels.find(AnnounceChannel => AnnounceChannel.name === `${supportbot.Announcement_Channel}`)
    if(!ac) return message.channel.send(`:x: Error! Could not find the logs channel **${supportbot.Announcement_Channel}**`)

    ac.send("@everyone").then((msg) => {
        ac.send(embed);
    });

    const AccSuccessEmbed = new Discord.RichEmbed()
        .setTitle("Announcement Created")
        .setDescription(`👍 Successfully sent your announcement to <#${ac.id}>`)
        .setColor(supportbot.EmbedColour)
    message.channel.send({embed: AccSucessEmbed});

}

exports.help = {
    name: supportbot.Announcement_Command,
}
