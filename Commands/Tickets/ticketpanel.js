const fs = require("fs");
const {
  EmbedBuilder,
  ApplicationCommandType,
  ActionRowBuilder,
  ButtonBuilder,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  SeparatorBuilder,
  ThumbnailBuilder,
  SectionBuilder
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

    const panelContainer = new ContainerBuilder()

    if (panelconfig.Style.Color) {
      panelContainer.setAccentColor(
        parseInt(panelconfig.Style.Color.replace("#", ""), 16)
      )
    }

    const panelTitle = new TextDisplayBuilder().setContent(
      panelconfig.Style.Title,
    );

    const topSeperator = new SeparatorBuilder()
      .setDivider(true)

    if (panelconfig.Settings.TopTitle) {
      panelContainer.addTextDisplayComponents(panelTitle)
    }

    if (panelconfig.Settings.TopDivider) {
      panelContainer.addSeparatorComponents(topSeperator)
    }

    const panelDesc = new TextDisplayBuilder().setContent(
      panelconfig.Style.Description,
    );

    if (panelconfig.Style.Layout === "3") {
      panelContainer.addTextDisplayComponents(panelDesc)
    }

    const createTicketButton = new ButtonBuilder()
      .setCustomId("createticket")
      .setLabel(panelconfig.Button.Text)
      .setEmoji(panelconfig.Button.Emoji)
      .setStyle(panelconfig.Button.Color);

    const middleSection = new SectionBuilder()
      .addTextDisplayComponents(panelDesc)
      .setButtonAccessory(createTicketButton)

    if (panelconfig.Style.Layout === "1") {
      panelContainer.addSectionComponents(middleSection)
    }

    const panelImage = new MediaGalleryBuilder()
      .addItems([
        {
          media: {
            url: panelconfig.Style.Image,
          },
        }
      ])

    if (panelconfig.Settings.Image) {
      panelContainer.addMediaGalleryComponents(panelImage)
    }

    // START OF STYLE 2 - TEXT UNDER THE IMAGE

    const bottomSeperator = new SeparatorBuilder()
      .setDivider(true)

    if (panelconfig.Settings.BottomTitle) {
      panelContainer.addTextDisplayComponents(panelTitle)
    }

    if (panelconfig.Settings.BottomDivider) {
      panelContainer.addSeparatorComponents(bottomSeperator)
    }

    if (panelconfig.Style.Layout === "2") {
      panelContainer.addSectionComponents(middleSection)
    }

    // START OF STYLE 3

    const buttonRow = new ActionRowBuilder();
      const ticketButtonRow = new ButtonBuilder()
        .setCustomId("createticket")
        .setLabel(panelconfig.Button.Text)
        .setEmoji(panelconfig.Button.Emoji)
        .setStyle(panelconfig.Button.Color);
      buttonRow.addComponents(ticketButtonRow)

    if (panelconfig.Style.Layout === "3") {
      panelContainer.addActionRowComponents(buttonRow)
    }

    try {
      const message = await channel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [panelContainer],
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
