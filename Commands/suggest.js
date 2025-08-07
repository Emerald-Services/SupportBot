const fs = require("fs");
const Discord = require("discord.js");
const yaml = require("js-yaml");

// Load configurations
const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

const Command = require("../Structures/Command.js");

// Ensure suggestions file exists and is correctly loaded
let suggestions;
try {
  suggestions = require("../Data/SuggestionData.json");
} catch (error) {
  suggestions = {};
}

module.exports = new Command({
  name: cmdconfig.Suggestion.Command,
  description: cmdconfig.Suggestion.Description,
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "suggestion",
      description: "Create a Suggestion",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  permissions: cmdconfig.Suggestion.Permission,

  async run(interaction) {
    const { getChannel } = interaction.client;
    const mode = supportbot.Suggestions.Mode || "Standard";

    let suggestion = interaction.options.getString("suggestion");

    if (mode === "Forum") {
      const forumChannel = await interaction.guild.channels.fetch(supportbot.Suggestions.ForumChannel).catch(() => null);

      const NoChannel = new Discord.EmbedBuilder()
        .setTitle("Missing Forum Channel!")
        .setDescription(msgconfig.Error.MissingChannel)
        .setColor(supportbot.Embed.Colours.Error);

      if (!forumChannel || forumChannel.type !== Discord.ChannelType.GuildForum) {
        return interaction.reply({ embeds: [NoChannel], ephemeral: true });
      }

      const SuggestForumEmbed = new Discord.EmbedBuilder()
        .addFields(
          { name: "Suggestion", value: suggestion, inline: true },
          { name: "From", value: `<@${interaction.user.id}>` },
          { name: `${supportbot.Suggestions.UpvoteEmoji} ${supportbot.Suggestions.UpvoteTitle}`, value: "0", inline: true },
          { name: `${supportbot.Suggestions.DownvoteEmoji} ${supportbot.Suggestions.DownvoteTitle}`, value: "0", inline: true }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({
          text: supportbot.Embed.Footer,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setColor(supportbot.Embed.Colours.General);

      const UpvoteForumButton = new Discord.ButtonBuilder()
        .setCustomId("upvote")
        .setEmoji(supportbot.Suggestions.UpvoteEmoji)
        .setStyle(supportbot.Suggestions.Buttons.Upvote);

      const DownvoteForumButton = new Discord.ButtonBuilder()
        .setCustomId("downvote")
        .setEmoji(supportbot.Suggestions.DownvoteEmoji)
        .setStyle(supportbot.Suggestions.Buttons.Downvote);

      const RemoveVoteForumButton = new Discord.ButtonBuilder()
        .setCustomId("removevote")
        .setLabel(supportbot.Suggestions.Buttons.RemoveVote_Title)
        .setStyle(supportbot.Suggestions.Buttons.RemoveVote);

      const row = new Discord.ActionRowBuilder().addComponents(UpvoteForumButton, DownvoteForumButton, RemoveVoteForumButton);

      const post = await forumChannel.threads.create({
        name: suggestion.slice(0, 100),
        message: {
          embeds: [SuggestForumEmbed],
          components: [row],
        },
        reason: "New suggestion submitted",
        autoArchiveDuration: 1440,
      });

      suggestions[post.id] = {
        suggestion: suggestion,
        author: interaction.user.id,
        upvotes: [],
        downvotes: []
      };

      fs.writeFileSync("./Data/SuggestionData.json", JSON.stringify(suggestions, null, 2));

      const successEmbed = new Discord.EmbedBuilder()
        .setTitle(msgconfig.Suggestions.Sent_Title)
        .setDescription(msgconfig.Suggestions.Sent)
        .addFields({ name: "Posted in forum:", value: `<#${forumChannel.id}>` })
        .setColor(supportbot.Embed.Colours.Success);

      return interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }

    const suggestChannel = await getChannel(supportbot.Suggestions.Channel, interaction.guild);

    const NoChannel = new Discord.EmbedBuilder()
      .setTitle("Missing Channel!")
      .setDescription(msgconfig.Error.MissingChannel)
      .setColor(supportbot.Embed.Colours.Error);

    if (!suggestChannel) return interaction.reply({ embeds: [NoChannel] });

    const SuggestEmbed = new Discord.EmbedBuilder()
      .addFields(
        { name: "Suggestion", value: suggestion, inline: true },
        { name: "From", value: `<@${interaction.user.id}>` },
        { name: `${supportbot.Suggestions.UpvoteEmoji} ${supportbot.Suggestions.UpvoteTitle}`, value: "0", inline: true },
        { name: `${supportbot.Suggestions.DownvoteEmoji} ${supportbot.Suggestions.DownvoteTitle}`, value: "0", inline: true }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({
        text: supportbot.Embed.Footer,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setColor(supportbot.Embed.Colours.General);

    const UpvoteButton = new Discord.ButtonBuilder()
      .setCustomId("upvote")
      .setEmoji(supportbot.Suggestions.UpvoteEmoji)
      .setStyle(supportbot.Suggestions.Buttons.Upvote);

    const DownvoteButton = new Discord.ButtonBuilder()
      .setCustomId("downvote")
      .setEmoji(supportbot.Suggestions.DownvoteEmoji)
      .setStyle(supportbot.Suggestions.Buttons.Downvote);

    const RemoveVoteButton = new Discord.ButtonBuilder()
      .setCustomId("removevote")
      .setLabel(supportbot.Suggestions.Buttons.RemoveVote_Title)
      .setStyle(supportbot.Suggestions.Buttons.RemoveVote);

    const row = new Discord.ActionRowBuilder().addComponents(UpvoteButton, DownvoteButton, RemoveVoteButton);

    const suggestionMsg = await suggestChannel.send({ embeds: [SuggestEmbed], components: [row] });

    suggestions[suggestionMsg.id] = {
      suggestion: suggestion,
      author: interaction.user.id,
      upvotes: [],
      downvotes: []
    };

    fs.writeFileSync("./Data/SuggestionData.json", JSON.stringify(suggestions, null, 2));

    if (supportbot.Suggestions.Threads.Enabled) {
      await suggestionMsg.startThread({
        name: supportbot.Suggestions.Threads.Title,
        autoArchiveDuration: 60,
        type: Discord.ChannelType.PublicThread,
        reason: supportbot.Suggestions.Threads.Reason,
      });
    }

    const Submitted = new Discord.EmbedBuilder()
      .setTitle(msgconfig.Suggestions.Sent_Title)
      .setDescription(msgconfig.Suggestions.Sent)
      .addFields({ name: "Sent to:", value: `<#${suggestChannel.id}>` })
      .setColor(supportbot.Embed.Colours.Success);

    await interaction.reply({ ephemeral: true, embeds: [Submitted] });
  },
});
