// SupportBot | Emerald Services
// Interaction Create Event

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Event = require("../Structures/Event.js");
const TicketNumberID = require("../Structures/TicketID.js");



module.exports = new Event("interactionCreate", async (client, interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.find(
      (cmd) => cmd.name.toLowerCase() === interaction.commandName
    );

    if (interaction.user.bot || !interaction.guild) return;

    const NotValid = new Discord.MessageEmbed()
      .setDescription(`:x: \`Invalid Command\` `)
      .setColor(supportbot.ErrorColour);

    if (!command)
      return interaction.reply({
        embeds: [NotValid],
      });

    const permission = interaction.member.permissions.has(command.permissions);

    const ValidPerms = new Discord.MessageEmbed()
      .setDescription(
        ":x: `Invalid Permissions` Do you have the correct permissions to execute this command?"
      )
      .setColor(supportbot.ErrorColour);

    if (!permission)
      return interaction.reply({
        embeds: [ValidPerms],
      });
    command.run(interaction);
  }
  if (interaction.isButton()) {
    if (
      interaction.customId === "openticket" ||
      interaction.customId.includes("department-")
    ) {
      try {
        const cmd = client.commands.get(cmdconfig.OpenTicket);
        if (!cmd) return;
        cmd.run(interaction);
      } catch (error) {
        console.error(error);
      }
    }

    if (interaction.customId === "ticketclose") {
      try {
        const cmd = client.commands.get(cmdconfig.CloseTicket);
        if (!cmd) return;
        cmd.run(interaction);
      } catch (error) {
        console.error(error);
      }
    }
    if (interaction.customId === "ticketlock") {
      if (interaction.channel.name.startsWith(supportbot.TicketPrefix)) {
        interaction.message.fetch();
        let Admin =
          interaction.guild.roles.cache.find(
            (AdminUser) => AdminUser.name === supportbot.Admin
          ) ||
          interaction.guild.roles.cache.find(
            (AdminUser) => AdminUser.id === supportbot.Admin
          );
        if (!interaction.member.roles.cache.has(Admin.id)) {
          return await interaction.reply({
            content: "You don't have permission to do that.",
            ephemeral: true,
          });
        }
        let all = interaction.channel.permissionOverwrites.cache;

        let parent =
          interaction.guild.channels.cache.find(
            (c) => c.name === supportbot.LockTicketCategory
          ) ||
          interaction.guild.channels.cache.find(
            (c) => c.id === supportbot.LockTicketCategory
          );
        if (parent) {
          await interaction.channel.setParent(parent.id);
        }

        all.forEach((perm) => {
          interaction.channel.permissionOverwrites.delete(perm.id);
        });
        await interaction.channel.permissionOverwrites.create(Admin.id, {
          VIEW_CHANNEL: true,
        });

        await interaction.channel.permissionOverwrites.create(
          interaction.guild.id,
          {
            VIEW_CHANNEL: false,
          }
        );

        const ticketDeleteButton = new Discord.MessageButton()
          .setCustomId("ticketclose")
          .setLabel("Close")
          .setStyle(supportbot.TicketDeleteColour)
          .setEmoji(supportbot.TicketDeleteEmoji);

          const ticketUnlockButton = new Discord.MessageButton()
          .setCustomId("ticketunlock")
          .setLabel("Unlock")
          .setStyle(supportbot.TicketUnlockColour)
          .setEmoji(supportbot.TicketUnlockEmoji);

        const row = new Discord.MessageActionRow().addComponents(
          ticketDeleteButton, ticketUnlockButton
        );
        const ArchiveEmbed = new Discord.MessageEmbed()
          .setTitle("Archived")
          .setDescription(`Archived ${interaction.channel.name}`)
          .setColor(supportbot.SuccessColour);

        interaction.reply({ embeds: [ArchiveEmbed] });
        interaction.message.edit({ components: [row] });
      }
    }
    if (interaction.customId === "ticketunlock") {
      if (interaction.channel.name.startsWith(supportbot.TicketPrefix)) {
        interaction.message.fetch();
        let Admin =
          interaction.guild.roles.cache.find(
            (AdminUser) => AdminUser.name === supportbot.Admin
          ) ||
          interaction.guild.roles.cache.find(
            (AdminUser) => AdminUser.id === supportbot.Admin
          );
        if (!interaction.member.roles.cache.has(Admin.id)) {
          return await interaction.reply({
            content: "You don't have permission to do that.",
            ephemeral: true,
          });
        }
        let all = interaction.channel.permissionOverwrites.cache;

        let parent =
          interaction.guild.channels.cache.find(
            (c) => c.name === supportbot.UnlockTicketCategory
          ) ||
          interaction.guild.channels.cache.find(
            (c) => c.id === supportbot.UnlockTicketCategory
          );
        if (parent) {
          await interaction.channel.setParent(parent.id);
        }

        all.forEach((perm) => {
          interaction.channel.permissionOverwrites.create(perm.id, {
            VIEW_CHANNEL: true,
          });
        });
        await interaction.channel.permissionOverwrites.create(Admin.id, {
          VIEW_CHANNEL: true,
        });

        await interaction.channel.permissionOverwrites.create(
          interaction.guild.id,
          {
            VIEW_CHANNEL: false,
          }
        );

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

        const TicketClaimButton = new Discord.MessageButton()
        .setCustomId("ticketclaim")
        .setLabel("Claim")
        .setStyle(supportbot.TicketClaimColour)
        .setEmoji(supportbot.TicketClaimEmoji);

        const row = new Discord.MessageActionRow().addComponents(
          CloseButton, LockButton, TicketClaimButton
        );
        const ArchiveEmbed = new Discord.MessageEmbed()
          .setTitle("Unarchived")
          .setDescription(`Unarchived ${interaction.channel.name}`)
          .setColor(supportbot.SuccessColour);

        interaction.reply({ embeds: [ArchiveEmbed] });
        interaction.message.edit({ components: [row] });
      }
    }
    if (interaction.customId === "ticketclaim") {
      if (interaction.channel.name.startsWith(supportbot.TicketPrefix)) {
        const Staff = await interaction.client.getRole(supportbot.Staff, interaction.guild);
        interaction.message.fetch();
        let User = interaction.guild.members.cache.get(interaction.user.id);
        let Admin =
          interaction.guild.roles.cache.find(
            (AdminUser) => AdminUser.name === supportbot.Admin
          ) ||
          interaction.guild.roles.cache.find(
            (AdminUser) => AdminUser.id === supportbot.Admin
          );
        if (!interaction.member.roles.cache.has(Admin.id)) {
          return await interaction.reply({
            content: "You don't have permission to do that.",
            ephemeral: true,
          });
        }
        let all = interaction.channel.permissionOverwrites.cache;

        const ticketUnclaimButton = new Discord.MessageButton()
        .setCustomId("ticketunclaim")
        .setLabel("Unclaim")
        .setStyle(supportbot.TicketUnclaimColour)
        .setEmoji(supportbot.TicketUnclaimEmoji);

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

        const row = new Discord.MessageActionRow().addComponents(
            CloseButton, LockButton, ticketUnclaimButton
        );
        const ArchiveEmbed = new Discord.MessageEmbed()
          .setTitle(supportbot.TicketClaimTitle)
          .setDescription(supportbot.TicketClaimMessage + " <@" + interaction.user.id + ">")
          .setColor(supportbot.EmbedColour);

        interaction.reply({ embeds: [ArchiveEmbed]});
        interaction.message.edit({ components: [row] });
        await interaction.channel.permissionOverwrites.edit(Staff.id, {
               VIEW_CHANNEL: true,
               SEND_MESSAGES: false,
           });   
      }
        await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
               VIEW_CHANNEL: true,
               SEND_MESSAGES: true,
           });   
      }
    }
    if (interaction.customId === "ticketunclaim") {
      if (interaction.channel.name.startsWith(supportbot.TicketPrefix)) {
        const Staff = await interaction.client.getRole(supportbot.Staff, interaction.guild);
        interaction.message.fetch();
        let User = interaction.guild.members.cache.get(interaction.user.id);
        let Admin =
          interaction.guild.roles.cache.find(
            (AdminUser) => AdminUser.name === supportbot.Admin
          ) ||
          interaction.guild.roles.cache.find(
            (AdminUser) => AdminUser.id === supportbot.Admin
          );
        if (!interaction.member.roles.cache.has(Admin.id)) {
          return await interaction.reply({
            content: "You don't have permission to do that.",
            ephemeral: true,
          });
        }
        let all = interaction.channel.permissionOverwrites.cache;

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

        const TicketClaimButton = new Discord.MessageButton()
        .setCustomId("ticketclaim")
        .setLabel("Claim")
        .setStyle(supportbot.TicketClaimColour)
        .setEmoji(supportbot.TicketClaimEmoji);

        const row = new Discord.MessageActionRow().addComponents(
           CloseButton, LockButton, TicketClaimButton
        );
        const ArchiveEmbed = new Discord.MessageEmbed()
          .setTitle(supportbot.TicketUnclaimTitle)
          .setDescription(supportbot.TicketUnclaimMessage + " <@" + interaction.user.id + ">")
          .setColor(supportbot.EmbedColour);

        interaction.reply({ embeds: [ArchiveEmbed]});
        interaction.message.edit({ components: [row] });
        await interaction.channel.permissionOverwrites.edit(Staff.id, {
               VIEW_CHANNEL: true,
               SEND_MESSAGES: true,
           });   
      }
        await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
               VIEW_CHANNEL: true,
               SEND_MESSAGES: true,
           });   
      }
    }
  );
