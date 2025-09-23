// SupportBot | Emerald Services
// Info Command

const fs = require("fs");

const { ContainerBuilder, UserSelectMenuBuilder, ButtonStyle, MessageFlags } = require('discord.js');
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

const db = require("../../Structures/Database.js");
const Command = require("../../Structures/Command.js");

module.exports = new Command({
  name: "test",
  description: cmdconfig.Info.Description,
  options: [],
  permissions: cmdconfig.Info.Permission,

  async run(interaction, client) {

    const ticketPanelembed = new ContainerBuilder()
      .addTextDisplayComponents(
        textDisplay => textDisplay
        .setContent("SupportBot"),
      )


await interaction.reply({
	components: [ticketPanelembed],
	flags: MessageFlags.IsComponentsV2,
});

  },
});