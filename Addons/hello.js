// SupportBot | Emerald Services
// Example (default) Addon

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

// Your Addon Config file! Saved in /Addons/Configs/YourAddonConfig.yml
// const config = yaml.load(fs.readFileSync('./Addons/Configs/YourAddonConfig.yml', 'utf8'));

const { Command, Event } = require("../Structures/Addon");

module.exports.commands = [
  /*
  // EXAMPLE COMMAND
  new Command({
    name: "hello",
    description: "hello",
    options: [],
    permissions: ["SEND_MESSAGES"],
    async run(interaction) {
      const Embed = new Discord.MessageEmbed()
        .setDescription("Hello World!")
        .setColor(supportbot.InfoColour);

      interaction.reply({
        embeds: [Embed],
      });
    },
  }),
  */
];
module.exports.events = [
  /*
  // EXAMPLE EVENT
  new Event("ready", async (client) => {
    console.log("Bot started!");
  }), 
  */
];
