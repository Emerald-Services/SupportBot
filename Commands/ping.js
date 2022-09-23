// SupportBot | Emerald Services
// Ping Command

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
  name: cmdconfig.PingCommand,
  description: cmdconfig.PingCommandDesc,
  options: [],
  permissions: ["SEND_MESSAGES"],

  async run(interaction) {
    const PingEmbed = new MessageEmbed()
      .setDescription(
        `:ping_pong: **Ping:** \`${interaction.client.ws.ping} ms\``
      )
      .setColor(supportbot.EmbedColour);

    interaction.reply({
      embeds: [PingEmbed],
    });
  },
});
