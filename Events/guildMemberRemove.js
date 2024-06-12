
const Discord = require('discord.js');
const fs = require("fs");
const Event = require("../Structures/Event.js");
const yaml = require("js-yaml");

const supportbot = yaml.load(
    fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
  
const cmdconfig = yaml.load(
    fs.readFileSync("./Configs/commands.yml", "utf8")
);
  
const msgconfig = yaml.load(
    fs.readFileSync("./Configs/messages.yml", "utf8")
);

module.exports = new Event("guildMemberRemove", async (client, member, interaction, guild) => {

    if (supportbot.Leave.Enabled) {
        const LeaveChannel = member.guild.channels.cache.find(channel => channel.name === supportbot.Leave.Channel)

        const LeaveEmbed = new Discord.EmbedBuilder()
            .setColor(msgconfig.Leave.Embed.Colour)
            .setTitle(msgconfig.Leave.Embed.Title)
            .setDescription(msgconfig.Leave.Embed.Message.replace(/%joined_user%/g, member.user))
            .setTimestamp();
        
            if (msgconfig.Leave.Embed.Thumbnail === "BOT") {
                LeaveEmbed.setThumbnail(client.user.displayAvatarURL())
            }
    
            if (msgconfig.Leave.Embed.Thumbnail === "USER") {
                LeaveEmbed.setThumbnail(member.user.displayAvatarURL())
            }
    
            if (msgconfig.Leave.Embed.ImageEnabled) {
                LeaveEmbed.setImage(msgconfig.Leave.Embed.ImageURL)
            }
    
            LeaveChannel.send({
                embeds: [LeaveEmbed]
            })
    
            console.log(`\u001b[31m`, `[-]`, `\u001b[33m`, `${member.user.username} left the server!`)
    }

});

