// SupportBot
// Created by © 2020 Emerald Services
// Command: Close

const Discord = require("discord.js");
const bot = new Discord.Client();

const fs = require("fs");
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

/**
 * @param {Discord.Message} message
 */

exports.run = (bot, message, args) => {

    console.log(`\u001b[33m`, `[${supportbot.Bot_Name}] > `, `\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${supportbot.Prefix}${supportbot.Close_Command}`);

    if ( !message.channel.name.startsWith( `${supportbot.Ticket_Channel_Name}-` ) ) {
        const embed = new Discord.MessageEmbed()
            .setTitle("Incorrect Channel")
            .setDescription(`:warning: You cannot execute this command here. This command is used when closing a ticket.`)
            .setColor(supportbot.WarningColour); 
        message.channel.send(embed);
        return;
    }

    const closeRequestEmbed = new Discord.MessageEmbed()
        .setDescription(`**${supportbot.Ticket_Closure}**`)
        .addField("Please confirm by repeating the following word..", `||**${supportbot.Closure_Confirm_Word}**||`)
        .setFooter("Your request will be avoided in 20 seconds")
        .setColor(supportbot.EmbedColour)


    message.channel.send(closeRequestEmbed).then( m => {
        message.channel.awaitMessages( response => response.content.toLowerCase() === supportbot.Closure_Confirm_Word, {
            max: 1,
            time: 20000,
            errors: [ 'time' ],

        } ).then( collected => {
            let logChannel = message.guild.channels.cache.find(channel => channel.name === supportbot.Transcript_Log);

            let user = message.author;

            let reason = args.join(" ") || "No reason provided.";

            let name = message.channel.name;
            let ticketChannel = message.channel;

            message.channel.send(`**${supportbot.Ticket_Closing}**`)
                .then(() => {
                    const logEmbed = new Discord.MessageEmbed()
                        .setTitle(supportbot.Transcript_Title)
                        .setColor(supportbot.EmbedColour)
                        .setFooter(supportbot.EmbedFooter)
                        .addField("Ticket Author", user)
                        .addField("Closed By", message.author.tag)
                        .addField("Reason", reason);

                    message.channel.messages.fetch({ limit: 100 })
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

                           // message.author.send( `A transcript has been generated for the ticket you closed.` );
                           // message.author.send( new Discord.Attachment( Buffer.from( txt ), `${name}.txt` ) );
                           
                            logChannel.send(logEmbed).catch(err => {
                                message.reply(err)
                            })
                            logChannel.send( new Discord.MessageAttachment( Buffer.from( txt ), `${name}.txt` ) );

                            message.channel.delete();

                            // message.channel.messages.fetch( { limit: 100, before: msgs.last().id } )

                            //     .then( msg => {
                            //         const merged = msgs.concat( msg );
                            //         const output = merged.reduce( ( out, msg ) => {
                            //             out += `[${message.createdAt}] ${message.author.tag}: ${message.cleanContent ? message.cleanContent.replace( /\n/g, '\r\n' ) : ''}\r\n`;
                            //             return out;
                            //         }, '' );

                            //         log.send( { files: [ { attachment: Buffer.from( output, 'utf8' ), name: `${name}.txt` } ] } ).then( c.delete() ).catch( console.error ); // sends the file to logs
                            //         return log.send( embed1 ).catch( console.error );
                            //     } )
                        });
                })

        }).catch( () => {
            m.edit('The request to close the ticket has timed out.').then( m2 => m2.delete( 3000 ) );
        });
    });

}


exports.help = {
    name: supportbot.Close_Command,
}
