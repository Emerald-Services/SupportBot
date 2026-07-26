const Discord = require("discord.js");
const { Event } = require("../Structures/Addon.js");
const fs = require("fs");
const yaml = require("js-yaml");

const tempVCConfig = yaml.load(fs.readFileSync("./Addons/Configs/tempvc.yml", "utf8"));

const tempChannels = new Map();

const voiceStateUpdate = new Event("voiceStateUpdate", async (client, oldState, newState) => {
  if (!tempVCConfig.Enabled) return;

  const member = newState.member;
  const guild = newState.guild;

  if (newState.channelId === tempVCConfig.JoinToCreateChannelID) {
    console.log(`[TempVC] ${member.user.tag} joined the Join-to-Create channel.`);
  }

  if (newState.channelId === tempVCConfig.JoinToCreateChannelID) {
    try {
      const parentCategory = tempVCConfig.CategoryID || newState.channel.parentId;
      const channelName = tempVCConfig.ChannelNamePattern.replace("{user}", member.user.username);

      const newChannel = await guild.channels.create({
        name: channelName,
        type: Discord.ChannelType.GuildVoice,
        parent: parentCategory,
        permissionOverwrites: [
          {
            id: member.id,
            allow: [Discord.PermissionFlagsBits.ManageChannels, Discord.PermissionFlagsBits.MoveMembers],
          },
        ],
      });

      tempChannels.set(newChannel.id, member.id);
      await member.voice.setChannel(newChannel);

      console.log(`[TempVC] Created channel "${channelName}" for ${member.user.tag}`);

      if (tempVCConfig.Hub.Enabled && tempVCConfig.Hub.SendOnCreate) {
        try {
          const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, MessageFlags, ButtonStyle } = Discord;
          const layoutStyle = tempVCConfig.Hub.LayoutStyle || "classic";

          if (layoutStyle === "classic") {
            const config = tempVCConfig.Hub.Classic;
            const embed = new EmbedBuilder()
              .setTitle(config.Title)
              .setDescription(config.Description)
              .setColor(config.Color);

            const buttons = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("tempvc_lock").setLabel("Lock").setEmoji("🔒").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("tempvc_unlock").setLabel("Unlock").setEmoji("🔓").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("tempvc_rename").setLabel("Rename").setEmoji("✏️").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("tempvc_limit").setLabel("Limit").setEmoji("👥").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("tempvc_claim").setLabel("Claim Ownership").setEmoji("👑").setStyle(ButtonStyle.Primary)
            );

            await newChannel.send({ embeds: [embed], components: [buttons] });
          } else {
            const config = tempVCConfig.Hub.Modern;
            const colorInt = parseInt(config.Color.replace("#", ""), 16);

            const container = {
              type: 11,
              accent_color: colorInt,
              children: [
                {
                  type: 12,
                  children: [
                    { type: 13, content: `## ${config.Title}` },
                    { type: 13, content: config.Body }
                  ]
                },
                {
                  type: 15,
                  divider: true
                },
                {
                  type: 1,
                  components: [
                    { type: 2, custom_id: "tempvc_lock", label: "Lock", emoji: { name: "🔒" }, style: 2 },
                    { type: 2, custom_id: "tempvc_unlock", label: "Unlock", emoji: { name: "🔓" }, style: 2 },
                    { type: 2, custom_id: "tempvc_rename", label: "Rename", emoji: { name: "✏️" }, style: 2 },
                    { type: 2, custom_id: "tempvc_limit", label: "Limit", emoji: { name: "👥" }, style: 2 }
                  ]
                },
                {
                  type: 1,
                  components: [
                    { type: 2, custom_id: "tempvc_claim", label: "Claim Ownership", emoji: { name: "👑" }, style: 1 }
                  ]
                }
              ]
            };

            await newChannel.send({
              flags: MessageFlags.IsComponentsV2,
              components: [container]
            });
          }
        } catch (hubError) {
          console.error("[TempVC] Error sending Hub:", hubError);
        }
      }
    } catch (error) {
      console.error("[TempVC] Error creating temporary channel:", error);
    }
  }

  if (oldState.channelId && tempChannels.has(oldState.channelId)) {
    const oldChannel = oldState.channel;

    if (oldChannel && oldChannel.members.size === 0) {
      try {
        await oldChannel.delete();
        tempChannels.delete(oldState.channelId);
        console.log(`[TempVC] Deleted empty temporary channel "${oldChannel.name}"`);
      } catch (error) {
        if (error.code !== 10003) {
          console.error("[TempVC] Error deleting temporary channel:", error);
        }
        tempChannels.delete(oldState.channelId);
      }
    }
  }
});

const interactionEvent = new Event("interactionCreate", async (client, interaction) => {
  if (!interaction.isButton() && !interaction.isModalSubmit()) return;
  if (!interaction.customId.startsWith("tempvc_")) return;

  const channel = interaction.channel;
  if (!tempChannels.has(channel.id)) {
    return interaction.reply({ content: "This channel is no longer a temporary voice channel.", flags: Discord.MessageFlags.Ephemeral });
  }

  const ownerId = tempChannels.get(channel.id);
  const isOwner = interaction.user.id === ownerId || interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator);

  if (interaction.customId === "tempvc_claim") {
    const currentOwnerInVC = channel.members.has(ownerId);
    if (currentOwnerInVC && interaction.user.id !== ownerId) {
      return interaction.reply({ content: "The owner is still in the voice channel!", flags: Discord.MessageFlags.Ephemeral });
    }

    tempChannels.set(channel.id, interaction.user.id);
    await channel.permissionOverwrites.edit(interaction.user.id, {
      ManageChannels: true,
      MoveMembers: true,
    });

    return interaction.reply({ content: "You are now the owner of this voice channel!", flags: Discord.MessageFlags.Ephemeral });
  }

  if (!isOwner) {
    return interaction.reply({ content: "Only the channel owner can use these controls.", flags: Discord.MessageFlags.Ephemeral });
  }

  try {
    switch (interaction.customId) {
      case "tempvc_lock":
        await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
        await interaction.reply({ content: "Channel locked! 🔒", flags: Discord.MessageFlags.Ephemeral });
        break;
      case "tempvc_unlock":
        await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: null });
        await interaction.reply({ content: "Channel unlocked! 🔓", flags: Discord.MessageFlags.Ephemeral });
        break;
      case "tempvc_rename":
        const modal = new Discord.ModalBuilder()
          .setCustomId("tempvc_modal_rename")
          .setTitle("Rename Channel")
          .addComponents(
            new Discord.ActionRowBuilder().addComponents(
              new Discord.TextInputBuilder()
                .setCustomId("name")
                .setLabel("New Name")
                .setStyle(Discord.TextInputStyle.Short)
                .setPlaceholder(channel.name)
                .setRequired(true)
            )
          );
        await interaction.showModal(modal);
        break;
      case "tempvc_limit":
        const limitModal = new Discord.ModalBuilder()
          .setCustomId("tempvc_modal_limit")
          .setTitle("Set User Limit")
          .addComponents(
            new Discord.ActionRowBuilder().addComponents(
              new Discord.TextInputBuilder()
                .setCustomId("limit")
                .setLabel("Limit (0-99)")
                .setStyle(Discord.TextInputStyle.Short)
                .setPlaceholder("0 for no limit")
                .setRequired(true)
            )
          );
        await interaction.showModal(limitModal);
        break;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === "tempvc_modal_rename") {
        const newName = interaction.fields.getTextInputValue("name");
        await channel.setName(newName);
        await interaction.reply({ content: `Channel renamed to **${newName}**!`, flags: Discord.MessageFlags.Ephemeral });
      } else if (interaction.customId === "tempvc_modal_limit") {
        const limit = parseInt(interaction.fields.getTextInputValue("limit"));
        if (isNaN(limit) || limit < 0 || limit > 99) {
          return interaction.reply({ content: "Please enter a valid number between 0 and 99.", flags: Discord.MessageFlags.Ephemeral });
        }
        await channel.setUserLimit(limit);
        await interaction.reply({ content: `User limit set to **${limit === 0 ? "Unlimited" : limit}**!`, flags: Discord.MessageFlags.Ephemeral });
      }
    }
  } catch (error) {
    console.error("[TempVC] Error handling interaction:", error);
    if (!interaction.replied) await interaction.reply({ content: "An error occurred.", flags: Discord.MessageFlags.Ephemeral });
  }
});

module.exports = [voiceStateUpdate, interactionEvent];
