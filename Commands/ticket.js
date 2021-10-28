// SupportBot | Emerald Services
// Ticket Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");
const TicketNumberID = require("../Structures/TicketID.js");

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

module.exports = new Command({
  name: cmdconfig.OpenTicket,
  description: cmdconfig.OpenTicketDesc,
  slashCommandOptions: [
    {
      name: "reason",
      description: "Ticket Reason",
      type: "STRING",
    },
  ],
  permission: "SEND_MESSAGES",

  async run(interaction) {
    let reactionUser = interaction.guild.members.cache.get(interaction.user.id);

    if (
      reactionUser.roles.cache.find(
        (role) => role.name === supportbot.TicketBlackListRole
      ) ||
      reactionUser.roles.cache.find(
        (role) => role.id === supportbot.TicketBlackListRole
      )
    ) {
      return interaction
        .reply({
          content: `<@${interaction.user.id}> ${supportbot.TicketBlackListMessage}`,
        })
        .then((msg) => {
          setTimeout(() => msg.delete(), 3500);
        });
    }

    // Ticket ID
    let ticketNumberID = TicketNumberID.pad(interaction.guild.id);

    // Ticket Subject
    const TicketSubject =
      interaction.options?.getString("reason") || supportbot.NoTicketSubject;

    const TicketExists = new Discord.MessageEmbed()
      .setTitle("Ticket Exists!")
      .setDescription(`${supportbot.TicketExists}`)
      .setColor(supportbot.WarningColour);

    if (
      interaction.guild.channels.cache.find(
        (ticketChannel) =>
          ticketChannel.name === `${supportbot.TicketPrefix}${ticketNumberID}`
      )
    ) {
      return interaction.reply({ embeds: [TicketExists] });
    }
    const Staff =
      interaction.guild.roles.cache.find(
        (SupportTeam) => SupportTeam.name === supportbot.Staff
      ) ||
      interaction.guild.roles.cache.find(
        (SupportTeam) => SupportTeam.id === supportbot.Staff
      );
    const Admins =
      interaction.guild.roles.cache.find(
        (AdminUser) => AdminUser.name === supportbot.Admin
      ) ||
      interaction.guild.roles.cache.find(
        (AdminUser) => AdminUser.id === supportbot.Admin
      );
    const DeptRole1 =
      interaction.guild.roles.cache.find(
        (DepartmentRole) =>
          DepartmentRole.name === `${supportbot.DepartmentRole_1}`
      ) ||
      interaction.guild.roles.cache.find(
        (DepartmentRole) =>
          DepartmentRole.id === `${supportbot.DepartmentRole_1}`
      );
    const DeptRole2 =
      interaction.guild.roles.cache.find(
        (DepartmentRole) =>
          DepartmentRole.name === `${supportbot.DepartmentRole_2}`
      ) ||
      interaction.guild.roles.cache.find(
        (DepartmentRole) =>
          DepartmentRole.id === `${supportbot.DepartmentRole_2}`
      );
    const DeptRole3 =
      interaction.guild.roles.cache.find(
        (DepartmentRole) =>
          DepartmentRole.name === `${supportbot.DepartmentRole_3}`
      ) ||
      interaction.guild.roles.cache.find(
        (DepartmentRole) =>
          DepartmentRole.id === `${supportbot.DepartmentRole_3}`
      );
    const Author = interaction.user;
    const Everyone = interaction.guild.id;
    const ticketChannel = await interaction.guild.channels.create(
      `${supportbot.TicketPrefix}${ticketNumberID}`,
      {
        type: "GUILD_TEXT",
      }
    );

    if (
      interaction.channel.name === supportbot.ReactionChannel ||
      interaction.channel.id === supportbot.ReactionChannel
    ) {
      const CreatedTicket = new Discord.MessageEmbed()
        .setDescription(
          supportbot.TicketCreatedAlert.replace(
            /%ticketauthor%/g,
            interaction.user.id
          )
            .replace(/%ticketid%/g, ticketChannel.id)
            .replace(/%ticketusername%/g, interaction.user.username)
        )
        .setColor(supportbot.EmbedColour);
      interaction.reply({ embeds: [CreatedTicket], ephemeral: true });
    } else {
      const CreatedTicket = new Discord.MessageEmbed()
        .setDescription(
          supportbot.TicketCreatedAlert.replace(
            /%ticketauthor%/g,
            interaction.user.id
          )
            .replace(/%ticketid%/g, ticketChannel.id)
            .replace(/%ticketusername%/g, interaction.user.username)
        )
        .setColor(supportbot.EmbedColour);
      interaction.reply({ embeds: [CreatedTicket], ephemeral: true });
    }
    let AllowArr = [Staff, Staff, Admins, Author];
    await asyncForEach(AllowArr, (index) => {
      ticketChannel.permissionOverwrites.create(index, { VIEW_CHANNEL: true });
    });

    let DenyArr = [Everyone];
    await asyncForEach(DenyArr, (index) => {
      ticketChannel.permissionOverwrites.create(index, { VIEW_CHANNEL: false });
    });

    let TicketCategory =
      interaction.guild.channels.cache.find(
        (category) => category.name === supportbot.TicketCategory
      ) ||
      interaction.guild.channels.cache.find(
        (category) => category.id === supportbot.TicketCategory
      );
    if (TicketCategory) {
      ticketChannel.setParent(TicketCategory.id);
    }

    if (supportbot.AllowTicketMentions) {
      ticketChannel.send({ content: `${interaction.user}` });
    }

    const TicketMessage = new Discord.MessageEmbed()
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
        ticketChannel.setTopic(
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
    const CloseButton = new Discord.MessageButton()
      .setCustomId("ticketclose")
      .setLabel("Close")
      .setStyle(supportbot.TicketCloseColour)
      .setEmoji(supportbot.TicketCloseEmoji);

    const LockButton = new Discord.MessageButton()
      .setCustomId("ticketlock")
      .setLabel("Lock")
      .setStyle(supportbot.TicketLockColour)
      .setEmoji(supportbot.TicketLockEmoji);

    const row2 = new Discord.MessageActionRow().addComponents(
      CloseButton,
      LockButton
    );

    if (supportbot.TicketDepartments) {
      let DenyArr = [DeptRole1, DeptRole2, DeptRole3];
      await asyncForEach(DenyArr, (index) => {
        ticketChannel.permissionOverwrites.create(index, {
          VIEW_CHANNEL: false,
        });
      });
      const Department1Button = new Discord.MessageButton()
        .setCustomId("Department1")
        .setLabel(`${supportbot.DepartmentTitle_1}`)
        .setStyle(supportbot.TicketDept1Colour)
        .setEmoji(supportbot.TicketDept1Emoji);

      const Department2Button = new Discord.MessageButton()
        .setCustomId("Department2")
        .setLabel(`${supportbot.DepartmentTitle_2}`)
        .setStyle(supportbot.TicketDept2Colour)
        .setEmoji(supportbot.TicketDept2Emoji);

      const Department3Button = new Discord.MessageButton()
        .setCustomId("Department3")
        .setLabel(`${supportbot.DepartmentTitle_3}`)
        .setStyle(supportbot.TicketDept3Colour)
        .setEmoji(supportbot.TicketDept3Emoji);

      const row = new Discord.MessageActionRow().addComponents(
        Department1Button,
        Department2Button,
        Department3Button
      );

      const m = await ticketChannel.send({
        embeds: [TicketMessage],
        components: [row],
      });

      const filter = (i) => {
        i.deferUpdate();
        return i.user.id === interaction.user.id;
      };
      const collector = m.createMessageComponentCollector({
        filter,
        max: 1,
        componentType: "BUTTON",
        time: 60000,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "Department1") {
          ticketChannel.permissionOverwrites.edit(DeptRole1, {
            VIEW_CHANNEL: true,
            READ_MESSAGE_HISTORY: true,
            SEND_MESSAGES: true,
          });

          if (!supportbot.AllowStaff) {
            ticketChannel.permissionOverwrites.edit(Staff, {
              VIEW_CHANNEL: false,
              READ_MESSAGE_HISTORY: false,
              SEND_MESSAGES: false,
            });
          }

          const Department1 = new Discord.MessageEmbed()
            .setDescription(
              `> Thank for reaching out to the **${supportbot.DepartmentTitle_1} Department**. Please provide us information regarding your query.`
            )
            .setColor(supportbot.EmbedColour);
          ticketChannel.send({ embeds: [Department1] });

          if (supportbot.AllowTicketMentions) {
            ticketChannel.send({ content: `@here` });
          }
        }
        i.message.edit({ embeds: [TicketMessage], components: [row2] });

        if (i.customId === "Department2") {
          ticketChannel.permissionOverwrites.edit(DeptRole2, {
            VIEW_CHANNEL: true,
            READ_MESSAGE_HISTORY: true,
            SEND_MESSAGES: true,
          });

          if (!supportbot.AllowStaff) {
            ticketChannel.permissionOverwrites.edit(Staff, {
              VIEW_CHANNEL: false,
              READ_MESSAGE_HISTORY: false,
              SEND_MESSAGES: false,
            });
          }

          const Department2 = new Discord.MessageEmbed()
            .setDescription(
              `> Thank for reaching out to the **${supportbot.DepartmentTitle_2} Department**. Please provide us information regarding your query.`
            )
            .setColor(supportbot.EmbedColour);
          ticketChannel.send({ embeds: [Department2] });

          if (supportbot.AllowTicketMentions) {
            ticketChannel.send({ content: `@here` });
          }

          i.message.edit({ embeds: [TicketMessage], components: [row2] });
        }
        if (i.customId === "Department3") {
          ticketChannel.permissionOverwrites.edit(DeptRole3, {
            VIEW_CHANNEL: true,
            READ_MESSAGE_HISTORY: true,
            SEND_MESSAGES: true,
          });

          if (!supportbot.AllowStaff) {
            ticketChannel.permissionOverwrites.edit(Staff, {
              VIEW_CHANNEL: false,
              READ_MESSAGE_HISTORY: false,
              SEND_MESSAGES: false,
            });
          }

          const Department3 = new Discord.MessageEmbed()
            .setDescription(
              `> Thank for reaching out to the **${supportbot.DepartmentTitle_3} Department**. Please provide us information regarding your query.`
            )
            .setColor(supportbot.EmbedColour);
          ticketChannel.send({ embeds: [Department3] });

          if (supportbot.AllowTicketMentions) {
            ticketChannel.send({ content: `@here` });
          }
          i.message.edit({ embeds: [TicketMessage], components: [row2] });
        }
      });
    } else {
      ticketChannel.send({ embeds: [TicketMessage], components: [row2] });
    }
  },
});
