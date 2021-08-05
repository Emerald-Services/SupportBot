// SupportBot, Created by Emerald Services
// Ticket Command

const Discord = require("discord.js");
const bot = new Discord.Client()

const fs = require("fs")
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));
const TicketNumberID = require('../utils/TicketNumber.js');

module.exports = {
    name: supportbot.NewTicket,
    description: supportbot.NewTicketDesc,

    async execute(message, args) {
      if (!message.channel.name === supportbot.ReactionChannel || !message.channel.id === supportbot.ReactionChannel) {
        if (supportbot.DeleteMessages) message.delete();
      }

      let reactionUser = message.guild.members.cache.get(message.author.id)

      if (reactionUser.roles.cache.find(role => role.name === supportbot.TicketBlackListRole) || reactionUser.roles.cache.find(role => role.id === supportbot.TicketBlackListRole)) {
            return message.channel.send(`<@${message.author.id}> ${supportbot.TicketBlackListMessage}`).then(msg => {
                msg.delete({timeout: 3500})
            })
        }

      // Ticket ID
      let ticketNumberID = TicketNumberID.pad(message.guild.id);

      // Ticket Subject
      const TicketSubject = args || supportbot.NoTicketSubject;

      const channel = await message.guild.channels.create(`${supportbot.TicketChannel}-${ticketNumberID}`);

      if (message.channel.name === supportbot.ReactionChannel || message.channel.id === supportbot.ReactionChannel) {
        const CreatedTicket = new Discord.MessageEmbed()
            .setDescription(supportbot.TicketCreatedAlert.replace(/%ticketauthor%/g, message.author.id).replace(/%ticketid%/g, channel.id).replace(/%ticketusername%/g, message.author.username))
            .setColor(supportbot.EmbedColour)
        message.channel.send({embed: CreatedTicket}).then((r) => {
          r.delete({ timeout:5000 })
        })
      } else {
        const CreatedTicket = new Discord.MessageEmbed()
            .setDescription(supportbot.TicketCreatedAlert.replace(/%ticketauthor%/g, message.author.id).replace(/%ticketid%/g, channel.id).replace(/%ticketusername%/g, message.author.username))
            .setColor(supportbot.EmbedColour)
        message.channel.send({embed: CreatedTicket});
      }

        // Ticket Category
        let TicketCategory = message.guild.channels.cache.find(category => category.name === supportbot.TicketCategory) || message.guild.channels.cache.find(category => category.id === supportbot.TicketCategory)

        // Locate Roles
        let StaffMember = message.guild.roles.cache.find(SupportTeam => SupportTeam.name === supportbot.Staff) || message.guild.roles.cache.find(SupportTeam => SupportTeam.id === supportbot.Staff)
        let ServerAdmins = message.guild.roles.cache.find(AdminUser => AdminUser.name === supportbot.Admin) || message.guild.roles.cache.find(AdminUser => AdminUser.id === supportbot.Admin)

        if (TicketCategory) {
            channel.setParent(TicketCategory.id)
        }

        channel.updateOverwrite(message.guild.id, {
            SEND_MESSAGES: false,
            VIEW_CHANNEL: false
        })

        channel.updateOverwrite(message.author, {
            SEND_MESSAGES: true,
            VIEW_CHANNEL: true
        })

        channel.updateOverwrite(StaffMember, {
            SEND_MESSAGES: true,
            VIEW_CHANNEL: true
        })

        channel.updateOverwrite(ServerAdmins, {
            SEND_MESSAGES: true,
            VIEW_CHANNEL: true
        })

        // Ticket Created, Message Sent

        if (supportbot.AllowTicketMentions) {
            channel.send(`<@${message.author.id}>`)
          }
  
          const TicketMessage = new Discord.MessageEmbed()
            .setTitle(supportbot.Ticket_Title.replace(/%ticketauthor%/g, message.author.id).replace(/%ticketid%/g, channel.id).replace(/%ticketusername%/g, message.author.username))
            .setDescription(supportbot.TicketMessage.replace(/%ticketauthor%/g, message.author.id).replace(/%ticketid%/g, channel.id).replace(/%ticketusername%/g, message.author.username))
            .setColor(supportbot.EmbedColour)
  
          if (supportbot.TicketSubject === "embed") {
  
            if (TicketSubject != 'No Reason Provided.') {
              TicketMessage.addFields({ name: 'Reason', value: TicketSubject })
            }
            
          }
  
          if (supportbot.TicketSubject === "description") {
  
            if (TicketSubject != 'No Reason Provided.') {
              channel.setTopic(`Reason: ${TicketSubject}  -  User ID: ${message.author.id}  -  Ticket: ${channel.name}`)
            }
            
          }

        const reactionMessage = await channel.send({
            embed: TicketMessage
        }).then( async function(ticketmsg) {
            await ticketmsg.react(supportbot.TicketLockReaction)
            await ticketmsg.react(supportbot.TicketDeleteReaction)

                const collector = ticketmsg.createReactionCollector(
                    (reaction, user) => message.guild.roles.cache.find((staff) => staff.name === supportbot.Staff),
                    { dispose: true }
                );

              collector.on('collect', (reaction, user) => {
                switch (reaction.emoji.name) {
                    case supportbot.TicketLockReaction:

                        channel.updateOverwrite(message.author, { 
                          SEND_MESSAGES: false,
                          VIEW_CHANNEL: true 
                        });

                        const LockTicketEmbed = new Discord.MessageEmbed()
                            .setDescription(supportbot.TicketLockMessage)
                            .setColor(supportbot.EmbedColour)
                        channel.send({embed: LockTicketEmbed})
                        break;

                    case supportbot.TicketDeleteReaction:
                        const DeleteTicketEmbed = new Discord.MessageEmbed()
                            .setDescription(supportbot.TicketDeleteMessage)
                            .setColor(supportbot.EmbedColour)
                        channel.send({embed: DeleteTicketEmbed})

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

                                const TranscriptSavedEmbed = new Discord.MessageEmbed()
                                  .setDescription(supportbot.TranscriptSavedMessage)
                                  .setColor(supportbot.SuccessColour)
                                channel.send({embed: TranscriptSavedEmbed})
    
                                logChannel.send( new Discord.MessageAttachment( Buffer.from( html ), `${name}.html` ) );
                                setTimeout(() => channel.delete(), supportbot.TicketDeleteTime);
    
                            })
    
                        }).catch( () => {
                            m.edit('The request to close the ticket has timed out.').then( m2 => m2.delete( 3000 ) );
                        });
                        break;
                        
                }
            });
    
        })

          fs.writeFileSync("./storage/SupportTickets.json", '{\n    "ticket": "' + channel.name + '", \n    "id":' + message.author.id + "\n}", (err) => {
            if (!err) return;
            console.error(err)
        })
          // Ticket Logs
  
          const errornochannel = new Discord.MessageEmbed()
            .setTitle("SupportBot Error!")
            .setDescription(`:x: **Error!** Channel not Found, This command cannot be executed proberbly as their is no channel within this server.\nThis is configurable via **supportbot-config.yml**\n\nChannel Required: \`${supportbot.TicketLog}\`\n\nError Code: \`SB-03\``)
            .setColor(supportbot.ErrorColour);
  
          const TicketLogs = new Discord.MessageEmbed()
            .setTitle("Ticket Log")
            .setThumbnail(supportbot.Ticket_Thumbnail)
            .addFields(
              { name: 'Ticket', value: `<#${channel.id}>` },
              { name: 'User', value: `<@${message.author.id}>` },
            )
            .setColor(supportbot.EmbedColour)
            .setFooter(supportbot.EmbedFooter)
  
          let locateChannel = message.guild.channels.cache.find(LocateChannel => LocateChannel.name === supportbot.TicketLog) || message.guild.channels.cache.find(LocateChannel => LocateChannel.id === supportbot.TicketLog)
  
          if(!locateChannel) return message.channel.send({ embed: errornochannel });
  
          locateChannel.send({ embed: TicketLogs });
          

    }

}

