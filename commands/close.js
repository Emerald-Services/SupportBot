// SupportBot
// Command: Close Ticket

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

exports.run = (bot, message, args) => {
    message.delete();

    const outsideticket = new Discord.RichEmbed()
    .setDescription(`:x: Cannot use this command becase you are outside a ticket channel.`)
    .setColor(bot.settings.colour)
if (!message.channel.name.startsWith(`ticket-`)) return message.channel.send({embed: outsideticket});
const close1 = new Discord.RichEmbed()
    .setDescription(`Looks like you have come to the end of your support ticket\nPlease confirm that you want to close your ticket by saying ||**confirm**||`)
    .setFooter("Your request will be avoided in 20 seconds")
    .setColor(bot.settings.colour)

message.channel.send({embed: close1}).then(m => {
    message.channel.awaitMessages(response => response.content === `confirm`, {
        max: 1,
        time: 10000,
        errors: ['time'],

    }).then((collected) => {
        const uID = message.author // Grabs
        const reason = args.join(" ") || "No Reason Provided."; //
        const name = message.channel.name; // channel name
        const log = message.guild.channels.find(channel => channel.name === bot.settings.Transcript_Logs);
        const c = message.channel;
        
        const closingEmbed = new Discord.RichEmbed()
            .setColor(bot.settings.colour)
            .setDescription(`**${uID}** ${Ticket_Closing}`)
      message.channel.send(closingEmbed).then(() => {
          
        const embed = new Discord.RichEmbed()
            .setColor(bot.settings.colour)
            .addField("Ticket Author", uID, true)
            .addField("Closed By", message.author.tag, true)
            .addField("Reason", reason, true)
                             
        const transcriptembed = new Discord.RichEmbed()
            .setTitle(bot.settings.Transcript_Title)
            .setColor(bot.settings.colour)
            .setFooter(bot.settings.footer)
            .addField("Ticket Author", uID, true)
            .addField("Closed By", message.author.tag, true)
            .addField("Reason", reason, true)
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
            log.send(transcriptembed).catch(console.error);
            
            })
        });
    })


    }).catch(() => {
        m.edit('Close ticket request, timedout').then(m2 => {
        m2.delete();
    }, 3000);

    });
});

console.log(`\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.Close_Command}`)

    const CMDLog = new Discord.RichEmbed()
        .setTitle(bot.settings.Commands_Log_Title)
        .addField(`User`, `<@${message.author.id}>`)
        .addField(`Command`, bot.settings.Close_Command, true)
        .addField(`Channel`, message.channel, true)
        .addField(`Executed At`, message.createdAt, true)
        .setColor(bot.settings.colour)
        .setFooter(bot.settings.footer)

    let CommandLog = message.guild.channels.find(LogsChannel => LogsChannel.name === `${bot.settings.Command_Log_Channel}`);
    if(!CommandLog) return message.channel.send(`:x: Error! Could not find the logs channel. **${bot.settings.Command_Log_Channel}**\nThis can be changed via ``settings.json```);

    CommandLog.send(CMDLog);


}

exports.help = {
    name: bot.settings.Close_Command,
}
