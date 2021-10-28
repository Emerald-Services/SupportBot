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
  name: cmdconfig.PingCommand,
  description: cmdconfig.PingCommandDesc,
  slashCommandOptions: [],
  permission: "SEND_MESSAGES",

  async run(interaction) {
    const PingEmbed = new Discord.MessageEmbed()
      .setDescription(
        `:ping_pong: **Ping:** \`${interaction.client.ws.ping} ms\``
      )
      .setColor(supportbot.EmbedColour);

    interaction.reply({
      embeds: [PingEmbed],
    });
  },
});
