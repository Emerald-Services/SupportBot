
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

module.exports = new Event("guildMemberAdd", async (client, member, interaction, guild) => {

    if (supportbot.Welcome.Enabled) {
        const WelcomeChannel = member.guild.channels.cache.get(supportbot.Welcome.Channel) ||
                               member.guild.channels.cache.find(channel => channel.name === supportbot.Welcome.Channel);

        const WelcomeEmbed = new Discord.EmbedBuilder()
            .setColor(msgconfig.Welcome.Embed.Colour)
            .setTitle(msgconfig.Welcome.Embed.Title)
            .setDescription(msgconfig.Welcome.Embed.Message.replace(/%joined_user%/g, member.user))
            .setTimestamp();
        
        if (msgconfig.Welcome.Embed.Thumbnail === "BOT") {
            WelcomeEmbed.setThumbnail(client.user.displayAvatarURL())
        } else if (msgconfig.Welcome.Embed.Thumbnail === "USER") {
            WelcomeEmbed.setThumbnail(member.user.displayAvatarURL())
        }
    
        if (msgconfig.Welcome.Embed.ImageEnabled) {
            WelcomeEmbed.setImage(msgconfig.Welcome.Embed.ImageURL)
        }
    
        if (WelcomeChannel) {
            WelcomeChannel.send({ embeds: [WelcomeEmbed] });
        }
    
        if (supportbot.Roles.AutoRole.Enabled) {
            const role = member.guild.roles.cache.get(supportbot.Roles.AutoRole.Role) ||
                         member.guild.roles.cache.find(role => role.name === supportbot.Roles.AutoRole.Role);
            if (role) {
                member.roles.add(role);
            }
        }
    
        console.log(`\u001b[32m`, `[+]`, `\u001b[33m`, `${member.user.username} joined the server!`);
    }

});