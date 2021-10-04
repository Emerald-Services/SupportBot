// SupportBot 6.0, Created by Emerald Services
// Ready Event

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = async (bot, member) => {

  if (supportbot.SystemMessages) {
    const SystemChannel = member.guild.channels.cache.find(channel => channel.name === supportbot.UserDeparted_Channel) || member.guild.channels.cache.get(supportbot.UserDeparted_Channel)
    
    if (!SystemChannel) return;
    
    console.log(`\u001b[31m.`, `[${supportbot.Bot_Name}]: ${member.user.username} has left ${member.guild.name}!`)

    if (supportbot.UserDeparted_Type === "embed") {
      const GuildRemoveMember = new Discord.MessageEmbed()
        .setTitle(supportbot.Departed_Title)
        .setDescription(supportbot.DepartedMessage.replace(/%member%/g, member.user.username).replace(/%guildname%/g, member.guild.name))
        .setColor(supportbot.EmbedColour)

        if (supportbot.SystemMessage_Icon === "BOT") {
          GuildRemoveMember.setThumbnail(bot.user.displayAvatarURL())
        }

        if (supportbot.SystemMessage_Icon === "USER") {
          GuildRemoveMember.setThumbnail(member.user.displayAvatarURL())
        }

        if (supportbot.SystemMessage_Icon === "CUSTOM") {
          SuggestionMessage.setThumbnail(supportbot.SystemMessageIcon_URL)
      }

        if (supportbot.SystemMessage_EmbedFooter) {
          GuildRemoveMember.setFooter(supportbot.EmbedFooter)
        }

    SystemChannel.send({ embeds: [GuildRemoveMember] });
        
    }

    if (supportbot.SystemMessage_Type === "normal") {
        SystemChannel.send({content: supportbot.DepartedMessage.replace(/%member%/g, member.user.username).replace(/%guildname%/g, member.guild.name)})

    }

  }
};
