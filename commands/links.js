// SupportBot
// Command: Help

const Discord = require( "discord.js" );
const bot = new Discord.Client()

bot.settings = require( "../settings.json" );

exports.run = ( bot, message, args ) => {
    message.delete();

    let botLinks = bot.settings.LINKS;

    let links = '';

    for ( let name in botLinks ) {
        links += `[${name}](${botLinks[ name ]})\n`;
    }

    let embed = new Discord.RichEmbed()
        .setTitle( bot.settings.LINKS_TITLE )
        .setDescription( links )
        .setColor( bot.settings.colour )
        .setFooter( bot.settings.footer )

    message.channel.send( embed );

    console.log( `\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.Link_Command}` )

    const CMDLog = new Discord.RichEmbed()
        .setTitle(bot.settings.Commands_Log_Title)
        .addField(`User`, `<@${message.author.id}>`)
        .addField(`Command`, bot.settings.Link_Command, true)
        .addField(`Channel`, message.channel, true)
        .addField(`Executed At`, message.createdAt, true)
        .setColor(bot.settings.colour)
        .setFooter(bot.settings.footer)

    let CommandLog = message.guild.channels.find(LogsChannel => LogsChannel.name === `${bot.settings.Command_Log_Channel}`);
    if(!CommandLog) return message.channel.send(`:x: Error! Could not find the logs channel. **${bot.settings.Command_Log_Channel}**\nThis can be changed via ``settings.json```);
    
    CommandLog.send(CMDLog);

}

exports.help = {
    name: bot.settings.Link_Command,
}