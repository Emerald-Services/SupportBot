// SupportBot | Emerald Services
// Suggest Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");
const { channel } = require("diagnostics_channel");

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
    let disableCommand = true;

    const { getChannel } = interaction.client;

    const suggestChannel = await getChannel(
      supportbot.SuggestionChannel,
      interaction.guild
    );

    const NoChannel = new Discord.EmbedBuilder()
      .setTitle("Missing Channel!")
      .setDescription(supportbot.InvalidChannel)
      .setColor(supportbot.ErrorColour);

    if (!suggestChannel) return interaction.reply({ embeds: [NoChannel] });

    let suggestion = interaction.options.getString("suggestion");

    const SuggestEmbed = new Discord.EmbedBuilder()
      .addFields(
        { name: "Suggestion", value: suggestion, inline: true},
        { name: "From", value: `<@${interaction.user.id}>`},
      )

      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({
        text: supportbot.EmbedFooter,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setColor(supportbot.GeneralColour);

    const suggestionMsg = await suggestChannel.send({ embeds: [SuggestEmbed] });

    if (supportbot.SuggestionUpvote && supportbot.SuggestionDownvote) {
      await suggestionMsg.react(supportbot.SuggestionUpvote);
      await suggestionMsg.react(supportbot.SuggestionDownvote);

      if (supportbot.SuggestionThreads) {
        await suggestionMsg.startThread({
              name: `Suggestion-releated Thread`,
              autoArchiveDuration: 60,
              type: Discord.ChannelType.GuildPublicThread,
              reason: 'Suggestion-releated thread',
          })
    
        }
    }

    const Submitted = new Discord.EmbedBuilder()
      .setTitle("Suggestion Submitted!")
      .setDescription(`:white_check_mark: You have successfully submitted a suggestion.`)
      .addFields(
        { name: "Sent to:", value: `<#${suggestChannel.id}>`},
      )
      .setColor(supportbot.SuccessColour);

    return interaction.reply({ 
      ephemeral: true, 
      embeds: [Submitted] 
    })
    
  },
});
