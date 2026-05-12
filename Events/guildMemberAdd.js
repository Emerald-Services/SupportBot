const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    MediaGalleryBuilder
} = require("discord.js");
const fs = require("fs");
const yaml = require("js-yaml");
const Event = require("../Structures/Event.js");

const supportbot = yaml.load(
    fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const msgconfig = yaml.load(
    fs.readFileSync("./Configs/messages.yml", "utf8")
);

function getWelcomeThumbnail(client, member, iconCfg) {
    switch ((iconCfg?.Mode || "").toUpperCase()) {
        case "USER":
            return member.user.displayAvatarURL();
        case "BOT":
            return client.user.displayAvatarURL();
        case "CUSTOM":
            return iconCfg.CustomURL;
        default:
            return null;
    }
}

function buildModernComponents(client, member) {
    const container = new ContainerBuilder();

    if (msgconfig.Welcome.Modern.Colour) {
        container.setAccentColor(parseInt(msgconfig.Welcome.Modern.Colour.replace("#", ""), 16));
    }

    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            msgconfig.Welcome.Modern.Title.replace(/%joined_user%/g, member.user)
        ),
        new TextDisplayBuilder().setContent(
            msgconfig.Welcome.Modern.Body.replace(/%joined_user%/g, member.user)
        )
    );

    const thumbUrl = getWelcomeThumbnail(client, member, msgconfig.Welcome.Modern.Icon);
    if (thumbUrl) {
        section.setThumbnailAccessory(
            new ThumbnailBuilder()
                .setURL(thumbUrl)
        );
    }

    container.addSectionComponents(section);

    // FIXED: Using MediaGalleryBuilder instead of TextDisplayBuilder for images
    if (msgconfig.Welcome.Modern.Image?.Enabled && msgconfig.Welcome.Modern.Image.URL) {
        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems([
                {
                    media: {
                        url: msgconfig.Welcome.Modern.Image.URL
                    }
                }
            ])
        );
    }

    if (Array.isArray(msgconfig.Welcome.Modern.Buttons)) {
        const row = new ActionRowBuilder();
        msgconfig.Welcome.Modern.Buttons.slice(0, 5).forEach(b => {
            const btn = new ButtonBuilder()
                .setLabel(b.label)
                .setStyle(ButtonStyle[b.style])
                .setEmoji(b.emoji || null);
            if (b.style === "Link") btn.setURL(b.url);
            else if (b.customId) btn.setCustomId(b.customId);
            row.addComponents(btn);
        });

        container.addActionRowComponents(row);
    }

    return [container];
}

module.exports = new Event("guildMemberAdd", async (client, member) => {
    if (!supportbot.Welcome.Enabled) return;

    const WelcomeChannel =
        member.guild.channels.cache.get(supportbot.Welcome.Channel) ||
        member.guild.channels.cache.find(c => c.name === supportbot.Welcome.Channel);
    if (!WelcomeChannel) return;

    const style = (msgconfig.Welcome.LayoutStyle || "classic").toLowerCase();

    if (style === "classic") {
        const WelcomeEmbed = new EmbedBuilder()
            .setColor(msgconfig.Welcome.Embed.Colour)
            .setTitle(msgconfig.Welcome.Embed.Title || null)
            .setDescription(
                msgconfig.Welcome.Embed.Message.replace(/%joined_user%/g, member.user)
            )
            .setTimestamp();

        const thumb = getWelcomeThumbnail(client, member, msgconfig.Welcome.Embed.Icon);
        if (thumb) WelcomeEmbed.setThumbnail(thumb);

        if (msgconfig.Welcome.Embed.Image?.Enabled && msgconfig.Welcome.Embed.Image.URL) {
            WelcomeEmbed.setImage(msgconfig.Welcome.Embed.Image.URL);
        }

        const components = [];
        if (
            msgconfig.Welcome.Embed.Buttons?.Enabled &&
            Array.isArray(msgconfig.Welcome.Embed.Buttons.List)
        ) {
            const row = new ActionRowBuilder();
            msgconfig.Welcome.Embed.Buttons.List.slice(0, 5).forEach(b => {
                const btn = new ButtonBuilder()
                    .setLabel(b.label)
                    .setStyle(ButtonStyle[b.style])
                    .setEmoji(b.emoji || null);
                if (b.style === "Link") btn.setURL(b.url);
                else if (b.customId) btn.setCustomId(b.customId);
                row.addComponents(btn);
            });
            components.push(row);
        }

        await WelcomeChannel.send({ embeds: [WelcomeEmbed], components });
    } else if (style === "modern") {
        const components = buildModernComponents(client, member);
        if (components.length > 0) {
            await WelcomeChannel.send({
                components,
                flags: MessageFlags.IsComponentsV2
            });
        }
    }

    if (supportbot.Roles.AutoRole.Enabled) {
        const role =
            member.guild.roles.cache.get(supportbot.Roles.AutoRole.Role) ||
            member.guild.roles.cache.find(r => r.name === supportbot.Roles.AutoRole.Role);
        if (role) await member.roles.add(role);
    }

    console.log("\u001b[32m", "[+]", "\u001b[33m", `${member.user.username} joined the server!`);
});
