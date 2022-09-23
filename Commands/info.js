// SupportBot | Emerald Services
// Info Command

const fs = require("fs");

const {
  MessageButton,
  MessageActionRow,
  MessageEmbed
} = require("discord.js");
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
    const InfoButton = new MessageButton()
      .setLabel(supportbot.InfoButtonText)
      .setURL(supportbot.InfoURL)
      .setStyle("LINK");

    const inforow = new MessageActionRow().addComponents(InfoButton);

    const InfoEmbed = new MessageEmbed()
      .setURL(supportbot.InfoURL)
      .setTitle(supportbot.InfoTitle)
      .setDescription(supportbot.AboutMe)
      .setColor(supportbot.InfoColour);

    interaction.reply({
      embeds: [InfoEmbed],
      components: [inforow],
    });
  },
});
