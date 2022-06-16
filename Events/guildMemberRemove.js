
const Discord = require('discord.js');
const fs = require("fs");
const Event = require("../Structures/Event.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);

module.exports = new Event("guildMemberRemove", async (client, member, interaction, guild) => {
    const LeaveChannel = member.guild.channels.cache.find(channel => channel.name === supportbot.LeaveChannel)

    const LeaveEmbed = new Discord.MessageEmbed()
        .setColor(supportbot.LeaveColour)
        .setTitle(supportbot.LeaveTitle)
        .setDescription(supportbot.LeaveMessage.replace(/%joined_user%/g, member.user))
        .setTimestamp();

        if (supportbot.EmbedLeaveThumbnail === "BOT") {
            LeaveEmbed.setThumbnail(client.user.displayAvatarURL())
        }

        if (supportbot.EmbedLeaveThumbnail === "USER") {
            LeaveEmbed.setThumbnail(member.user.displayAvatarURL())
        }

        if (supportbot.EmbedLeaveImage) {
            LeaveEmbed.setImage(supportbot.EmbedLeaveImageURL)
        }

        LeaveChannel.send({
            embeds: [LeaveEmbed]
        })

        console.log(`\u001b[31m`, `[-]`, `\u001b[33m`, `${member.user.username} joined the server!`)

});

