// SupportBot 6.0, Created by Emerald Services
// Ready Event

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

  
module.exports = async (bot) => {
  if (supportbot.SystemMessages === "true") {
    const SystemChannel = message.guild.channels.cache.find(channel => channel.name === supportbot.SystemMessage_Channel)
    
    if (!SystemChannel) return;
    
    if (supportbot.SystemMessage_Type === "embed") {
      const GuildAddMember = new Discord.MessageEmbed()
        .setTitle(supportbot.Welcome_Title)
        .setDescription(supportbot.WelcomeMessage.replace(/%member%/g, message.member.user.username).replace(/%guildname%/g, guild.name))
        .setColor(supportbot.EmbedColour)

        if (supportbot.WelcomeMessage_Icon === "BOT") {
            GuildAddMember.setThumbnail(message.author.displayAvatarURL())
        }

        if (supportbot.WelcomeMessage_Icon === "USER") {
            GuildAddMember.setThumbnail(message.member.displayAvatarURL())
        }


        if (supportbot.SystemMessage_EmbedFooter === "true") {
            GuildAddMember.setFooter(supportbot.EmbedFooter)
        }

    SystemChannel.send({ embed: GuildAddMember });
        
    }

    if (supportbot.SystemMessage_Type === "normal") {
        SystemChannel.send(supportbot.WelcomeMessage.replace(/%member%/g, message.member.user.username).replace(/%guildname%/g, guild.name))

        if (supportbot.AutoRole === "true") {
            member.roles.add(supportbot.AutoRole_Role)
        }
    }
    
  }
};
