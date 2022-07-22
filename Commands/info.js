// SupportBot | Emerald Services
// Info Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.InfoCommand,
  description: cmdconfig.InfoCommandDesc,
  options: [],
  permissions: ["SEND_MESSAGES"],

  async run(interaction) {
    const InfoButton = new Discord.ButtonBuilder()
      .setLabel(supportbot.InfoButtonText)
      .setURL(supportbot.InfoURL)
      .setStyle("Link");

    const inforow = new Discord.ActionRowBuilder().addComponents(InfoButton);

    const InfoEmbed = new Discord.EmbedBuilder()
      .setURL(supportbot.InfoURL)
      .setTitle(supportbot.InfoTitle)
      .setDescription(supportbot.InfoDesc)
      .setColor(supportbot.InfoColour)

    interaction.reply({
      embeds: [InfoEmbed],
      components: [inforow],
    });
  },
});