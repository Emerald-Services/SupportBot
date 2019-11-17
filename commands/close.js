// SupportBot
// Command: Close Ticket

const Discord = require( "discord.js" );
const bot = new Discord.Client()

bot.settings = require( "../settings.json" );

/**
 * @param {Discord.Message} message
 */
exports.run = ( bot, message, args ) => {
    message.delete();


    if ( !message.channel.name.startsWith( `ticket-` ) ) {
        const embed = new Discord.RichEmbed()
            .setDescription( `:x: Cannot use this command becase you are outside a ticket channel.` )
            .setColor( bot.settings.colour );

        message.channel.send( embed );
        return;
    }

    const closeRequestEmbed = new Discord.RichEmbed()
        .setDescription( `Looks like you have come to the end of your support ticket\nPlease confirm that you want to close your ticket by saying ||**confirm**||` )
        .setFooter( "Your request will be avoided in 20 seconds" )
        .setColor( bot.settings.colour )


    message.channel.send( closeRequestEmbed ).then( m => {
        message.channel.awaitMessages( response => response.content.toLowerCase() === `confirm`, {
            max: 1,
            time: 20 * 1000,
            errors: [ 'time' ],

        } ).then( collected => {
            let logChannel = message.guild.channels.find( channel => channel.name === bot.settings.Transcript_Logs );

            let user = message.author;

            let reason = args.join( " " ) || "No reason provided.";

            let name = message.channel.name;
            let ticketChannel = message.channel;

            message.channel.send( bot.settings.Ticket_Closing )
                .then( () => {
                    const logEmbed = new Discord.RichEmbed()
                        .setTitle( bot.settings.Transcript_Title )
                        .setColor( bot.settings.colour )
                        .setFooter( bot.settings.footer )
                        .addField( "Ticket Author", user )
                        .addField( "Closed By", message.author.tag )
                        .addField( "Reason", reason );

                    message.channel.fetchMessages( { limit: 100 } )
                        .then( msgs => {
                            let txt = '';

                            msgs = msgs.sort( ( a, b ) => a.createdTimestamp - b.createdTimestamp );

                            txt += `${message.guild.name}\n`;
                            txt += `#${ticketChannel.name}\n`;
                            txt += `${msgs.size} messages\n\n\n`;

                            msgs.forEach( msg => {
                                if ( msg.content ) {
                                    txt += `----- ${msg.author.tag} at ${msg.createdAt}\n`;
                                    txt += `${msg.content}\n`;
                                    txt += `-----\n\n`;
                                }
                            } );

                            message.author.send( `A transcript has been generated for the ticket you closed.` );
                            message.author.send( new Discord.Attachment( Buffer.from( txt ), `${name}.txt` ) );

                            logChannel.send( logEmbed );
                            logChannel.send( new Discord.Attachment( Buffer.from( txt ), `${name}.txt` ) );

                            message.channel.delete();

                            // message.channel.fetchMessages( { limit: 100, before: msgs.last().id } )

                            //     .then( msg => {
                            //         const merged = msgs.concat( msg );
                            //         const output = merged.reduce( ( out, msg ) => {
                            //             out += `[${message.createdAt}] ${message.author.tag}: ${message.cleanContent ? message.cleanContent.replace( /\n/g, '\r\n' ) : ''}\r\n`;
                            //             return out;
                            //         }, '' );

                            //         log.send( { files: [ { attachment: Buffer.from( output, 'utf8' ), name: `${name}.txt` } ] } ).then( c.delete() ).catch( console.error ); // sends the file to logs
                            //         return log.send( embed1 ).catch( console.error );
                            //     } )
                        } );
                } )

        } ).catch( () => {
            m.edit( 'The request to close the ticket has timed out.' ).then( m2 => m2.delete( 3000 ) );
        } );
    } );

    console.log( `\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.Close_Command}` )

    const CMDLog = new Discord.RichEmbed()
        .setTitle( bot.settings.Commands_Log_Title )
        .addField( `User`, `<@${message.author.id}>` )
        .addField( `Command`, bot.settings.Close_Command, true )
        .addField( `Channel`, message.channel, true )
        .addField( `Executed At`, message.createdAt, true )
        .setColor( bot.settings.colour )
        .setFooter( bot.settings.footer )

    let CommandLog = message.guild.channels.find( LogsChannel => LogsChannel.name === `${bot.settings.Command_Log_Channel}` );
    if ( !CommandLog ) return message.channel.send( `:x: Error! Could not find the logs channel. **${bot.settings.Command_Log_Channel}**\nThis can be changed via ``settings.json``` );

    CommandLog.send( CMDLog );


}


exports.help = {
    name: bot.settings.Close_Command,
}
