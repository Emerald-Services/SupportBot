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
  name: cmdconfig.Ping.Command,
  description: cmdconfig.Ping.Description,
  options: [],
  permissions: cmdconfig.Ping.Permission,

  async run(interaction) {
    let disableCommand = true;

    if (cmdconfig.Ping.Enabled === false) {
      if (interaction.type === Discord.InteractionType.ApplicationCommand && disableCommand)
      return interaction.reply({
        content: ":x: This command is `disabled`",
        ephemeral: true,
      });
    }

    const PingEmbed = new Discord.EmbedBuilder()
      .setDescription(
        `:ping_pong: **Ping:** \`${interaction.client.ws.ping} ms\``
      )
      .setColor(supportbot.GeneralColour);

    interaction.reply({
      embeds: [PingEmbed],
    });
  },
});
