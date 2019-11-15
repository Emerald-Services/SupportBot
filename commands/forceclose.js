// SupportBot
// Command: Forceclose Ticket

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

exports.run = (bot, message, args) => {
    message.delete();

    let staffGroup = message.guild.roles.find(staffRole => staffRole.name === `${bot.settings.staff}`)

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
        const log = message.guild.channels.find(channel => channel.name === bot.settings.Transcript_Logs)
        const uID = message.author
        const reason = args.join(" ") || "No Reason Provided.";
        const name = message.channel.name;
        const c = message.channel;
      message.channel.send(`Your ticket is currently closing`)
      
      .then(() => {
            
        const embed1 = new Discord.RichEmbed()
            .setTitle(bot.settings.Transcript_Title)
            .setColor(bot.settings.colour)
            .setFooter(bot.settings.footer)
            .addField("Ticket Author", uID)
            .addField("Closed By", message.author.tag)
            .addField("Reason", reason)
        message.channel.fetchMessages({ limit: 100 })
        
        .then(msgs => {
            message.channel.fetchMessages({ limit: 100, before: msgs.last().id })
        
        .then(msg => {
            const merged = msgs.concat(msg);
            const output = merged.reduce((out, msg) => {
            out += `[${message.createdAt}] ${message.author.tag}: ${message.cleanContent ? message.cleanContent.replace(/\n/g, '\r\n') : ''}\r\n`;
            return out;
        }, '');

            log.send({ files: [{ attachment: Buffer.from(output, 'utf8'), name: `${name}.txt` }] }).then(c.delete()).catch(console.error); // sends the file to logs
            return log.send(embed1).catch(console.error);
        })
    });
})

 
console.log(`\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.Forceclose_Command}`)

    const CMDLog = new Discord.RichEmbed()
        .setTitle(bot.settings.Commands_Log_Title)
        .addField(`User`, `<@${message.author.id}>`)
        .addField(`Command`, bot.settings.Forceclose_Command, true)
        .addField(`Channel`, message.channel, true)
        .addField(`Executed At`, message.createdAt, true)
        .setColor(bot.settings.colour)
        .setFooter(bot.settings.footer)

    let CommandLog = message.guild.channels.find(LogsChannel => LogsChannel.name === `${bot.settings.Command_Log_Channel}`);
    if(!CommandLog) return message.channel.send(`:x: Error! Could not find the logs channel. **${bot.settings.Command_Log_Channel}**\nThis can be changed via ``settings.json```);
    
    CommandLog.send(CMDLog);

}

exports.help = {
    name: bot.settings.Forceclose_Command,
}
