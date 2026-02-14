// SupportBot | Emerald Services
// Info Command

const fs = require("fs");

const {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonStyle,
  MessageCollector,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SeparatorBuilder,
  ContainerBuilder,
  TextDisplayBuilder
} = require("discord.js");

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

const Command = require("../../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.TicketRename.Command,
  description: cmdconfig.TicketRename.Description,
  options: [],
  permissions: cmdconfig.TicketRename.Permission,

  async run(interaction) {
    const modal = new ModalBuilder()
      .setCustomId("renameTicketModal")
      .setTitle("Rename Channel")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("renameTicket")
            .setLabel("New Channel Name")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

    return interaction.showModal(modal);
  },
});
