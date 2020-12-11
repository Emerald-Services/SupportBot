// SupportBot Created by Emerald Services
// Ready Event

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = async (bot, member) => {

  if (supportbot.SystemMessages === "true") {
    const SystemChannel = member.guild.channels.cache.find(channel => channel.name === supportbot.SystemMessage_Channel)
    
    if (!SystemChannel) return;
    
    console.log(`[${supportbot.Bot_Name}]: ${member.user.username} has left ${member.guild.name}!`)

    if (supportbot.SystemMessage_Type === "embed") {
      const GuildRemoveMember = new Discord.MessageEmbed()
        .setTitle(supportbot.Leave_Title)
        .setDescription(supportbot.LeaveMessage.replace(/%member%/g, member.user.username).replace(/%guildname%/g, member.guild.name))
        .setColor(supportbot.EmbedColour)

        if (supportbot.SystemMessage_Icon === "BOT") {
          GuildRemoveMember.setThumbnail(bot.user.displayAvatarURL())
        }

        if (supportbot.SystemMessage_Icon === "USER") {
          GuildRemoveMember.setThumbnail(member.user.displayAvatarURL())
        }


        if (supportbot.SystemMessage_EmbedFooter === "true") {
          GuildRemoveMember.setFooter(supportbot.EmbedFooter)
        }

    SystemChannel.send({ embed: GuildRemoveMember });
        
    }

    if (supportbot.SystemMessage_Type === "normal") {
        SystemChannel.send(supportbot.LeaveMessage.replace(/%member%/g, member.user.username).replace(/%guildname%/g, member.guild.name))

    }

  }
};
