// SupportBot | Emerald Services
// Info Command

const Discord = require("discord.js");

const supportbot = require("../../Structures/ConfigStore").supportbot;
const cmdconfig = require("../../Structures/ConfigStore").commands;
const msgconfig = require("../../Structures/ConfigStore").messages;

const Command = require("../../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.Info.Command,
  description: cmdconfig.Info.Description,
  options: [],
  permissions: cmdconfig.Info.Permission,

  async run(interaction) {
    let disableCommand = true;

  const InfoButton = new Discord.ButtonBuilder()
    .setLabel(msgconfig.Info.Button)
    .setURL(msgconfig.Info.URL)
    .setStyle("Link");

  const inforow = new Discord.ActionRowBuilder().addComponents(InfoButton);

  const InfoEmbed = new Discord.EmbedBuilder()
    .setURL(msgconfig.Info.URL)
    .setTitle(msgconfig.Info.Title)
    .setDescription(msgconfig.Info.Description)
    .setColor(msgconfig.Info.Colour)

  interaction.reply({
    embeds: [InfoEmbed],
    components: [inforow],
  });

  },
});