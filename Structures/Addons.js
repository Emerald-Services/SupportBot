// SupportBot | Emerald Services
// Addon Structure

const fs = require("fs");

const Discord = require("discord.js");

const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);

function RunFunction(interaction) {}

class Addon {
  constructor(options) {
    this.name = options.name;
    this.description = options.description;
    this.permission = options.permission;
    this.slashCommandOptions = options.slashCommandOptions || [];
    this.run = options.run;
  }
}

module.exports = Addon;
