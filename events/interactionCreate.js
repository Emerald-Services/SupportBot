// SupportBot Interaction Event
// SupportBot Created by Emerald Services

const fs = require("fs");
const { MessageEmbed, MessageAttachment, Permissions, MessageButton, MessageActionRow } = require("discord.js");
const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = async (bot, interaction, args) => {

	if (interaction.isCommand()) return;

    if(interaction.isButton()) {
        if(interaction.customId === 'openticket') {
            interaction.message.fetch()
            interaction.deferUpdate()
            let message = {
                guild: bot.guilds.cache.get(interaction.message.guildId),
                author: bot.users.cache.get(interaction.user.id),
                content: "N/A",
                channel: bot.channels.cache.get(interaction.message.channelId)
            }
            try {
                const cmd = bot.commands.get(supportbot.NewTicket);
                if(!cmd) return;
                cmd.execute(message, message.content)
            }
            catch (error){
               console.error(error) 
            }
        }
        if(interaction.customId === 'ticketclose') {
            if(interaction.channel.name.startsWith(`${supportbot.TicketChannel}-`)) {
                interaction.message.fetch()
                interaction.deferUpdate()
                const DeleteTicketEmbed = new MessageEmbed()
                    .setDescription(supportbot.TicketDeleteMessage)
                    .setColor(supportbot.EmbedColour)
                interaction.channel.send({embeds: [DeleteTicketEmbed]})

                let logChannel = interaction.guild.channels.cache.find(channel => channel.name === supportbot.TranscriptLog) || interaction.guild.channels.cache.find(channel => channel.id === supportbot.TranscriptLog)

                let user = interaction.user
                let name = interaction.channel.name;
                let ticketChannel = interaction.channel
                let reason = "No Reason Provided."

                interaction.channel.send({content: `**${supportbot.ClosingTicket}**`})
                .then(() => {
                    const logEmbed = new MessageEmbed()
                        .setTitle(supportbot.TranscriptTitle)
                        .setColor(supportbot.EmbedColour)
                        .setFooter(supportbot.EmbedFooter)
                        .addField("Closed By", user.username)
                        .addField("Reason", reason)

                    interaction.channel.messages.fetch({limit: 100}).then(msgs => {
                        let html = ''

                        msgs = msgs.sort( ( a, b ) => a.createdTimestamp - b.createdTimestamp );
                        html += `<strong>Server Name:</strong> ${interaction.guild.name}<br>`
                        html += `<strong>Ticket:</strong> ${ticketChannel.name}<br>`
                        html += `<strong>Message:</strong> ${msgs.size} Messages<br><br><br>`


                        msgs.forEach(msg => {
                            if(msg.content) {
                                html += `<strong>User:</strong> ${msg.author.tag}<br>`;
                                html += `<strong>Message:</strong> ${msg.content}<br>`;
                                html += `-----<br><br>`;
                            }
                        })

                        const TranscriptSavedEmbed = new MessageEmbed()
                            .setDescription(supportbot.TranscriptSavedMessage)
                            .setColor(supportbot.SuccessColour)
                        interaction.channel.send({embeds: [TranscriptSavedEmbed]})

                        let file = new MessageAttachment( Buffer.from( html ), `${name}.html` )
                        logChannel.send({embeds: [logEmbed], files: [file]})

                        setTimeout(() => interaction.channel.delete(), supportbot.TicketDeleteTime)

                    })
                })
            }
        }
        if(interaction.customId === 'ticketlock') {
            if(interaction.channel.name.startsWith(`${supportbot.TicketChannel}`)) {
                interaction.message.fetch()
                interaction.deferUpdate()
                let Admin = interaction.guild.roles.cache.find(AdminUser => AdminUser.name === supportbot.Admin) ||  interaction.guild.roles.cache.find(AdminUser => AdminUser.id === supportbot.Admin)
                let all = interaction.channel.permissionOverwrites.cache

                let parent = interaction.guild.channels.cache.find(c => c.name === `${supportbot.LockTicketCategory}`) || interaction.guild.channels.cache.find(c => c.id === `${supportbot.LockTicketCategory}`)
                if(parent) {
                    interaction.channel.setParent(parent.id)
                }

                all.forEach(perm => {
                    interaction.channel.permissionOverwrites.delete(perm.id)
                
                })
                interaction.channel.permissionOverwrites.create(Admin.id, {VIEW_CHANNEL: true})

                interaction.channel.permissionOverwrites.create(interaction.guild.id, {VIEW_CHANNEL: false})


                const ticketDeleteButton = new MessageButton()
                    .setCustomId('ticketclose')
                    .setLabel('Close')
                    .setStyle(supportbot.TicketDeleteColour)
                    .setEmoji(supportbot.TicketDeleteEmoji)

                const row = new MessageActionRow()
                    .addComponents(ticketDeleteButton)
                const ArchiveEmbed = new MessageEmbed()
                    .setTitle("Archived")
                    .setDescription(`Archived ${interaction.channel.name}`)
                    .setColor(`${supportbot.SuccessColour}`)

                interaction.channel.send({embeds: [ArchiveEmbed]})
                interaction.message.edit({components: [row]})
            }
        }
    }

}