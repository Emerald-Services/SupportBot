// SupportBot, Created by Emerald Services
// Close Command

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const { execute } = require("./help");
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.CloseTicket,
    description: supportbot.CloseTicketDesc,

    execute(message, args) {
        if (supportbot.DeleteMessages) message.delete();
        
        if (!message.channel.name.startsWith( `${supportbot.TicketChannel}-` )) {
            const Exists = new Discord.MessageEmbed()
                .setTitle("No Ticket Found!")
                .setDescription(`${supportbot.NoValidTicket}`)
                .setColor(supportbot.WarningColour);
            message.channel.send({ embed: Exists });

            return;

        }

        if (supportbot.CloseConfirmation) {
            const CloseTicketRequest = new Discord.MessageEmbed()
                .setTitle(`**${supportbot.ClosingTicket}**`)
                .setDescription(`Please confirm by repeating the following word.. \`${supportbot.ClosingConfirmation_Word}\` `)
                .setColor(supportbot.EmbedColour);

            message.channel.send(CloseTicketRequest).then(m => {
                message.channel.awaitMessages( response => response.content.toLowerCase() === supportbot.ClosingConfirmation_Word, {
                    max: 1,
                    time: 20000,
                    errors: [ 'time' ],

                    
                }).then( collected => {
                    let logChannel = message.guild.channels.cache.find(channel => channel.name === supportbot.TranscriptLog) || message.guild.channels.cache.find(channel => channel.id === supportbot.TranscriptLog)
                    let user = message.author;
                    let reason = args.join(" ") || "No Reason Provided.";

                    let name = message.channel.name;
                    let ticketChannel = message.channel;

                    message.channel.send(`**${supportbot.ClosingTicket}**`)

                    .then(() => {
                        const logEmbed = new Discord.MessageEmbed()
                            .setTitle(supportbot.TranscriptTitle)
                            .setColor(supportbot.EmbedColour)
                            .setFooter(supportbot.EmbedFooter)
                            .addField("Closed By", message.author.tag)
                            .addField("Reason", reason);

                        message.channel.messages.fetch({ limit: 100 }).then( msgs => {
                            let html = '';

                            msgs = msgs.sort( ( a, b ) => a.createdTimestamp - b.createdTimestamp );
                            html += `<strong>Server Name:</strong> ${message.guild.name}<br>`;
                            html += `<strong>Ticket:</strong> ${ticketChannel.name}<br>`;
                            html += `<strong>Message:</strong> ${msgs.size} Messages<br><br><br>`;

                            msgs.forEach( msg => {
                                if ( msg.content ) {
                                    html += `<strong>User:</strong> ${msg.author.tag}<br>`;
                                    html += `<strong>Message:</strong> ${msg.content}<br>`;
                                    html += `-----<br><br>`;
                                }
                            });

                            logChannel.send(logEmbed).catch(err => {
                                message.reply(err)
                            })

                            logChannel.send( new Discord.MessageAttachment( Buffer.from( html ), `${name}.html` ) );

                            message.channel.delete();

                        })
                    })

                })

            }).catch( () => {
                m.edit('The request to close the ticket has timed out.').then( m2 => m2.delete( 3000 ) );
            });

        }

        if (!supportbot.CloseConfirmation) {

                    let logChannel = message.guild.channels.cache.find(channel => channel.name === supportbot.TranscriptLog) || message.guild.channels.cache.find(channel => channel.id === supportbot.TranscriptLog)
                    let user = message.author;
                    let reason = args.join(" ") || "No Reason Provided.";

                    let name = message.channel.name;
                    let ticketChannel = message.channel;

                    message.channel.send(`**${supportbot.ClosingTicket}**`)

                    .then(() => {
                        const logEmbed = new Discord.MessageEmbed()
                            .setTitle(supportbot.TranscriptTitle)
                            .setColor(supportbot.EmbedColour)
                            .setFooter(supportbot.EmbedFooter)
                            .addField("Closed By", message.author.tag)
                            .addField("Reason", reason);

                        message.channel.messages.fetch({ limit: 100 }).then( msgs => {
                            let html = '';

                            msgs = msgs.sort( ( a, b ) => a.createdTimestamp - b.createdTimestamp );
                            html += `<strong>Server Name:</strong> ${message.guild.name}<br>`;
                            html += `<strong>Ticket:</strong> ${ticketChannel.name}<br>`;
                            html += `<strong>Message:</strong> ${msgs.size} Messages<br><br><br>`;

                            msgs.forEach( msg => {
                                if ( msg.content ) {
                                    html += `<strong>User:</strong> ${msg.author.tag}<br>`;
                                    html += `<strong>Message:</strong> ${msg.content}<br>`;
                                    html += `-----<br><br>`;
                                }
                            });

                            logChannel.send(logEmbed).catch(err => {
                                message.reply(err)
                            })

                            logChannel.send( new Discord.MessageAttachment( Buffer.from( html ), `${name}.html` ) );

                            message.channel.delete();

                        })

                    }).catch( () => {
                        m.edit('The request to close the ticket has timed out.').then( m2 => m2.delete( 3000 ) );
                    });

        }

    }
};
