const fs = require("fs");
const yaml = require("js-yaml");
const {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  MessageFlags,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const TicketManager = require("../../Structures/TicketManager.js");
const Command = require("../../Structures/Command.js");
const db = require("../../Structures/Database.js");

function getDepartments() {
  return supportbot.Ticket?.DepartmentSystem?.Departments || {};
}

function getPriorities() {
  return supportbot.Ticket?.PrioritySystem?.Priorities || {};
}

function prioritiesEnabled() {
  return (
    supportbot.Ticket?.TicketType !== "threads" &&
    supportbot.Ticket?.PrioritySystem?.Enabled === true
  );
}

function departmentsEnabled() {
  return (
    supportbot.Ticket?.TicketType !== "threads" &&
    supportbot.Ticket?.DepartmentSystem?.Enabled === true
  );
}

function buildTicketChannelName(ticketNumberID, priorityKey, departmentConfig) {
  const defaultPrefix = supportbot.Ticket?.ChannelPrefix || supportbot.Ticket?.Channel || "ticket-";

  const departmentPrefix = departmentConfig?.ChannelPrefix || defaultPrefix;

  const safePrefix = String(departmentPrefix).trim() || "ticket-";
  const baseName = `${safePrefix}${ticketNumberID}`;

  if (!prioritiesEnabled() || !priorityKey) {
    return baseName;
  }

  return `${baseName}-${String(priorityKey).toLowerCase()}`;
}

module.exports = new Command({
  name: cmdconfig.TicketManage?.Command || "ticketmanage",
  description: cmdconfig.TicketManage?.Description || "Manage tickets",
  type: ApplicationCommandType.ChatInput,
  permissions: cmdconfig.TicketManage?.Permission || ["ManageChannels"],

  options: [
    {
      name: "transfer",
      description: "Transfer a ticket to another department",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "department",
          description: "Department to transfer this ticket to",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: Object.entries(getDepartments())
            .slice(0, 25)
            .map(([key, dept]) => ({
              name: dept.Name || key,
              value: key,
            })),
        },
        {
          name: "priority",
          description: "Optional new priority",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: Object.entries(getPriorities())
            .slice(0, 25)
            .map(([key, priority]) => ({
              name: priority.Name || key,
              value: key,
            })),
        },
      ],
    },
    {
      name: "priority",
      description: "Change a ticket priority",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "level",
          description: "New priority level",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: Object.entries(getPriorities())
            .slice(0, 25)
            .map(([key, priority]) => ({
              name: priority.Name || key,
              value: key,
            })),
        },
      ],
    },
    {
      name: cmdconfig.TicketManage?.ForceAdd?.Command || "forceadd",
      description:
        cmdconfig.TicketManage?.ForceAdd?.Description || "Force add a user to the current ticket",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "The user to add",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
      ],
    },
    {
      name: cmdconfig.TicketManage?.ForceRemove?.Command || "forceremove",
      description:
        cmdconfig.TicketManage?.ForceRemove?.Description || "Remove a user from the current ticket",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "The user to remove",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
      ],
    },
    {
      name: cmdconfig.TicketManage?.Rename?.Command || "rename",
      description: cmdconfig.TicketManage?.Rename?.Description || "Rename the current ticket",
      type: ApplicationCommandOptionType.Subcommand,
      options: [],
    },
    {
      name: cmdconfig.TicketManage?.Close?.Command || "close",
      description: cmdconfig.TicketManage?.Close?.Description || "Close the current ticket",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "reason",
          description: "Reason for closing the ticket",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
      ],
    },
  ],

  async run(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand(false);
      const ticket = db.getTicket(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({
          content: "This channel is not a ticket.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const { getRole } = interaction.client;

      let SupportStaff = await getRole(supportbot.Roles.StaffMember.Staff, interaction.guild);
      let Admin = await getRole(supportbot.Roles.StaffMember.Admin, interaction.guild);
      let Moderator = await getRole(supportbot.Roles.StaffMember.Moderator, interaction.guild);

      if (!SupportStaff || !Admin || !Moderator) {
        const missingRolesEmbed = new EmbedBuilder()
          .setDescription(msgconfig.Error.InvalidChannel || "Required roles are missing!")
          .setColor(supportbot.Embed.Colours.Warn);

        return interaction.reply({
          embeds: [missingRolesEmbed],
          flags: MessageFlags.Ephemeral,
        });
      }

      const NoPerms = new EmbedBuilder()
        .setDescription(
          msgconfig.Error.IncorrectPerms || "You do not have the correct permissions!",
        )
        .setColor(supportbot.Embed.Colours.Warn);

      if (
        !interaction.member.roles.cache.has(Admin.id) &&
        !interaction.member.roles.cache.has(Moderator.id) &&
        (!supportbot.Roles?.Mod?.AllowSupportStaff || !interaction.member.roles.cache.has(SupportStaff.id))
      ) {
        return interaction.reply({
          embeds: [NoPerms],
          flags: MessageFlags.Ephemeral,
        });
      }

      if (subcommand === "transfer") {
        if (!departmentsEnabled()) {
          return interaction.reply({
            content: "Departments are disabled, or ticket mode is set to threads.",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (interaction.channel.type !== ChannelType.GuildText) {
          return interaction.reply({
            content: "Ticket transfer only works for ticket channels.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const departmentKey = interaction.options.getString("department");
        const requestedPriority = interaction.options.getString("priority");

        const departments = getDepartments();
        const departmentConfig = departments[departmentKey];

        if (!departmentConfig) {
          return interaction.reply({
            content: "That department does not exist.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const targetCategoryId = departmentConfig.Category;
        const targetRoleId = departmentConfig.Role || null;

        if (!targetCategoryId) {
          return interaction.reply({
            content: "That department does not have a category configured.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const targetCategory = interaction.guild.channels.cache.get(targetCategoryId);
        if (!targetCategory) {
          return interaction.reply({
            content: "The target department category could not be found.",
            flags: MessageFlags.Ephemeral,
          });
        }

        let finalPriority = ticket.priority || null;

        if (requestedPriority) {
          finalPriority = requestedPriority;
        } else if (!finalPriority && departmentConfig.DefaultPriority) {
          finalPriority = departmentConfig.DefaultPriority;
        }

        const oldDepartmentKey = ticket.department || null;
        const oldDepartmentConfig = oldDepartmentKey ? departments[oldDepartmentKey] : null;
        const oldRoleId = oldDepartmentConfig?.Role || null;

        await interaction.channel.setParent(targetCategory.id);

        if (oldRoleId && oldRoleId !== targetRoleId) {
          await interaction.channel.permissionOverwrites.delete(oldRoleId).catch(() => { });
        }

        if (targetRoleId) {
          await interaction.channel.permissionOverwrites.create(targetRoleId, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });
        }

        if (typeof db.updateTicketDepartment === "function") {
          db.updateTicketDepartment(interaction.channel.id, departmentKey);
        }

        if (finalPriority && typeof db.updateTicketPriority === "function") {
          db.updateTicketPriority(interaction.channel.id, finalPriority);
        }

        const ticketNumber = ticket.number || interaction.channel.name.replace(/\D/g, "");

        const newChannelName = buildTicketChannelName(
          ticketNumber,
          finalPriority,
          departmentConfig,
        );

        if (interaction.channel.name !== newChannelName) {
          await interaction.channel.setName(newChannelName).catch(() => { });
        }

        const deptEmoji = departmentConfig.Emoji || "🎫";
        const deptName = departmentConfig.Name || departmentKey;

        let description = `> **Department:** ${deptEmoji} ${deptName}`;

        if (finalPriority && prioritiesEnabled()) {
          const priorityConfig = getPriorities()[finalPriority];
          const priorityEmoji = priorityConfig?.Emoji || "🟡";
          const priorityName = priorityConfig?.Name || finalPriority;
          description += `\n> **Priority:** ${priorityEmoji} ${priorityName}`;
        }

        description += `\n> **Transferred By:** <@${interaction.user.id}>`;

        const embed = new EmbedBuilder()
          .setTitle("Ticket Updated")
          .setDescription(description)
          .setColor(supportbot.Embed.Colours.Success);

        return interaction.reply({
          embeds: [embed],
        });
      }

      if (subcommand === "priority") {
        if (!prioritiesEnabled()) {
          return interaction.reply({
            content: "Priority is disabled, or ticket mode is set to threads.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const level = interaction.options.getString("level");
        const priorityConfig = getPriorities()[level];

        if (!priorityConfig) {
          return interaction.reply({
            content: "That priority does not exist.",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (typeof db.updateTicketPriority === "function") {
          db.updateTicketPriority(interaction.channel.id, level);
        }

        const departments = getDepartments();
        const departmentConfig = ticket.department ? departments[ticket.department] : null;
        const ticketNumber = ticket.number || interaction.channel.name.replace(/\D/g, "");

        const newChannelName = buildTicketChannelName(ticketNumber, level, departmentConfig);

        if (interaction.channel.name !== newChannelName) {
          await interaction.channel.setName(newChannelName).catch(() => { });
        }

        const priorityEmoji = priorityConfig.Emoji || "🟡";
        const priorityName = priorityConfig.Name || level;

        const embed = new EmbedBuilder()
          .setTitle("Ticket Updated")
          .setDescription(
            `> **Priority:** ${priorityEmoji} ${priorityName}\n> **Updated By:** <@${interaction.user.id}>`,
          )
          .setColor(supportbot.Embed.Colours.Success);

        return interaction.reply({
          embeds: [embed],
        });
      }

      if (subcommand === (cmdconfig.TicketManage?.ForceAdd?.Command || "forceadd")) {
        const userToAdd = interaction.options.getUser("user");
        const ticketChannel = interaction.channel;

        if (
          (supportbot.Ticket.TicketType === "threads" && !ticketChannel.isThread()) ||
          (supportbot.Ticket.TicketType === "channels" &&
            ticketChannel.type !== ChannelType.GuildText)
        ) {
          const onlyInTicket = new EmbedBuilder()
            .setTitle(msgconfig.ForceAddUser.NotInTicket_Title)
            .setDescription(msgconfig.ForceAddUser.NotInTicket_Description)
            .setColor(supportbot.Embed.Colours.Error);

          return interaction.reply({
            embeds: [onlyInTicket],
            flags: MessageFlags.Ephemeral,
          });
        }

        const ticketRow = db.getTicket(ticketChannel.id);
        if (!ticketRow) {
          const notFound = new EmbedBuilder()
            .setTitle(msgconfig.ForceAddUser.NotInTicket_Title)
            .setDescription(msgconfig.ForceAddUser.NotInTicket_Description)
            .setColor(supportbot.Embed.Colours.Error);

          return interaction.reply({
            embeds: [notFound],
            flags: MessageFlags.Ephemeral,
          });
        }

        try {
          if (supportbot.Ticket.TicketType === "threads") {
            const botMember = await ticketChannel.members
              .fetch(interaction.client.user.id)
              .catch(() => null);

            if (!botMember) await ticketChannel.join();

            await new Promise((res) => setTimeout(res, 1000));
            await ticketChannel.members.add(userToAdd.id);
          } else {
            await ticketChannel.permissionOverwrites.create(userToAdd.id, {
              ViewChannel: true,
              SendMessages: true,
              ReadMessageHistory: true,
            });
          }

          db.addUserToTicket(ticketChannel.id, userToAdd.id);

          const addedEmbed = new EmbedBuilder()
            .setTitle(msgconfig.ForceAddUser.Added_Title)
            .setDescription(
              msgconfig.ForceAddUser.Added_Description.replace("%username%", userToAdd.username),
            )
            .setColor(supportbot.Embed.Colours.Success);

          await interaction.reply({
            embeds: [addedEmbed],
            flags: MessageFlags.Ephemeral,
          });

          if (supportbot.Ticket?.UserManagement?.DMOnAdd !== false) {
            const addedToTicketEmbed = new EmbedBuilder()
              .setTitle(msgconfig.ForceAddUser.AddedToTicket_Title)
              .setDescription(
                msgconfig.ForceAddUser.AddedToTicket_Description.replace(
                  "%channel_link%",
                  `[${ticketChannel.name}](https://discord.com/channels/${ticketChannel.guild.id}/${ticketChannel.id})`,
                ),
              )
              .setColor(supportbot.Embed.Colours.General);

            await userToAdd.send({ embeds: [addedToTicketEmbed] }).catch(() => { });
          }
        } catch (err) {
          console.error("Error adding user to the ticket:", err);

          const errorEmbed = new EmbedBuilder()
            .setTitle(msgconfig.ForceAddUser.Error_Title)
            .setDescription(msgconfig.ForceAddUser.Error_Adding)
            .setColor(supportbot.Embed.Colours.Error);

          await interaction.reply({
            embeds: [errorEmbed],
            flags: MessageFlags.Ephemeral,
          });
        }

        return;
      }

      if (subcommand === (cmdconfig.TicketManage?.ForceRemove?.Command || "forceremove")) {
        const userToRemove = interaction.options.getUser("user");
        const ticketChannel = interaction.channel;

        if (
          (supportbot.Ticket.TicketType === "threads" && !ticketChannel.isThread()) ||
          (supportbot.Ticket.TicketType === "channels" &&
            ticketChannel.type !== ChannelType.GuildText)
        ) {
          const onlyInTicket = new EmbedBuilder()
            .setTitle(msgconfig.RemoveUser.NotInTicket_Title)
            .setDescription(msgconfig.RemoveUser.NotInTicket_Description)
            .setColor(supportbot.Embed.Colours.Error);

          return interaction.reply({
            embeds: [onlyInTicket],
            flags: MessageFlags.Ephemeral,
          });
        }

        try {
          if (supportbot.Ticket.TicketType === "threads") {
            await ticketChannel.members.remove(userToRemove.id);
          } else {
            await ticketChannel.permissionOverwrites.delete(userToRemove.id);
          }

          db.removeUserFromTicket(ticketChannel.id, userToRemove.id);

          const removedEmbed = new EmbedBuilder()
            .setTitle(msgconfig.RemoveUser.Removed_Title)
            .setDescription(msgconfig.RemoveUser.Removed_Message)
            .setColor(supportbot.Embed.Colours.Success);

          await interaction.reply({
            embeds: [removedEmbed],
            flags: MessageFlags.Ephemeral,
          });

          if (supportbot.Ticket?.UserManagement?.DMOnRemove !== false) {
            const removedFromTicketEmbed = new EmbedBuilder()
              .setTitle(msgconfig.RemoveUser.RemovedFromTicket_Title)
              .setDescription(
                msgconfig.RemoveUser.RemovedFromTicket_Description.replace(
                  "%channel_link%",
                  `[${ticketChannel.name}](https://discord.com/channels/${ticketChannel.guild.id}/${ticketChannel.id})`,
                ),
              )
              .setColor(supportbot.Embed.Colours.General);

            await userToRemove.send({ embeds: [removedFromTicketEmbed] }).catch(() => { });
          }
        } catch (err) {
          console.error("Error removing user from the ticket:", err);

          const errorEmbed = new EmbedBuilder()
            .setTitle(msgconfig.RemoveUser.Error_Title)
            .setDescription(msgconfig.RemoveUser.Error_Removing)
            .setColor(supportbot.Embed.Colours.Error);

          await interaction.reply({
            embeds: [errorEmbed],
            flags: MessageFlags.Ephemeral,
          });
        }

        return;
      }

      if (subcommand === (cmdconfig.TicketManage?.Rename?.Command || "rename")) {
        const modal = new ModalBuilder()
          .setCustomId("renameTicketModal")
          .setTitle("Rename Channel")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("renameTicket")
                .setLabel("New Channel Name")
                .setStyle(TextInputStyle.Short)
                .setRequired(true),
            ),
          );

        return interaction.showModal(modal);
      }

      if (subcommand === (cmdconfig.TicketManage?.Close?.Command || "close")) {
        const reason = interaction.options.getString("reason") || "Closed by staff.";

        if (supportbot.Ticket.Close.StaffOnly) {
          let CloseSupportStaff = await getRole(
            supportbot.Roles.StaffMember.Staff,
            interaction.guild,
          );
          let CloseAdmin = await getRole(supportbot.Roles.StaffMember.Admin, interaction.guild);

          if (!CloseSupportStaff || !CloseAdmin) {
            return interaction.reply({
              content:
                "Some roles seem to be missing! Please check for errors when starting the bot.",
              flags: MessageFlags.Ephemeral,
            });
          }

          const noClosePerms = new EmbedBuilder()
            .setTitle("Invalid Permissions!")
            .setDescription(
              `${msgconfig.Error.IncorrectPerms}\n\nRole Required: \`${supportbot.Roles.StaffMember.Staff}\` or \`${supportbot.Roles.StaffMember.Admin}\``,
            )
            .setColor(supportbot.Embed.Colours.Warn);

          if (
            !interaction.member.roles.cache.has(CloseSupportStaff.id) &&
            !interaction.member.roles.cache.has(CloseAdmin.id)
          ) {
            return interaction.reply({
              embeds: [noClosePerms],
              flags: MessageFlags.Ephemeral,
            });
          }
        }

        const isThread = interaction.channel.type === ChannelType.PrivateThread;

        if (
          (supportbot.Ticket.TicketType === "threads" && !isThread) ||
          (supportbot.Ticket.TicketType === "channels" &&
            interaction.channel.type !== ChannelType.GuildText)
        ) {
          const notTicketChannel = new EmbedBuilder()
            .setTitle("Invalid Channel!")
            .setDescription(
              `This command can only be used in a ${supportbot.Ticket.TicketType === "threads" ? "ticket thread" : "ticket channel"}.`,
            )
            .setColor(supportbot.Embed.Colours.Warn);

          return interaction.reply({
            embeds: [notTicketChannel],
            flags: MessageFlags.Ephemeral,
          });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const ticketData = db.getTicket(interaction.channel.id);

        if (!ticketData) {
          const exists = new EmbedBuilder()
            .setTitle("No Ticket Found!")
            .setDescription(msgconfig.Error.NoValidTicket)
            .setColor(supportbot.Embed.Colours.Warn);

          return interaction.followUp({
            embeds: [exists],
            flags: MessageFlags.Ephemeral,
          });
        }

        try {
          await TicketManager.createTranscript(interaction, ticketData, reason);

          await interaction.followUp({
            content: "Ticket closed successfully.",
            flags: MessageFlags.Ephemeral,
          });

          await interaction.channel.delete().catch(() => { });
        } catch (err) {
          console.error("Error closing ticket:", err);

          await interaction.followUp({
            content: "An error occurred while closing the ticket.",
            flags: MessageFlags.Ephemeral,
          });
        }

        return;
      }

      return interaction.reply({
        content: "Unknown ticket management action.",
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Error in ticket manage command:", error);

      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({
          content: "An error occurred while managing the ticket.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
});
