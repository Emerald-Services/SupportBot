// SupportBot | Emerald Services
// Interaction Create Event

const fs = require("fs");

const Discord = require("discord.js");
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

const Event = require("../Structures/Event.js");

module.exports = new Event("interactionCreate", async (client, interaction) => {
  if (interaction.type == Discord.InteractionType.ApplicationCommand) {
    const command = client.commands.find(
      (cmd) => cmd.name.toLowerCase() === interaction.commandName
    );

    if (interaction.user.bot || !interaction.guild) return;

    const NotValid = new Discord.EmbedBuilder()
      .setDescription(`:x: \`Invalid Command\` `)
      .setColor(supportbot.Embed.Colours.Error);

    if (!command)
      return interaction.reply({
        embeds: [NotValid],
      });

    const permission = interaction.member.permissions.has(command.permissions);

    const ValidPerms = new Discord.EmbedBuilder()
      .setDescription(
        "> :x: `Invalid Permissions` Do you have the correct permissions to execute this command?"
      )
      .setColor(supportbot.Embed.Colours.Error);

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
        const cmd = client.commands.get(cmdconfig.OpenTicket.Command);
        if (!cmd) return;
        cmd.run(interaction);
      } catch (error) {
        console.error(error);
      }
    }

    if (interaction.customId === "ticketclose") {
      try {
        const cmd = client.commands.get(cmdconfig.CloseTicket.Command);
        if (!cmd) return;
        cmd.run(interaction);
      } catch (error) {
        console.error(error);
      }
    }
    if (interaction.customId === "ticketlock") {
      if (interaction.channel.name.startsWith(supportbot.Ticket.Channel)) {
        interaction.message.fetch();
        let Admin =
          interaction.guild.roles.cache.find(
            (AdminUser) => AdminUser.name === supportbot.Roles.StaffMember.Admin
          ) ||
          interaction.guild.roles.cache.find(
            (AdminUser) => AdminUser.id === supportbot.Roles.StaffMember.Admin
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
            (c) => c.name === supportbot.Ticket.LockTicketCategory
          ) ||
          interaction.guild.channels.cache.find(
            (c) => c.id === supportbot.Ticket.LockTicketCategory
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

        const ticketDeleteButton = new Discord.ButtonBuilder()
          .setCustomId("ticketclose")
          .setLabel("Close")
          .setStyle(supportbot.Buttons.Tickets.DeleteStyle)
          .setEmoji(supportbot.Buttons.Tickets.DeleteEmoji);

        const row = new Discord.ActionRowBuilder().addComponents(
          ticketDeleteButton
        );
        const ArchiveEmbed = new Discord.EmbedBuilder()
          .setTitle("Archived")
          .setDescription(`Archived ${interaction.channel.name}`)
          .setColor(supportbot.Embed.Colours.Success);

        interaction.reply({ embeds: [ArchiveEmbed] });
        interaction.message.edit({ components: [row] });
      }
    }
  }
});
