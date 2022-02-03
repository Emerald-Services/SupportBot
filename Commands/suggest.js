// SupportBot | Emerald Services
// Ping Command

const fs = require("fs");

const Discord = require("discord.js");
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

    const NoChannel = new Discord.MessageEmbed()
      .setTitle("Missing Channel!")
      .setDescription(`${supportbot.InvalidChannel}`)
      .setColor(supportbot.ErrorColour);

    if (!suggestChannel) return interaction.reply({ embeds: [NoChannel] });

    let suggestion = interaction.options.getString("suggestion");

    const SuggestEmbed = new Discord.MessageEmbed()
      .addField("Suggestion", suggestion, true)
      .addField("From", `<@${interaction.user.id}>`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter(supportbot.EmbedFooter, interaction.user.displayAvatarURL())
      .setColor(supportbot.EmbedColour);

    const suggestionMsg = await suggestChannel.send({ embeds: [SuggestEmbed] });
    if (supportbot.SuggestionUpvote && supportbot.SuggestionDownvote) {
      await suggestionMsg.react(supportbot.SuggestionUpvote);
      await suggestionMsg.react(supportbot.SuggestionDownvote);
    }

    const Submitted = new Discord.MessageEmbed()
      .setTitle("Suggestion Submitted!")
      .setDescription(
        `:white_check_mark: You have successfully submitted a suggestion.`
      )
      .addField("Sent to:", `<#${suggestChannel.id}>`)
      .setColor(supportbot.SuccessColour);

    return interaction.reply({ embeds: [Submitted] });
  },
});
