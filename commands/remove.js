// SupportBot
// Command: Remove User

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

module.exports.run = async (bot, message, args) => {
    message.delete()

console.log(`\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.Add_Command}`)

let staffGroup = message.guild.roles.find(staffRole => staffRole.name === bot.settings.staff)

const rolemissing = new Discord.RichEmbed()
    .setDescription(`:x: Looks like this server doesn't have the role **${bot.settings.staff}**`)
    .setColor(bot.settings.colour) 
if (!staffGroup) return message.reply({embed: rolemissing});

const donothaverole = new Discord.RichEmbed()
    .setDescription(`:x: Sorry! You cannot use this command with the role **${bot.settings.staff}**`)
    .setColor(bot.settings.colour) 
if (!message.member.roles.has(staffGroup.id)) return message.reply({embed: donothaverole});

const outsideticket = new Discord.RichEmbed()
    .setDescription(`:x: Cannot use this command becase you are outside a ticket channel.`)
    .setColor(bot.settings.colour) 
if (!message.channel.name.startsWith(`ticket-`)) return message.channel.send({embed: outsideticket});

let rUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));

const cantfinduser = new Discord.RichEmbed()
    .setDescription(`:x: Hmm! Does that user exist? I cannot find the user.`)
    .setColor(bot.settings.colour) 
if(!rUser) return message.channel.send({embed: cantfinduser});

const channel = message.guild.channels.find(channel => channel.name === message.channel.name);

const cantfindchannel = new Discord.RichEmbed()
    .setDescription(`:x: Hmm! Does that ticket exist? I cannot find the ticket channel.`)
    .setColor(bot.settings.colour) 
if(!channel) return message.channel.send({embed: cantfindchannel});
message.delete().catch(O_o=>{});

message.channel.overwritePermissions(rUser, { READ_MESSAGES: false, SEND_MESSAGES: false });

const useradded = new Discord.RichEmbed()
    .setColor(bot.settings.colour) 
    .setDescription(`:white_check_mark: Successfully remove ${rUser} from the ticket.`)
    .setTimestamp();

message.channel.send({embed: useradded});
console.log(`\x1b[36m`, `${message.author} has successfully removed ${rUser} from ${message.channel}`)

    const CMDLog = new Discord.RichEmbed()
        .setTitle(bot.settings.Commands_Log_Title)
        .addField(`User`, `<@${message.author.id}>`)
        .addField(`Command`, bot.settings.Remove_Command, true)
        .addField(`Channel`, message.channel, true)
        .addField(`Executed At`, message.createdAt, true)
        .setColor(bot.settings.colour)
        .setFooter(bot.settings.footer)

    let CommandLog = message.guild.channels.find(LogsChannel => LogsChannel.name === `${bot.settings.Command_Log_Channel}`);
    if(!CommandLog) return message.channel.send(`:x: Error! Could not find the logs channel. **${bot.settings.Command_Log_Channel}**\nThis can be changed via ``settings.json```);
    
    CommandLog.send(CMDLog);

}

exports.help = {
    name: bot.settings.Remove_Command,
  }