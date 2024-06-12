// SupportBot | Emerald Services
// Info Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");

const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);

const cmdconfig = yaml.load(
  fs.readFileSync("./Configs/commands.yml", "utf8")
);

const msgconfig = yaml.load(
  fs.readFileSync("./Configs/messages.yml", "utf8")
);

const Command = require("../Structures/Command.js");

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