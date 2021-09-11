// SupportBot, Created by Emerald Services
// Say Command

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const { execute } = require("./help");
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.PurgeMessage,
    description: supportbot.PurgeDesc,

    execute(message, args, member) {
	if (supportbot.DeleteMessages) message.delete();
	    
        let SupportStaff = message.guild.roles.cache.find(adminRole => adminRole.name === supportbot.Staff) || message.guild.roles.cache.find(adminRole => adminRole.id === supportbot.Staff)

        const NoPerms = new Discord.MessageEmbed()
            .setTitle("Invalid Permissions!")
            .setDescription(`${supportbot.IncorrectPerms}\n\nRole Required: \`${SupportStaff.name}\``)
            .setColor(supportbot.WarningColour)

            if (!message.member.roles.cache.has(SupportStaff.id)) 
                return message.channel.send({ embeds: [NoPerms] });

            let locateChannel = message.guild.channels.cache.find(ModLogChannel => ModLogChannel.name === supportbot.ModLogChannel) || message.guild.channels.cache.find(ModLogChannel => ModLogChannel.id === supportbot.ModLogChannel)

        const errornochannel = new Discord.MessageEmbed()
            .setTitle("Invalid Channel")
            .setDescription(`${supportbot.InvalidChannel}\n\nChannel Required: \`${supportbot.ModLogChannel}\``)
            .setColor(supportbot.ErrorColour);
    
            if(!locateChannel) return message.channel.send({ embeds: [errornochannel] });

            const embed1 = new Discord.MessageEmbed()
                .setDescription(`> :thinking: **Hmm!** Please enter a valid number of message to purge!\n\n\`${supportbot.Prefix}${supportbot.PurgeMessage} <message count>\` `)
	            .setColor(supportbot.WarningColour)

            if (!args[0]) return message.channel.send({
                embeds: [embed1]
            });

            const messagePrune = parseInt(args[0])

            const embed2 = new Discord.MessageEmbed()
                .setDescription("> :person_facepalming: **Grr!** Can you count? That ain't a number :joy:")
	            .setColor(supportbot.ErrorColour)

            if (isNaN(messagePrune)) return message.reply({
                embeds: [embed2]
            })

            message.channel.bulkDelete(messagePrune).then(() => {

                const embed3 = new Discord.MessageEmbed()
                    .setDescription(`> :recycle: \`${args[0]} messages\` **have been purged!** `)
	                .setColor(supportbot.ErrorColour)
                message.channel.send({
                    embeds: [embed3]
                })
            })

            const logEmbed = new Discord.MessageEmbed()
                .setTitle(supportbot.PruneLogTitle)
                .setThumbnail(supportbot.PruneThumbnail)
                .addField('Messages Purged', `\`${args[0]} messages\``)
                .addField('Staff Member', message.author)
                .setFooter(supportbot.EmbedFooter)
                .setColor(supportbot.PruneColour)
                .setTimestamp()

                locateChannel.send({ embeds: [logEmbed] })
    


    } 
    
};
