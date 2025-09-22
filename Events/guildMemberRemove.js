const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const yaml = require("js-yaml");
const Event = require("../Structures/Event.js");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const msgconfig   = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

module.exports = new Event("guildMemberRemove", async (client, member) => {

    if (!supportbot.Leave || !supportbot.Leave.Enabled) return;

    const leaveChannel =
        member.guild.channels.cache.get(supportbot.Leave.Channel) ||
        member.guild.channels.cache.find(c => c.name === supportbot.Leave.Channel);

    if (!leaveChannel) return;

    const leaveEmbed = new EmbedBuilder()
        .setColor(msgconfig.Leave.Embed.Colour)
        .setTitle(msgconfig.Leave.Embed.Title)
        .setDescription(
            msgconfig.Leave.Embed.Message.replace(/%left_user%/g, member.user.toString())
        )
        .setTimestamp();

    if (msgconfig.Leave.Embed.Thumbnail === "BOT") {
        leaveEmbed.setThumbnail(client.user.displayAvatarURL());
    } else if (msgconfig.Leave.Embed.Thumbnail === "USER") {
        leaveEmbed.setThumbnail(member.user.displayAvatarURL());
    }

    if (msgconfig.Leave.Embed.ImageEnabled) {
        leaveEmbed.setImage(msgconfig.Leave.Embed.ImageURL);
    }

    await leaveChannel.send({ embeds: [leaveEmbed] });

    console.log(`[-] ${member.user.tag} left the server`);
});
