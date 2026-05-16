// SupportBot | Emerald Services
// Ping Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = require("../../Structures/ConfigStore").supportbot;
const cmdconfig = require("../../Structures/ConfigStore").commands;

const Command = require("../../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.Ping.Command,
  description: cmdconfig.Ping.Description,
  options: [],
  permissions: cmdconfig.Ping.Permission,

  async run(interaction) {
    let disableCommand = true;

    const PingEmbed = new Discord.EmbedBuilder()
      .setDescription(
        `:ping_pong: **Ping:** \`${interaction.client.ws.ping} ms\``
      )
      .setColor(supportbot.Embed.Colours.General);

    interaction.reply({
      embeds: [PingEmbed],
    });
  },
});
