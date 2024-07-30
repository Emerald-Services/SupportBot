const Discord = require("discord.js");
const fs = require("fs");
const yaml = require("js-yaml");
const { Command } = require('../Structures/Addon.js'); // Adjust the path as needed
const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));

module.exports = new Command({
    name: "addon",
    description: "This is a sample addon!",
    options: [],
    permissions: ["Administrator"],
  
    async run(interaction) {
      let disableCommand = true;
  
      const PingEmbed = new Discord.EmbedBuilder()
        .setDescription(
          `This is a sample addon.\n\nPong! \`${interaction.client.ws.ping} ms\``
        )
        .setColor(supportbot.Embed.Colours.General);
  
      interaction.reply({
        embeds: [PingEmbed],
      });
    },
  });