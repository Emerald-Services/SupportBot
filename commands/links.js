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

}

exports.help = {
    name: bot.settings.Link_Command,
}