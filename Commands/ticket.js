// SupportBot | Emerald Services
// Ticket Command

const fs = require("fs");

const {
  EmbedBuilder,
  Permissions,
  MessageButton,
  MessageActionRow,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ButtonStyle,
  InteractionType
} = require("discord.js");

const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");
const TicketNumberID = require("../Structures/TicketID.js");

module.exports = new Command({
  name: cmdconfig.OpenTicket.Command,
  description: cmdconfig.OpenTicket.Description,
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "reason",
      description: "Ticket Reason",
      type: ApplicationCommandOptionType.String,
    },
    
  ],
  permissions: cmdconfig.OpenTicket.Permission,

  async run(interaction) {
    let disableCommand = true;

    if (cmdconfig.OpenTicket.Enabled === false) {
      if (interaction.type === InteractionType.ApplicationCommand && disableCommand)
      return interaction.reply({
        content: ":x: This command is `disabled`",
        ephemeral: true,
      });
    }

    let department = interaction.customId?.split("-")[1] || null;
    let TicketData = await JSON.parse(
      fs.readFileSync("./Data/TicketData.json", "utf8")
    );
    const { getRole, getCategory } = interaction.client;
    let User = interaction.guild.members.cache.get(interaction.user.id);

    if (
      supportbot.MaxAllowedTickets &&
      TicketData.tickets.filter((t) => t.user === interaction.user.id && t.open)
        .length >= supportbot.MaxAllowedTickets
    ) {
      return interaction.reply({
        embeds: [
          {
            title: "Too Many Tickets!",
            description: `You can't have more than ${supportbot.MaxAllowedTickets} open tickets!`,
            color: supportbot.WarningColour,
          },
        ],
        ephemeral: true,
      });
    }
    if (User.roles.cache.has(supportbot.TicketBlackListRole)) {
      return interaction.reply({
        content: supportbot.TicketBlackListMessage,
        ephemeral: true,
      })
    };
    if (User.roles.cache.has(supportbot.TicketMutedRole)) {
      return interaction.reply({
        content: supportbot.TicketMutedMessage,
        ephemeral: true,
      })
    };

    // Ticket ID
    let ticketNumberID = await TicketNumberID.pad();

    // Ticket Subject
    const TicketSubject =
      interaction.options?.getString("reason") || supportbot.NoTicketSubject;

    const TicketExists = new EmbedBuilder()
      .setTitle("Ticket Exists!")
      .setDescription(supportbot.TicketExists);

    if (
      await interaction.guild.channels.cache.find(
        (ticketChannel) =>
          ticketChannel.name === `${supportbot.TicketPrefix}${ticketNumberID}`
      )
    ) {
      return await interaction.reply({
        embeds: [TicketExists],
        ephemeral: true,
      });
    }
    const Staff = await getRole(supportbot.Staff, interaction.guild);
    const Admin = await getRole(supportbot.Admin, interaction.guild);
    if (!Staff || !Admin)
      return interaction.reply({
        content:
          "Some roles seem to be missing!\nPlease check for errors when starting the bot.",
        ephemeral: true,
      });
    let TicketCategory = await getCategory(
      supportbot.Departments[department].category,
      interaction.guild
    );
    const ticketChannel = await interaction.guild.channels.create(
      `${supportbot.TicketPrefix}${ticketNumberID}`,
      {
        type: "GUILD_TEXT",
        parent: TicketCategory.id,
        permissionOverwrites: [
          {
            id: Admin.id,
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
          },
          {
            id: interaction.user.id,
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
          },
          {
            id: interaction.guild.id,
            deny: [Permissions.FLAGS.VIEW_CHANNEL],
          },
        ],
      }
    );
    if (supportbot.AllowAllStaff) {
      await ticketChannel.permissionOverwrites.edit(Staff.id, {
        VIEW_CHANNEL: true,
      });
    }
    if (!department) {
      await ticketChannel.permissionOverwrites.edit(interaction.user.id, {
        SEND_MESSAGES: false,
      });
    }
    await TicketData.tickets.push({
      id: ticketChannel.id,
      name: ticketChannel.name,
      user: interaction.user.id,
      number: ticketNumberID,
      reason: TicketSubject,
      open: true,
      subUsers: [],
    });
    fs.writeFileSync(
      "./Data/TicketData.json",
      JSON.stringify(TicketData, null, 4),
      (err) => {
        if (err) console.error(err);
      }
    );

    const CreatedTicket = new EmbedBuilder()
      .setDescription(
        supportbot.TicketCreatedAlert.replace(
          /%ticketauthor%/g,
          interaction.user.id
        )
          .replace(/%ticketid%/g, ticketChannel.id)
          .replace(/%ticketusername%/g, interaction.user.username)
      )
      .setColor(supportbot.GeneralColour);
    await interaction.reply({ embeds: [CreatedTicket], ephemeral: true });

    if (supportbot.AllowTicketMentions) {
      await ticketChannel.send(`${interaction.user}`);
    }

    const TicketMessage = new EmbedBuilder()
      .setTitle(
        supportbot.Ticket_Title.replace(/%ticketauthor%/g, interaction.user.id)
          .replace(/%ticketid%/g, ticketChannel.id)
          .replace(/%ticketusername%/g, interaction.user.username)
      )
      .setDescription(
        supportbot.TicketMessage.replace(/%ticketauthor%/g, interaction.user.id)
          .replace(/%ticketid%/g, ticketChannel.id)
          .replace(/%ticketusername%/g, interaction.user.username)
      )
      .setColor(supportbot.GeneralColour);

    if (supportbot.TicketSubject === "embed") {
      if (TicketSubject !== "No Reason Provided.") {
        TicketMessage.addFields({ name: "Reason", value: TicketSubject });
      }
    }

    if (supportbot.TicketSubject === "description") {
      if (TicketSubject !== "No Reason Provided.") {
        await ticketChannel.setTopic(
          `Reason: ${TicketSubject}  -  User ID: ${interaction.user.id}  -  Ticket: ${ticketChannel.name}`
        );
      }
    }

    if (!department) {
      TicketMessage.addFields({
        name: "Departments",
        value: ` **${supportbot.Departments.map((X) => X.title).join("\n")}**`,
      });
    }
    const CloseButton = new MessageButton()
      .setCustomId("ticketclose")
      .setLabel("Close")
      .setStyle(supportbot.TicketCloseColour)
      .setEmoji(supportbot.TicketCloseEmoji);

    const LockButton = new MessageButton()
      .setCustomId("ticketlock")
      .setLabel("Lock")
      .setStyle(supportbot.TicketLockColour)
      .setEmoji(supportbot.TicketLockEmoji);

    const row2 = new MessageActionRow().addComponents(CloseButton, LockButton);
    if (!department) {
      try {
        let buttons = await supportbot.Departments.map((x) =>
          new MessageButton()
            .setCustomId("Department" + supportbot.Departments.indexOf(x))
            .setLabel(x.title)
            .setStyle(x.color)
            .setEmoji(x.emoji)
        );
        const row = new MessageActionRow().addComponents(buttons);
        const m = await ticketChannel.send({
          embeds: [TicketMessage],
          components: [row],
        });

        let collector;
        try {
          const filter = (i) => i.user.id === interaction.user.id;
          collector = await m.awaitMessageComponent({
            filter,
            max: 1,
            componentType: "BUTTON",
            time: supportbot.Timeout * 60000,
          });
        } catch (e) {
          if (e.code === "INTERACTION_COLLECTOR_ERROR") {
            try {
              TicketData = await JSON.parse(
                fs.readFileSync("./Data/TicketData.json", "utf8")
              );
              let ticket = await TicketData.tickets.findIndex(
                (t) => t.id === ticketChannel.id
              );
              TicketData.tickets[ticket].open = false;
              fs.writeFileSync(
                "./Data/TicketData.json",
                JSON.stringify(TicketData, null, 4),
                (err) => {
                  if (err) console.error(err);
                }
              );
              interaction.user.send(
                "Your ticket has timed out. Please open a new one, and select a department."
              );
            } catch (e) {}
            return await ticketChannel.delete();
          }
        }
        let num = collector.customId.split("Department")[1];
        let role = getRole(supportbot.Departments[num].role, interaction.guild);
        let title = supportbot.Departments[num].title;

        await ticketChannel.permissionOverwrites.edit(role.id, {
          VIEW_CHANNEL: true,
        });
        await ticketChannel.permissionOverwrites.edit(interaction.user.id, {
          SEND_MESSAGES: true,
        });

        await collector.reply({
          embeds: [
            {
              description: `> Thank for reaching out to the **${title} Department**. Please provide us information regarding your query.`,
              color: supportbot.GeneralColour,
            },
          ],
        });

        if (supportbot.AllowTicketMentions) {
          await ticketChannel.send("@here");
        }
        await collector.message.edit({
          embeds: [TicketMessage],
          components: [row2],
        });
      } catch (error) {}
    } else {
      await ticketChannel.send({
        embeds: [TicketMessage],
        components: [row2],
      });
      if (department) {
        let role = await getRole(
          supportbot.Departments[department].role,
          interaction.guild
        );
        let title = supportbot.Departments[department].title;
        await ticketChannel.permissionOverwrites.edit(role.id, {
          VIEW_CHANNEL: true,
        });
        let TicketCat = await getCategory(
          supportbot.Departments[department].category,
          interaction.guild
        );
        await ticketChannel.setParent(TicketCat.id, { lockPermissions: false });
        if (supportbot.AllowThanksForReachingOutMessage) {
          await ticketChannel.send({
            embeds: [
              {
                description: `> Thank for reaching out to the **${title} Department**. Please provide us information regarding your query.`,
                color: supportbot.GeneralColour,
              },
            ],
          });
        }
      }
      if (supportbot.AllowTicketMentions) {
        await ticketChannel.send(supportbot.TicketRoleMention);
      }
    }
  },
});
