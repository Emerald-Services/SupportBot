// SupportBot 6.0, Created by Emerald Services
// Links Command

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const { execute } = require("./help");
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.AnnounceCommand,

    execute(message, args) {

        let locateChannel = message.guild.channels.cache.find(AnnouncementChannel => AnnouncementChannel.name === supportbot.AnnouncementChannel);

        const errornochannel = new Discord.MessageEmbed()
            .setTitle("Invalid Channel")
            .setDescription(`:x: **Error!** Channel not Found, This command cannot be executed proberbly as their is no channel within this server.\nThis is configurable via **supportbot-config.yml**\n\nChannel Required: \`${supportbot.AnnouncementChannel}`)
            .setColor(supportbot.ErrorColour);

        if(!locateChannel) return message.channel.send({ embed: errornochannel });

        let serverAdmins = message.guild.roles.cache.find(adminRole => adminRole.name === supportbot.Admin);

        const NoPerms = new Discord.MessageEmbed()
            .setTitle("Invalid Permissions!")
            .setDescription(`:warning: **Err!** You do not have the correct permissions to use this command.\n\nRole Required: \`${supportbot.serverAdmins}\``)
            .setColor(supportbot.WarningColour)
        message.channel.send({ embed: NoPerms });


            const embed = new Discord.MessageEmbed()
                .setDescription(`> **${supportbot.AnnouncementStarter}**`)
	            .setColor(supportbot.EmbedColour)
            message.channel.send({ embed: embed });

            let announcement = []
            message.channel.awaitMessages(response => response.content.length > 2, {
                max: 1,
                time: 500000,
                errors: ['time'],
            }).then((collected) => {
                announcement.push(collected.map(r => r.content));

                const AnnouncementEmbed = new Discord.MessageEmbed()
                    .setTitle(supportbot.AnnouncementTitle)
                    .setThumbnail(supportbot.AnnouncementIcon)
                    .setDescription(announcement)
                    .setColor(supportbot.EmbedColour)
                    .setFooter(supportbot.EmbedFooter, message.author.displayAvatarURL());
                
                locateChannel.send({ embed: AnnouncementEmbed }).then(async function(msg) {
                    const AnnouncementComplete = new Discord.MessageEmbed()
                        .setColor(supportbot.SuccessColour)
                        .setDescription(`:white_check_mark: You have successfully created an announcement. <#${locateChannel.id}>`)
                    message.channel.send({ embed: AnnouncementComplete })
                })

            });

    }
    
};