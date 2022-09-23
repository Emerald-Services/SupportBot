// SupportBot | Emerald Services
// Suggest Command

const fs = require("fs");

const {
  MessageEmbed
} = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.SuggestCommand,
  description: cmdconfig.SuggestCommandDesc,
  options: [
    {
      name: "suggestion",
      description: "Create a Suggestion",
      type: "STRING",
      required: true,
    },
  ],
  permissions: ["SEND_MESSAGES"],

  async run(interaction) {
    const { getChannel } = interaction.client;
    const suggestChannel = await getChannel(
      supportbot.SuggestionChannel,
      interaction.guild
    );

    const NoChannel = new MessageEmbed()
      .setTitle("Missing Channel!")
      .setDescription(supportbot.InvalidChannel)
      .setColor(supportbot.ErrorColour);

    if (!suggestChannel) return interaction.reply({ embeds: [NoChannel] });

    let suggestion = interaction.options.getString("suggestion");

    const SuggestEmbed = new MessageEmbed()
      .addField("Suggestion", suggestion, true)
      .addField("From", `<@${interaction.user.id}>`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({
        text: supportbot.EmbedFooter,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setColor(supportbot.EmbedColour);

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

    const Submitted = new MessageEmbed()
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
