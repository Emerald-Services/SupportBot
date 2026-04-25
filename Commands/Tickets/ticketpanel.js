// SupportBot | Emerald Services
// Ticket Panel Command

const fs = require("fs");
const {
  ApplicationCommandType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  SeparatorBuilder,
  SectionBuilder,
  StringSelectMenuBuilder,
  ThumbnailBuilder,
  EmbedBuilder,
} = require("discord.js");
const yaml = require("js-yaml");

const panelconfig = yaml.load(fs.readFileSync("./Configs/ticket-panel.yml", "utf8"));
const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../../Structures/Command.js");
const db = require("../../Structures/Database.js");

function parseButtonStyle(style) {
  switch (String(style || "1")) {
    case "1":
      return ButtonStyle.Primary;
    case "2":
      return ButtonStyle.Secondary;
    case "3":
      return ButtonStyle.Danger;
    case "4":
      return ButtonStyle.Success;
    default:
      return ButtonStyle.Primary;
  }
}

function getPanelMessage(key, fallback) {
  return panelconfig.Messages?.[key] || fallback;
}

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
        "Ticket Panel is not setup, You can set this in",
        `\u001b[31m`,
        "/Configs/ticket-panel.yml",
        `\n  `,
      );

      return interaction.reply({
        content: getPanelMessage(
          "NotConfigured",
          "Ticket Panel is not set up. Please configure it in `/Configs/ticket-panel.yml`.",
        ),
        flags: MessageFlags.Ephemeral,
      });
    }

    const { getChannel } = interaction.client;

    const channel = await getChannel(supportbot.Ticket.TicketHome, interaction.guild);

    if (!channel) {
      console.log(`[TICKET PANEL] TicketHome channel not found. Please check your config file.`);
      return interaction.reply({
        content: getPanelMessage(
          "InvalidChannel",
          "TicketHome channel not found. Please check your config file.",
        ),
        flags: MessageFlags.Ephemeral,
      });
    }

    const panelRow = db.getTicketPanel();

    if (panelRow) {
      try {
        const oldMessage = await channel.messages.fetch(panelRow.message_id);
        if (oldMessage) {
          await oldMessage.delete().catch(() => { });
        }
      } catch (err) {
        console.log(`[TICKET PANEL] Previous panel message not found, creating a new one.`);
      }
    }

    const departmentSystem = supportbot.Ticket?.DepartmentSystem || {};
    const prioritySystem = supportbot.Ticket?.PrioritySystem || {};
    const usingThreads = supportbot.Ticket?.TicketType === "threads";

    const departmentsEnabled = departmentSystem.Enabled === true && !usingThreads;
    const prioritiesEnabled = prioritySystem.Enabled === true && !usingThreads;
    const departments = departmentSystem.Departments || {};

    if (usingThreads && (departmentSystem.Enabled || prioritySystem.Enabled)) {
      console.log(
        "[SupportBot] Departments and Priority are disabled because TicketType is set to 'threads'.",
      );
    }

    const departmentOptions = Object.entries(departments)
      .slice(0, 25)
      .map(([key, dept]) => ({
        label: dept.Name || key,
        description:
          dept.PanelDescription ||
          dept.Description ||
          panelconfig.DepartmentMenu?.DefaultDescription ||
          `Open a ${String(dept.Name || key).toLowerCase()} ticket`,
        value: key,
        emoji:
          dept.Emoji ||
          panelconfig.DepartmentMenu?.DefaultEmoji ||
          panelconfig.Button?.Emoji ||
          undefined,
      }));

    const shouldUseDepartments = departmentsEnabled && departmentOptions.length > 0;

    let openerComponent;

    if (shouldUseDepartments) {
      openerComponent = new StringSelectMenuBuilder()
        .setCustomId(panelconfig.DepartmentMenu?.CustomId || "ticketdepartmentselect")
        .setPlaceholder(
          panelconfig.DepartmentMenu?.Placeholder ||
          departmentSystem.Placeholder ||
          panelconfig.Button?.Text ||
          "Choose a ticket department",
        )
        .addOptions(departmentOptions);
    } else {
      openerComponent = new ButtonBuilder()
        .setCustomId(panelconfig.Button?.CustomId || "createticket")
        .setLabel(panelconfig.Button?.Text || "Create Ticket")
        .setStyle(parseButtonStyle(panelconfig.Button?.Color));

      if (panelconfig.Button?.Emoji) {
        openerComponent.setEmoji(panelconfig.Button.Emoji);
      }
    }

    const panelContainer = new ContainerBuilder();

    if (panelconfig.Style?.Color) {
      panelContainer.setAccentColor(parseInt(String(panelconfig.Style.Color).replace("#", ""), 16));
    }

    const layout = String(panelconfig.Style?.Layout || "3");
    const showImage = panelconfig.Settings?.Image === true && !!panelconfig.Style?.Image;
    const showTopTitle = panelconfig.Settings?.TopTitle === true;
    const showTopDivider = panelconfig.Settings?.TopDivider === true;
    const showBottomTitle = panelconfig.Settings?.BottomTitle === true;
    const showBottomDivider = panelconfig.Settings?.BottomDivider === true;

    const panelTitle = new TextDisplayBuilder().setContent(
      panelconfig.Style?.Title || "## SupportBot Ticket Creation",
    );

    const rawTitle = (panelconfig.Style?.Title || "SupportBot Ticket Creation").replace(/^#+\s*/, "");

    const panelDesc = new TextDisplayBuilder().setContent(
      panelconfig.Style?.Description || "Click on the button below to create a support ticket.",
    );

    if (showTopTitle) {
      panelContainer.addTextDisplayComponents(panelTitle);
    }

    if (showTopDivider) {
      panelContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    }

    if (layout === "1" || layout === "3") {
      panelContainer.addTextDisplayComponents(panelDesc);
    }

    if (showImage && layout === "2") {
      const panelImage = new MediaGalleryBuilder().addItems([
        {
          media: {
            url: panelconfig.Style.Image,
          },
        },
      ]);

      panelContainer.addMediaGalleryComponents(panelImage);
    }

    if (layout === "1") {
      const middleSection = new SectionBuilder().addTextDisplayComponents(panelDesc);

      if (!shouldUseDepartments) {
        middleSection.setButtonAccessory(openerComponent);
        panelContainer.addSectionComponents(middleSection);
      } else {
        panelContainer.addSectionComponents(middleSection);
        panelContainer.addActionRowComponents(
          new ActionRowBuilder().addComponents(openerComponent),
        );
      }
    }

    if (showImage && layout === "3") {
      const panelImage = new MediaGalleryBuilder().addItems([
        {
          media: {
            url: panelconfig.Style.Image,
          },
        },
      ]);

      panelContainer.addMediaGalleryComponents(panelImage);
    }

    if (showBottomTitle) {
      panelContainer.addTextDisplayComponents(panelTitle);
    }

    if (showBottomDivider) {
      panelContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    }

    if (layout === "2") {
      const middleSection = new SectionBuilder().addTextDisplayComponents(panelDesc);

      if (!shouldUseDepartments) {
        middleSection.setButtonAccessory(openerComponent);
        panelContainer.addSectionComponents(middleSection);
      } else {
        panelContainer.addSectionComponents(middleSection);
        panelContainer.addActionRowComponents(
          new ActionRowBuilder().addComponents(openerComponent),
        );
      }
    }

    if (layout === "3") {
      panelContainer.addActionRowComponents(new ActionRowBuilder().addComponents(openerComponent));
    }

    if (layout === "4") {
      // Create a classic Discord Embed for Layout 4
      const oldEmbed = new EmbedBuilder()
        .setTitle(rawTitle)
        .setDescription(panelconfig.Style?.Description || "Click on the button below to create a support ticket.");

      if (panelconfig.Style?.Color) {
        oldEmbed.setColor(panelconfig.Style.Color);
      }

      if (showImage && panelconfig.Style?.Image) {
        oldEmbed.setThumbnail(panelconfig.Style.Image);
      }

      try {
        const message = await channel.send({
          embeds: [oldEmbed],
          components: [new ActionRowBuilder().addComponents(openerComponent)],
        });

        db.saveTicketPanel(message.id, channel.id);

        return interaction.reply({
          content: shouldUseDepartments
            ? getPanelMessage(
              "PanelSentWithDepartments",
              "Ticket panel message with department selection has been sent!",
            )
            : getPanelMessage("PanelSent", "Ticket panel message has been sent!"),
          flags: MessageFlags.Ephemeral,
        });
      } catch (e) {
        console.log("Error sending message:", e);
        return interaction.reply({
          content: getPanelMessage(
            "SendError",
            "An error occurred while sending the ticket panel message.",
          ),
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    if (showImage && layout === "1") {
      const panelImage = new MediaGalleryBuilder().addItems([
        {
          media: {
            url: panelconfig.Style.Image,
          },
        },
      ]);

      panelContainer.addMediaGalleryComponents(panelImage);
    }

    try {
      const message = await channel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [panelContainer],
      });

      db.saveTicketPanel(message.id, channel.id);

      return interaction.reply({
        content: shouldUseDepartments
          ? getPanelMessage(
            "PanelSentWithDepartments",
            "Ticket panel message with department selection has been sent!",
          )
          : getPanelMessage("PanelSent", "Ticket panel message has been sent!"),
        flags: MessageFlags.Ephemeral,
      });
    } catch (e) {
      console.log("Error sending message:", e);
      return interaction.reply({
        content: getPanelMessage(
          "SendError",
          "An error occurred while sending the ticket panel message.",
        ),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});
