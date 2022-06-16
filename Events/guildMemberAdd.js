
const Discord = require('discord.js');
const fs = require("fs");
const Event = require("../Structures/Event.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);

module.exports = new Event("guildMemberAdd", async (client, member, interaction, guild) => {

    if (supportbot.Welcome) {
        const WelcomeChannel = member.guild.channels.cache.find(channel => channel.name === supportbot.WelcomeChannel)

        const WelcomeEmbed = new Discord.MessageEmbed()
            .setColor(supportbot.WelcomeColour)
            .setTitle(supportbot.WelcomeTitle)
            .setDescription(supportbot.WelcomeMessage.replace(/%joined_user%/g, member.user))
            .setTimestamp();
        
            if (supportbot.EmbedWelcomeThumbnail === "BOT") {
                WelcomeEmbed.setThumbnail(client.user.displayAvatarURL())
            }
    
            if (supportbot.EmbedWelcomeThumbnail === "USER") {
                WelcomeEmbed.setThumbnail(member.user.displayAvatarURL())
            }
    
            if (supportbot.EmbedWelcomeImage) {
                WelcomeEmbed.setImage(supportbot.EmbedWelcomeImageURL)
            }
    
            WelcomeChannel.send({
                embeds: [WelcomeEmbed]
            })
    
            if (supportbot.AutoRole) {
                var role = member.guild.roles.cache.find(role => role.name === supportbot.JoinRole);
                member.roles.add(role);
            } 
    
            console.log(`\u001b[32m`, `[+]`, `\u001b[33m`, `${member.user.username} joined the server!`)
    
    }

});