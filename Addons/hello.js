// SupportBot | Emerald Services
// Example (default) Addon

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(fs.readFileSync("./Data/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Data/commands.yml", "utf8"));

// Your Addon Config file! Saved in /Addons/Settings/YourAddonConig.yml
//  const exampleaddon = yaml.load(fs.readFileSync('./Addons/Settings/YourAddonConig.yml', 'utf8'));

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: "hello",
  description: "hello",
  slashCommandOptions: [],
  permission: "SEND_MESSAGES",

  async run(interaction) {
    const Embed = new Discord.MessageEmbed()
      .setDescription("Hello World!")
      .setColor(supportbot.InfoColour);

    interaction.reply({
      embeds: [Embed],
    });
  },
});
