// SupportBot | Emerald Services
// Ping Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(fs.readFileSync("./Data/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Data/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.SuggestCommand,
  description: cmdconfig.SuggestCommandDesc,
  slashCommandOptions: [
    {
      name: "suggestion",
      description: "Create a Suggestion",
      type: "STRING",
    },
  ],
  permission: "SEND_MESSAGES",

  async run(interaction) {
    const suggestChannel = client.channels.cache.get(
      supportbot.SuggestionChannel
    );

    const NoChannel = new Discord.MessageEmbed()
      .setTitle("Missing Channel!")
      .setDescription(`${supportbot.InvalidChannel}`)
      .setColor(supportbot.WarningColour);

    if (!suggestChannel) return interaction.reply({ embeds: [NoChannel] });

    let suggestion = interaction.options.getString("suggestion");

    const SuggestEmbed = new Discord.MessageEmbed()
      .addField("Suggestion", suggestion, true)
      .addField("From", `<@${interaction.user.id}>`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter(supportbot.EmbedFooter, interaction.user.displayAvatarURL())
      .setColor(supportbot.EmbedColour);

    suggestChannel.reply({ embeds: [SuggestEmbed] });

    const Submitted = new Discord.MessageEmbed()
      .setTitle("Suggestion Submitted!")
      .setDescription(
        `:white_check_mark: You have successfully submitted a suggestion.`
      )
      .addField("Sent to:", `<#${suggestChannel.id}>`)
      .setColor(supportbot.WarningColour);

    return interaction.reply({ embeds: [Submitted] });
  },
});
