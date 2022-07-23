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

module.exports = new Command({
  name: cmdconfig.Suggestion.Command,
  description: cmdconfig.Suggestion.Description,
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "suggestion",
      description: "Create a Suggestion",
      type: "STRING",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  permissions: cmdconfig.Suggestion.Permission,

  async run(interaction) {
    let disableCommand = true;

    if (cmdconfig.Suggestion.Enabled === false) {
      if (interaction.type === Discord.InteractionType.ApplicationCommand && disableCommand)
      return interaction.reply({
        content: ":x: This command is `disabled`",
        ephemeral: true,
      });
    }

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
      .addField("Suggestion", suggestion, true)
      .addField("From", `<@${interaction.user.id}>`)
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
              type: 'GUILD_PUBLIC_THREAD',
              reason: 'Suggestion-releated thread',
          })
    
        }
    }

    const Submitted = new Discord.EmbedBuilder()
      .setTitle("Suggestion Submitted!")
      .setDescription(
        `:white_check_mark: You have successfully submitted a suggestion.`
      )
      .addField("Sent to:", `<#${suggestChannel.id}>`)
      .setColor(supportbot.SuccessColour);

    return interaction.reply({ 
      ephemeral: true, 
      embeds: [Submitted] 
    })
    
  },
});
