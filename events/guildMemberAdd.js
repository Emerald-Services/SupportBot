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
    
    if (supportbot.SystemMessage_Embed === "true") {
      const GuildAddMember = new Discord.MessageEmbed()
        
    }
    
  }
};
