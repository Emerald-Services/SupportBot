// SupportBot, Created by Emerald Services
// Suggest Command

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.SuggestCommand,
    description: supportbot.SuggestionDesc,

    execute(message, args) {
	if (supportbot.DeleteMessages) message.delete();
	    
        let locateChannel = message.guild.channels.cache.find(SuggestionChannel => SuggestionChannel.name === supportbot.SuggestionChannel) || message.guild.channels.cache.find(SuggestionChannel => SuggestionChannel.id === supportbot.SuggestionChannel)

        const errornochannel = new Discord.MessageEmbed()
            .setTitle("Invalid Channel")
            .setDescription(`${supportbot.InvalidChannel}\n\nChannel Required: \`${supportbot.SuggestionChannel}\``)
            .setColor(supportbot.ErrorColour);

        if(!locateChannel) return message.channel.send({ embeds: [errornochannel] });

        const embed = new Discord.MessageEmbed()
            .setDescription(`> **${supportbot.SuggestionStarter}**`)
	        .setColor(supportbot.EmbedColour)
        message.channel.send({ embeds: [embed] });

        let suggestion = []
        message.channel.awaitMessages(response => response.content.length > 2, {
            max: 1,
            time: 500000,
            errors: ['time'],
        }).then((collected) => {
            suggestion.push(collected.map(r => r.content));

            const SuggestionMessage = new Discord.MessageEmbed()
                .setColor(supportbot.EmbedColour)
                .setFooter(supportbot.EmbedFooter)

                .addField(supportbot.SuggestionTitle, suggestion, true)
                .addField("From", `<@${message.author.id}>`, true)

                if (supportbot.SuggestionMessage_Icon === "BOT") {
                    SuggestionMessage.setThumbnail(bot.user.displayAvatarURL())
                }
        
                if (supportbot.SuggestionMessage_Icon === "USER") {
                    SuggestionMessage.setThumbnail(message.author.displayAvatarURL())
                }

                if (supportbot.SuggestionMessage_Icon === "CUSTOM") {
                    SuggestionMessage.setThumbnail(supportbot.SuggestionIcon_URL)
                }

            locateChannel.send({ embeds: [SuggestionMessage] }).then(async function(msg) {
                msg.react(supportbot.SuggestReact_1).then(() => msg.react(supportbot.SuggestReact_2));
            });

            const SuggestionComplete = new Discord.MessageEmbed()
                .setColor(supportbot.SuccessColour)
                .setDescription(`:white_check_mark: Your suggestion has been successfully created. <#${locateChannel.id}>`)
            message.channel.send({ embeds: [SuggestionComplete] })

        });
    
    }
};
