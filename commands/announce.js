// SupportBot, Created by Emerald Services
// Announce

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const { execute } = require("./help");
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.AnnounceCommand,
    description: supportbot.AnnounceDesc,

    execute(message, args) {
	    
	if (supportbot.DeleteMessages) message.delete();
	    
        let locateChannel = message.guild.channels.cache.find(AnnouncementChannel => AnnouncementChannel.name === supportbot.AnnouncementChannel) || message.guild.channels.cache.find(AnnouncementChannel => AnnouncementChannel.id === supportbot.AnnouncementChannel)

        console.log(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[32m`, `${message.author.tag} has executed ${supportbot.Prefix}${supportbot.AnnounceCommand}!`);

        const errornochannel = new Discord.MessageEmbed()
            .setTitle("Invalid Channel")
            .setDescription(`${supportbot.InvalidChannel}\n\nChannel Required: \`${supportbot.AnnouncementChannel}`)
            .setColor(supportbot.ErrorColour);

        if(!locateChannel) return message.channel.send({ embed: errornochannel });

        let Admins = message.guild.roles.cache.find(adminRole => adminRole.name === supportbot.Admin) || message.guild.roles.cache.find(adminRole => adminRole.id === supportbot.Admin)

        const NoPerms = new Discord.MessageEmbed()
            .setTitle("Invalid Permissions!")
            .setDescription(`${supportbot.IncorrectPerms}\n\nRole Required: \`${Admins.name}\``)
            .setColor(supportbot.WarningColour)

            if (!message.member.roles.cache.has(Admins.id)) 
                return message.channel.send({ embed: NoPerms });


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

                locateChannel.send('@everyone')
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
