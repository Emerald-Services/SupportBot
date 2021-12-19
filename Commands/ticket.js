// SupportBot | Emerald Services
// Ticket Command

const fs = require("fs");

const {
  MessageEmbed,
  Permissions,
  MessageButton,
  MessageActionRow,
} = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");
const TicketNumberID = require("../Structures/TicketID.js");

module.exports = new Command({
  name: cmdconfig.OpenTicket,
  description: cmdconfig.OpenTicketDesc,
  options: [
    {
      name: "reason",
      description: "Ticket Reason",
      type: "STRING",
    },
  ],
  permissions: ["SEND_MESSAGES"],

  async run(interaction) {
    let TicketData = await JSON.parse(
      fs.readFileSync("./Data/TicketData.json", "utf8")
    );
    const { getRole, getChannel, getCategory } = interaction.client;
    let User = interaction.guild.members.cache.get(interaction.user.id);

    if (
      supportbot.MaxAllowedTickets &&
      TicketData.tickets.filter((t) => t.user == interaction.user.id && t.open)
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
    if (
      User.roles.cache.has(
        getRole(supportbot.TicketBlackListRole, interaction.guild).id
      )
    ) {
      return interaction.reply({
        content: supportbot.TicketBlackListMessage,
        ephemeral: true,
      });
    }

    // Ticket ID
    let ticketNumberID = await TicketNumberID.pad();

    // Ticket Subject
    const TicketSubject =
      interaction.options?.getString("reason") || supportbot.NoTicketSubject;

    const TicketExists = new MessageEmbed()
      .setTitle("Ticket Exists!")
      .setDescription(`${supportbot.TicketExists}`)
      .setColor(supportbot.WarningColour);

    if (
      await interaction.guild.channels.cache.find((ticketChannel) => {
        ticketChannel.name === `${supportbot.TicketPrefix}${ticketNumberID}`;
      })
    ) {
      return await interaction.reply({ embeds: [TicketExists] });
    }
    const Staff = await getRole(supportbot.Staff, interaction.guild);
    const Admin = await getRole(supportbot.Admin, interaction.guild);
    const DeptRole1 = await getRole(
      supportbot.DepartmentRole_1,
      interaction.guild
    );
    const DeptRole2 = await getRole(
      supportbot.DepartmentRole_2,
      interaction.guild
    );
    const DeptRole3 = await getRole(
      supportbot.DepartmentRole_3,
      interaction.guild
    );
    if (!Staff || !Admin || !DeptRole1 || !DeptRole2 || !DeptRole3)
      return interaction.reply({
        content:
          "Some roles seem to be missing!\nPlease check for errors when starting the bot.",
        ephemeral: true,
      });
    const Author = interaction.user;
    let TicketCategory = await getCategory(
      supportbot.TicketCategory,
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
            id: Author.id,
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: [Permissions.FLAGS.SEND_MESSAGES],
          },
          {
            id: interaction.guild.id,
            deny: [Permissions.FLAGS.VIEW_CHANNEL],
          },
        ],
      }
    );
    if (supportbot.AllowStaff) {
      ticketChannel.permissionOverwrites.edit(Staff.id, {
        VIEW_CHANNEL: true,
      });
    }
    await TicketData.tickets.push({
      id: ticketChannel.id,
      name: ticketChannel.name,
      user: Author.id,
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

    const CreatedTicket = new MessageEmbed()
      .setDescription(
        supportbot.TicketCreatedAlert.replace(
          /%ticketauthor%/g,
          interaction.user.id
        )
          .replace(/%ticketid%/g, ticketChannel.id)
          .replace(/%ticketusername%/g, interaction.user.username)
      )
      .setColor(supportbot.EmbedColour);
    await interaction.reply({ embeds: [CreatedTicket], ephemeral: true });

    if (supportbot.AllowTicketMentions) {
      await ticketChannel.send(`${interaction.user}`);
    }

    const TicketMessage = new MessageEmbed()
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
      .setColor(supportbot.EmbedColour);

    if (supportbot.TicketSubject === "embed") {
      if (TicketSubject != "No Reason Provided.") {
        TicketMessage.addFields({ name: "Reason", value: TicketSubject });
      }
    }

    if (supportbot.TicketSubject === "description") {
      if (TicketSubject != "No Reason Provided.") {
        await ticketChannel.setTopic(
          `Reason: ${TicketSubject}  -  User ID: ${interaction.user.id}  -  Ticket: ${ticketChannel.name}`
        );
      }
    }

    if (supportbot.TicketDepartments) {
      TicketMessage.addFields({
        name: "Departments",
        value: ` **${supportbot.DepartmentTitle_1}**\n **${supportbot.DepartmentTitle_2}**\n **${supportbot.DepartmentTitle_3}**`,
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

    if (supportbot.TicketDepartments) {
      try {
        const Department1Button = new MessageButton()
          .setCustomId("Department1")
          .setLabel(supportbot.DepartmentTitle_1)
          .setStyle(supportbot.TicketDept1Colour)
          .setEmoji(supportbot.TicketDept1Emoji);

        const Department2Button = new MessageButton()
          .setCustomId("Department2")
          .setLabel(supportbot.DepartmentTitle_2)
          .setStyle(supportbot.TicketDept2Colour)
          .setEmoji(supportbot.TicketDept2Emoji);

        const Department3Button = new MessageButton()
          .setCustomId("Department3")
          .setLabel(supportbot.DepartmentTitle_3)
          .setStyle(supportbot.TicketDept3Colour)
          .setEmoji(supportbot.TicketDept3Emoji);

        const row = new MessageActionRow().addComponents(
          Department1Button,
          Department2Button,
          Department3Button
        );

        const m = await ticketChannel.send({
          embeds: [TicketMessage],
          components: [row],
        });

        const filter = (i) => i.user.id === interaction.user.id;
        let collector;
        try {
          collector = await m.awaitMessageComponent({
            filter,
            max: 1,
            componentType: "BUTTON",
            time: supportbot.Timeout * 60000,
          });
        } catch (e) {
          if (e.code == "INTERACTION_COLLECTOR_ERROR")
            try {
              let ticket = await TicketData.tickets.findIndex(
                (t) => t.id == ticketChannel.id
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
        let role;
        let title;
        if (collector.customId === "Department1") {
          role = DeptRole1;
          title = supportbot.DepartmentTitle_1;
        }
        if (collector.customId === "Department2") {
          role = DeptRole2;
          title = supportbot.DepartmentTitle_2;
        }
        if (collector.customId === "Department3") {
          role = DeptRole3;
          title = supportbot.DepartmentTitle_3;
        }

        ticketChannel.permissionOverwrites.edit(role.id, {
          VIEW_CHANNEL: true,
        });
        ticketChannel.permissionOverwrites.edit(Author.id, {
          SEND_MESSAGES: true,
        });

        await collector.reply({
          embeds: [
            {
              description: `> Thank for reaching out to the **${title} Department**. Please provide us information regarding your query.`,
              color: supportbot.EmbedColour,
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
      await ticketChannel.send({ embeds: [TicketMessage], components: [row2] });
    }
  },
});
