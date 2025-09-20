const fs = require("fs");
const {
  EmbedBuilder,
  ApplicationCommandType,
  ActionRowBuilder,
  ButtonBuilder,
  MessageFlags,
} = require("discord.js");
const yaml = require("js-yaml");

const panelconfig = yaml.load(fs.readFileSync("./Configs/ticket-panel.yml", "utf8"));
const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../../Structures/Command.js");
const db = require("../../Structures/Database.js");

module.exports = new Command({
  name: cmdconfig.TicketPanel.Command,
  description: cmdconfig.TicketPanel.Description,
  type: ApplicationCommandType.ChatInput,
  options: [],
  permissions: cmdconfig.TicketPanel.Permission,

  async run(interaction) {
    if (!panelconfig.Panel) {
      console.log(
        "\u001b[31m",
        `[TICKET PANEL]`,
        "\u001b[33m",
        "Ticket Panel is not setup, You can set this in", `\u001b[31m`, '/Configs/ticket-panel.yml', `\n  `,
      );
      return interaction.reply({
        content: "Ticket Panel is not set up. Please configure it in `/Configs/ticket-panel.yml`.",
        flags: MessageFlags.Ephemeral 
      });
    }

    const { getChannel } = interaction.client;

    const channel = await getChannel(
      supportbot.Ticket.TicketHome,
      interaction.guild
    );

    if (!channel) {
      console.log(`[TICKET PANEL] ${channelName} channel not found. Please check your config file.`);
      return interaction.reply({
        content: `${channelName} channel not found. Please check your config file.`,
        flags: MessageFlags.Ephemeral 
      });
    }

    const panelRow = db.getTicketPanel();
    if (panelRow) {
      try {
        await channel.messages.fetch(panelRow.message_id);
        return interaction.reply({
          content: "Ticket panel message already exists.",
          flags: MessageFlags.Ephemeral 
        });
      } catch (err) {}
    }

    let embed = new EmbedBuilder()
      .setTitle(panelconfig.PanelTitle)
      .setColor(panelconfig.PanelColour)
      .setFooter({
        text: supportbot.Embed.Footer,
        iconURL: interaction.user.displayAvatarURL(),
      });

    if (panelconfig.TicketPanel_Description) {
      embed.setDescription(panelconfig.PanelMessage);
    }

    if (panelconfig.TicketPanel_Thumbnail) {
      embed.setThumbnail(panelconfig.PanelThumbnail);
    }

    if (panelconfig.TicketPanel_Image) {
      embed.setImage(panelconfig.PanelImage);
    }

    const createTicketButton = new ButtonBuilder()
      .setCustomId("createticket")
      .setLabel(panelconfig.Button.Text)
      .setEmoji(panelconfig.Button.Emoji)
      .setStyle(panelconfig.Button.Color);

    let row = new ActionRowBuilder().addComponents(createTicketButton);

    try {
      const message = await channel.send({
        embeds: [embed],
        components: [row],
      });

      db.saveTicketPanel(message.id, channel.id);

      return interaction.reply({
        content: "Ticket panel message has been sent!",
        flags: MessageFlags.Ephemeral 
      });
    } catch (e) {
      console.log("Error sending message:", e);
      return interaction.reply({
        content: "An error occurred while sending the ticket panel message.",
        flags: MessageFlags.Ephemeral 
      });
    }
  },
});
