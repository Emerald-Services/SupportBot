const fs = require("fs");
const Discord = require("discord.js");
const yaml = require("js-yaml");
const path = require("path");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig  = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const msgconfig  = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

const Command = require("../../Structures/Command.js");
const DB = require("../../Structures/Database.js"); 

module.exports = new Command({
  name: "suggest",
  description: cmdconfig.Suggestion?.Description || "Submit a new suggestion",
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "text",
      description: "Your suggestion text",
      type: Discord.ApplicationCommandOptionType.String,
      required: true
    }
  ],

  async run(interaction) {
    const suggestion = interaction.options.getString("text");
    const mode = supportbot.Suggestions.Mode || "Channel";

    const embed = new Discord.EmbedBuilder()
      .addFields(
        { name: "Suggestion", value: suggestion, inline: true },
        { name: "From", value: `<@${interaction.user.id}>` },
        { name: `${supportbot.Suggestions.UpvoteEmoji} ${supportbot.Suggestions.UpvoteTitle}`, value: "0", inline: true },
        { name: `${supportbot.Suggestions.DownvoteEmoji} ${supportbot.Suggestions.DownvoteTitle}`, value: "0", inline: true }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setColor(supportbot.Embed.Colours.General);

    const row = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId("upvote")
        .setEmoji(supportbot.Suggestions.UpvoteEmoji)
        .setStyle(supportbot.Suggestions.Buttons.Upvote),
      new Discord.ButtonBuilder()
        .setCustomId("downvote")
        .setEmoji(supportbot.Suggestions.DownvoteEmoji)
        .setStyle(supportbot.Suggestions.Buttons.Downvote),
      new Discord.ButtonBuilder()
        .setCustomId("removevote")
        .setLabel(supportbot.Suggestions.Buttons.RemoveVote_Title)
        .setStyle(supportbot.Suggestions.Buttons.RemoveVote)
    );

    if (mode === "Forum") {
      const forum = await interaction.guild.channels
        .fetch(supportbot.Suggestions.ForumChannel)
        .catch(() => null);

      if (!forum || forum.type !== Discord.ChannelType.GuildForum) {
        return interaction.reply({
          embeds: [
            new Discord.EmbedBuilder()
              .setTitle("⚠ Missing Forum Channel")
              .setDescription(msgconfig.Error.MissingChannel)
              .setColor(supportbot.Embed.Colours.Error)
          ],
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      const appliedTags = supportbot.Suggestions.Tags?.Created
        ? [supportbot.Suggestions.Tags.Created]
        : [];

      const thread = await forum.threads.create({
        name: suggestion.slice(0, 100),
        message: {
          content: "\u200B",          
          embeds: [embed],
          components: [row]
        },
        appliedTags,
        autoArchiveDuration: Discord.ThreadAutoArchiveDuration.OneDay,
        reason: "New Suggestion"
      });

      embed.setFooter({
        text: `${supportbot.Embed.Footer} | Suggestion ID: ${thread.id}`,
        iconURL: interaction.user.displayAvatarURL()
      });
      const starter = await thread.fetchStarterMessage();
      await starter.edit({ embeds: [embed], components: [row] });

      DB.add(thread.id, interaction.user.id, suggestion);

      return interaction.reply({
        embeds: [
          new Discord.EmbedBuilder()
            .setTitle(msgconfig.Suggestions.Sent_Title)
            .setDescription(`${msgconfig.Suggestions.Sent}`)
            .addFields({ name: 'Posted in:', value: `<#${forum.id}>` })
            .setColor(supportbot.Embed.Colours.Success)
        ],
        flags: Discord.MessageFlags.Ephemeral,
      });
    }

    // ---------- Channel Mode ----------
    const channel = await interaction.guild.channels
      .fetch(supportbot.Suggestions.Channel)
      .catch(() => null);

    if (!channel) {
      return interaction.reply({
        embeds: [
          new Discord.EmbedBuilder()
            .setTitle("⚠ Missing Suggestion Channel")
            .setDescription(msgconfig.Error.MissingChannel)
            .setColor(supportbot.Embed.Colours.Error)
        ],
        flags: Discord.MessageFlags.Ephemeral,
      });
    }

    const message = await channel.send({ embeds: [embed], components: [row] });

    embed.setFooter({
      text: `${supportbot.Embed.Footer} | Suggestion ID: ${message.id}`,
      iconURL: interaction.user.displayAvatarURL()
    });
    await message.edit({ embeds: [embed], components: [row] });

    DB.add(message.id, interaction.user.id, suggestion);

    return interaction.reply({
      embeds: [
        new Discord.EmbedBuilder()
          .setTitle(msgconfig.Suggestions.Sent_Title)
          .setDescription(`${msgconfig.Suggestions.Sent}`)
          .addFields({ name: 'Posted in:', value: `<#${channel.id}>` })
          .setColor(supportbot.Embed.Colours.Success)
      ],
      flags: Discord.MessageFlags.Ephemeral,
    });
  }
});
