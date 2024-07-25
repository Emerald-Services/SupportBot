const fs = require("fs");
const Discord = require("discord.js");
const yaml = require("js-yaml");
const path = require("path");
const MySQLStorage = require("../Structures/Storage.js");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

const Command = require("../Structures/Command.js");

// Initialize storage
const storage = new MySQLStorage();
storage.connect();

let suggestions;
if (!storage.useMySQL) {
  try {
    suggestions = require("../Data/SuggestionData.json");
  } catch (error) {
    suggestions = {};
  }
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

    const suggestChannel = await getChannel(
      supportbot.Suggestions.Channel,
      interaction.guild
    );

    const NoChannel = new Discord.EmbedBuilder()
      .setTitle("Missing Channel!")
      .setDescription(msgconfig.Error.InvalidChannel)
      .setColor(supportbot.Embed.Colours.Error);

    if (!suggestChannel) return interaction.reply({ embeds: [NoChannel] });

    let suggestion = interaction.options.getString("suggestion");

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
      .setStyle(supportbot.Suggestions.Buttons.RemoveVote); // Red button

    const row = new Discord.ActionRowBuilder().addComponents(UpvoteButton, DownvoteButton, RemoveVoteButton);

    const suggestionMsg = await suggestChannel.send({ embeds: [SuggestEmbed], components: [row] });

    if (storage.useMySQL) {
      await storage.saveSuggestion(suggestionMsg.id, interaction.user.id, suggestion);
    } else {
      suggestions[suggestionMsg.id] = {
        suggestion: suggestion,
        author: interaction.user.id,
        upvotes: [],
        downvotes: []
      };
      fs.writeFileSync("./Data/SuggestionData.json", JSON.stringify(suggestions, null, 2));
    }

    if (supportbot.Suggestions.Threads.Enabled) {
      await suggestionMsg.startThread({
        name: supportbot.Suggestions.Threads.Title,
        autoArchiveDuration: 60,
        type: Discord.ChannelType.PublicThread,
        reason: supportbot.Suggestions.Threads.Reason,
      });
    }

    const Submitted = new Discord.EmbedBuilder()
      .setTitle(`${msgconfig.Suggestions.Sent_Title}`)
      .setDescription(`${msgconfig.Suggestions.Sent}`)
      .addFields(
        { name: "Sent to:", value: `<#${suggestChannel.id}>` },
      )
      .setColor(supportbot.Embed.Colours.Success);

    await interaction.reply({ 
      ephemeral: true, 
      embeds: [Submitted] 
    });
  },
});
