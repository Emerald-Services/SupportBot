const { EmbedBuilder } = require('discord.js');
const fs = require("fs");
const yaml = require("js-yaml");
const Event = require("../Structures/Event.js");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

module.exports = new Event("messageDelete", async (client, message) => {
    if (!message.guild) return;

    const author = message.author || (message.partial ? await message.fetch().then(m => m.author).catch(() => null) : null);
    if (!author || author.bot) return;

    const content = message.content || (message.attachments.size > 0 ? "Contains attachment(s)" : "*No content*");

    const deleteLogChannel = message.guild.channels.cache.get(supportbot.MessageDelete.Channel) ||
        message.guild.channels.cache.find(c => c.name === supportbot.MessageDelete.Channel);

    const deletedMessageEmbed = new EmbedBuilder()
        .setColor(supportbot.MessageDelete.Colour)
        .setTitle("Message Deleted")
        .setDescription(`> **Channel:** <#${message.channel.id}>\n> **Message ID:** ${message.id}\n> **Message author:** ${author.tag} (${author.id})\n> **Message Created:** <t:${Math.floor(message.createdTimestamp / 1000)}:F>`)
        .addFields({ name: "Deleted Content", value: content, inline: false })
        .setThumbnail(author.displayAvatarURL())
        .setTimestamp();

    if (message.attachments.size > 0) {
        const attachment = message.attachments.first();
        deletedMessageEmbed.addFields({ name: "Attachment", value: `[${attachment.name}](${attachment.proxyURL})` });
    }

    if (deleteLogChannel) {
        deleteLogChannel.send({ embeds: [deletedMessageEmbed] });
    }
});
