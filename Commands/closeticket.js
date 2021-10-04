// SupportBot | Emerald Services
// Close Ticket Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./Data/supportbot.yml', 'utf8'));

const Command = require("../Structures/Command.js");
const TicketNumberID = require('../Structures/TicketID.js');

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
  }

module.exports = new Command({
	name: "close",
	description: "Close a support ticket",
	type: "BOTH",
	slashCommandOptions: [],
	permission: "SEND_MESSAGES",

	async run(message, args, client) {
        
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

                            logChannel.send({embeds: [logEmbed]}).catch(err => {
                                message.reply(err)
                            })


                            let file = new Discord.MessageAttachment( Buffer.from( html ), `${name}.html` )
                            logChannel.send({embeds: [logEmbed], files: [file]}).catch(err => {
                                message.reply(err)
                            })

                            message.channel.delete().catch(error => {
                                if (error.code !== Discord.Constants.APIErrors.UNKNOWN_CHANNEL) {
                                    console.error('Failed to delete the message:', error);
                                }
                            });


                        })
                    })

                })

            }).catch( () => {
                interaction.m.edit({content: 'The request to close the ticket has timed out.'}).then(m2 => setTimeout(() => channel.delete(3000)) );
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

                            logChannel.send({embeds: [logEmbed]}).catch(err => {
                                message.reply(err)
                            })

                            let file = new Discord.MessageAttachment( Buffer.from( html ), `${name}.html` )
                            logChannel.send({embeds: [logEmbed], files: [file]}).catch(err => {
                                message.reply(err)
                            })

                            message.channel.delete().catch(error => {
                                if (error.code !== Discord.Constants.APIErrors.UNKNOWN_CHANNEL) {
                                    console.error('Failed to delete the message:', error);
                                }
                            });

                        })

                    }).catch( () => {
                        interaction.m.edit({content: 'The request to close the ticket has timed out.'}).then(m2 => setTimeout(() => channel.delete(3000)) );
                    });

        }

	}
});
