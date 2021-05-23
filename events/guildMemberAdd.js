// SupportBot 6.0, Created by Emerald Services
// Ready Event

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = async (bot, member) => {

  if (supportbot.SystemMessages) {
    const SystemChannel = member.guild.channels.cache.find(channel => channel.name === supportbot.SystemMessage_Channel) || member.guild.channels.cache.get(supportbot.SystemMessage_Channel)
    
    if (!SystemChannel) return;
    
    console.log(`[${supportbot.Bot_Name}]: ${member.user.username} has joined ${member.guild.name}!`)
    console.log(supportbot.AutoRole_Role)
    
    const role = member.guild.roles.cache.find(role => role.name === supportbot.AutoRole_Role) || member.guild.roles.cache.find(role => role.id === supportbot.AutoRole_Role)
    
    member.roles.add(role).catch(console.error);
    
    if (supportbot.SystemMessage_Type === "embed") {
        
      const GuildAddMember = new Discord.MessageEmbed()
        .setTitle(supportbot.Welcome_Title)
        .setDescription(supportbot.WelcomeMessage.replace(/%member%/g, `<@!${member.user.id}>`).replace(/%guildname%/g, member.guild.name))
        .setColor(supportbot.EmbedColour)

        if (supportbot.SystemMessage_Icon === "BOT") {
            GuildAddMember.setThumbnail(bot.user.displayAvatarURL())
        }

        if (supportbot.SystemMessage_Icon === "USER") {
            GuildAddMember.setThumbnail(member.user.displayAvatarURL())
        }


        if (supportbot.SystemMessage_EmbedFooter) {
            GuildAddMember.setFooter(supportbot.EmbedFooter)
        }

    SystemChannel.send({ embed: GuildAddMember });
        
    }

    if (supportbot.SystemMessage_Type === "normal") {
        SystemChannel.send(supportbot.WelcomeMessage.replace(/%member%/g, member.user.username).replace(/%guildname%/g, member.guild.name))

    }

  }
};
