// SupportBot 6.0, Created by Emerald Services
// Links Command

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const { execute } = require("./help");
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.CloseTicket,
    description: supportbot.CloseTicketDesc,

    execute(message, args) {
        console.log(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[32m`, `${message.author.tag} has executed ${supportbot.Prefix}${supportbot.CloseTicket}!`);

        if (!message.channel.name.startsWith( `${supportbot.TicketChannel}-` )) {
            const Exists = new Discord.MessageEmbed()
                .setTitle("No Ticket Found!")
                .setDescription(`${supportbot.NoValidTicket}`)
                .setColor(supportbot.WarningColour);
            message.channel.send({ embed: Exists });

            return;

        }

        if (supportbot.CloseConfirmation === "true") {
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
                    let logChannel = message.guild.channels.cache.find(channel => channel.name === supportbot.TranscriptLog);
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
                            });

                            logChannel.send(logEmbed).catch(err => {
                                message.reply(err)
                            })

                            logChannel.send( new Discord.MessageAttachment( Buffer.from( txt ), `${name}.txt` ) );

                            message.channel.delete();

                        })
                    })

                })

            }).catch( () => {
                m.edit('The request to close the ticket has timed out.').then( m2 => m2.delete( 3000 ) );
            });

        }

        if (supportbot.CloseConfirmation === "false") {

                    let logChannel = message.guild.channels.cache.find(channel => channel.name === supportbot.TranscriptLog);
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
                            });

                            logChannel.send(logEmbed).catch(err => {
                                message.reply(err)
                            })

                            logChannel.send( new Discord.MessageAttachment( Buffer.from( txt ), `${name}.txt` ) );

                            message.channel.delete();

                        })

                    }).catch( () => {
                        m.edit('The request to close the ticket has timed out.').then( m2 => m2.delete( 3000 ) );
                    });

        }

    }
};