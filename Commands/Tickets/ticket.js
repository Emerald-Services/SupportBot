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
  SeparatorBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
} = require("discord.js");
const yaml = require("js-yaml");

const db = require("../../Structures/Database.js");

const panelconfig = yaml.load(
  fs.readFileSync("./Configs/ticket-panel.yml", "utf8"),
);
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8"),
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

const Command = require("../../Structures/Command.js");
const TicketNumberID = require("../../Structures/TicketID.js");

async function isBlacklisted(userId) {
  let blacklistData;
  try {
    blacklistData = JSON.parse(
      fs.readFileSync("./Data/BlacklistedUsers.json", "utf8"),
    );
  } catch (error) {
    console.error("Error reading BlacklistedUsers.json:", error);
    return false;
  }

  if (!blacklistData || !Array.isArray(blacklistData.blacklistedUsers)) {
    console.error("blacklistedUsers is not defined or is not an array");
    return false;
  }

  return blacklistData.blacklistedUsers.includes(userId);
}

async function getClockedInUsers(guild) {
  const clockedInUsers = new Set();

  if (typeof db.getProfile !== "function") {
    console.error(
      "db.getProfile is not a function. Check Structures/Database.js",
    );
    return clockedInUsers;
  }

  const rows = guild.members.cache.map((m) => m.id);

  for (const id of rows) {
    try {
      const profile = db.getProfile(id);
      if (profile && profile.clockedIn) {
        clockedInUsers.add(id);
      }
    } catch (error) {
      console.error(`Error getting profile for ${id}:`, error);
    }
  }

  return clockedInUsers;
}

function getDepartmentSystem() {
  return supportbot.Ticket?.DepartmentSystem || {};
}

function getPrioritySystem() {
  return supportbot.Ticket?.PrioritySystem || {};
}

function getAIModeConfig() {
  return supportbot.Ticket?.AIMode || {};
}

function isAIModeEnabledGlobally() {
  return getAIModeConfig().Enabled === true;
}

function areDepartmentsEnabled() {
  return (
    supportbot.Ticket?.TicketType !== "threads" &&
    supportbot.Ticket?.DepartmentSystem?.Enabled === true
  );
}

function arePrioritiesEnabled() {
  return (
    supportbot.Ticket?.TicketType !== "threads" &&
    supportbot.Ticket?.PrioritySystem?.Enabled === true
  );
}

function getSelectedDepartmentKey(interaction) {
  const departmentSystem = getDepartmentSystem();
  const departmentsEnabled = areDepartmentsEnabled();
  const departments = departmentSystem.Departments || {};

  if (!departmentsEnabled) {
    return departmentSystem.DefaultDepartment || "general";
  }

  const selectedDepartment =
    interaction.options?.getString?.("department") ||
    interaction.department ||
    departmentSystem.DefaultDepartment ||
    "general";

  if (departments[selectedDepartment]) {
    return selectedDepartment;
  }

  const firstDepartmentKey = Object.keys(departments)[0];
  return firstDepartmentKey || departmentSystem.DefaultDepartment || "general";
}

function getDepartmentConfig(departmentKey) {
  if (!departmentKey) return null;
  return getDepartmentSystem().Departments?.[departmentKey] || null;
}

function getPriorityKey(interaction, departmentKey) {
  if (!arePrioritiesEnabled()) {
    return null;
  }

  const prioritySystem = getPrioritySystem();
  const departmentConfig = getDepartmentConfig(departmentKey);

  return (
    interaction.options?.getString?.("priority") ||
    interaction.priority ||
    departmentConfig?.DefaultPriority ||
    prioritySystem.DefaultPriority ||
    "medium"
  );
}

function getPriorityConfig(priorityKey) {
  if (!priorityKey) return null;
  return getPrioritySystem().Priorities?.[priorityKey] || null;
}

function buildTicketChannelName(ticketNumberID, priorityKey, departmentConfig) {
  const defaultPrefix =
    supportbot.Ticket?.ChannelPrefix || supportbot.Ticket?.Channel || "ticket-";

  const departmentPrefix = departmentConfig?.ChannelPrefix || defaultPrefix;
  const safePrefix = String(departmentPrefix).trim() || "ticket-";
  const baseName = `${safePrefix}${ticketNumberID}`;

  if (!arePrioritiesEnabled() || !priorityKey) {
    return baseName;
  }

  return `${baseName}-${String(priorityKey).toLowerCase()}`;
}

function buildAIModeButtons(ticketId, aiEnabled = false) {
  const enableButton = new ButtonBuilder()
    .setCustomId(`ticket_ai_enable:${ticketId}`)
    .setLabel(msgconfig.Ticket.AIMode.EnableButton)
    .setStyle(ButtonStyle.Success)
    .setDisabled(aiEnabled);

  const disableButton = new ButtonBuilder()
    .setCustomId(`ticket_ai_disable:${ticketId}`)
    .setLabel(msgconfig.Ticket.AIMode.DisableButton)
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(!aiEnabled);

  return new ActionRowBuilder().addComponents(enableButton, disableButton);
}

async function createAITicketThread(parentTicketChannel, interaction) {
  const threadName = supportbot.Ticket.AIMode?.ThreadName || "ai-chat";

  const aiThread = await parentTicketChannel.threads.create({
    name: threadName,
    autoArchiveDuration: 60,
    reason: "ticket ai mode thread",
  });

  const welcomeEmbed = new EmbedBuilder()
    .setTitle(msgconfig.Ticket.AIMode.ThreadWelcomeTitle)
    .setDescription(msgconfig.Ticket.AIMode.ThreadWelcomeMessage)
    .setColor(supportbot.Embed.Colours.General);

  await aiThread.send({ embeds: [welcomeEmbed] });

  if (typeof db.setTicketAIState === "function") {
    db.setTicketAIState(parentTicketChannel.id, {
      enabled: true,
      aiChannelId: aiThread.id,
      aiType: "thread",
      enabledBy: interaction.user.id,
      enabledAt: new Date().toISOString(),
    });
  }

  return aiThread;
}

async function askTicketQuestions(ticketChannel, interaction, questions) {
  return new Promise(async (resolve) => {
    const answers = [];
    let questionIndex = 0;

    const sendNextQuestion = async () => {
      if (questionIndex < questions.length) {
        const questionsEmbed = new EmbedBuilder()
          .setDescription(
            `**${questionIndex + 1}.** ${questions[questionIndex]}`,
          )
          .setColor(supportbot.Embed.Colours.General);

        const questionMessage = await ticketChannel.send({
          embeds: [questionsEmbed],
        });

        const collector = new MessageCollector(ticketChannel, {
          filter: (m) => m.author.id === interaction.user.id,
          max: 1,
          time: 60000,
        });

        collector.on("collect", async (message) => {
          answers.push({
            question: questions[questionIndex],
            answer: message.content,
          });

          questionIndex++;

          await message.delete().catch(() => {});
          await questionMessage.delete().catch(() => {});

          sendNextQuestion();
        });
      } else {
        const summaryEmbed = new EmbedBuilder()
          .setTitle(msgconfig.Ticket.TicketQuestions.Details.Title)
          .setDescription(
            msgconfig.Ticket.TicketQuestions.Details.Description.replace(
              "%user%",
              interaction.user.id,
            ),
          )
          .setColor(supportbot.Embed.Colours.General)
          .addFields(
            answers.map((a) => ({
              name: `Q: ${a.question}`,
              value: `A: ${a.answer}`,
              inline: false,
            })),
          )
          .setTimestamp();

        await ticketChannel.send({ embeds: [summaryEmbed] });

        resolve(answers);
      }
    };

    sendNextQuestion();
  });
}

async function assignTicketToUser(
  ticketChannel,
  Staff,
  Admin,
  interaction,
  departmentRole = null,
  attempts = 0,
) {
  try {
    const clockedInUsers = await getClockedInUsers(interaction.guild);

    let eligibleClockedInUsers = Array.from(clockedInUsers);

    if (departmentRole) {
      eligibleClockedInUsers = eligibleClockedInUsers.filter((userId) => {
        const member = interaction.guild.members.cache.get(userId);
        return member?.roles?.cache?.has(departmentRole.id);
      });
    }

    const claimChannel = interaction.guild.channels.cache.get(
      supportbot.Ticket.ClaimTickets.Channel,
    );

    if (!claimChannel) {
      console.error("Claim channel not found");
      return null;
    }

    const claimPing = departmentRole
      ? `<@&${departmentRole.id}> <@&${Admin.id}>`
      : `<@&${Staff.id}> <@&${Admin.id}>`;

    const claimEmbed = new EmbedBuilder()
      .setTitle(msgconfig.Ticket.ClaimTickets.ClaimTitle)
      .setDescription(
        msgconfig.Ticket.ClaimTickets.ClaimMessage.replace(
          "%user%",
          interaction.user.id,
        ),
      )
      .setColor(supportbot.Embed.Colours.General);

    const claimButton = new ButtonBuilder()
      .setCustomId(`claimticket-${ticketChannel.id}`)
      .setLabel(supportbot.Ticket.ClaimTickets.ButtonTitle || "Claim Ticket")
      .setEmoji(supportbot.Ticket.ClaimTickets.ButtonEmoji || null)
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(claimButton);

    if (eligibleClockedInUsers.length === 0 || attempts >= 2) {
      const claimMessage = await claimChannel.send({
        content: claimPing,
        embeds: [claimEmbed],
        components: [row],
      });

      const filter = (i) => {
        if (i.customId !== `claimticket-${ticketChannel.id}`) return false;

        const hasAdmin = i.member.roles.cache.has(Admin.id);
        const hasStaff = i.member.roles.cache.has(Staff.id);
        const hasDepartmentRole = departmentRole
          ? i.member.roles.cache.has(departmentRole.id)
          : false;

        return hasAdmin || hasStaff || hasDepartmentRole;
      };

      const collector = claimMessage.createMessageComponentCollector({
        filter,
        time: 120000,
      });

      collector.on("collect", async (i) => {
        await i.deferUpdate().catch(() => {});

        if (supportbot.Ticket.TicketType === "threads") {
          await ticketChannel.members.add(i.user.id).catch(() => {});
        }

        await ticketChannel.send({
          content: `<@${i.user.id}> has claimed the ticket.`,
        });

        if (typeof db.claimTicket === "function") {
          db.claimTicket(ticketChannel.id, i.user.id);
        }

        await claimMessage.edit({ components: [] }).catch(() => {});
      });

      collector.on("end", async (collected) => {
        if (collected.size === 0) {
          await claimMessage.delete().catch(() => {});
          await claimChannel.send({
            content: `Ticket is still unclaimed.\nCC: ${claimPing}`,
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `Ticket is still unclaimed: <#${ticketChannel.id}>`,
                )
                .setColor(supportbot.Embed.Colours.Warn),
            ],
          });
        }
      });

      return null;
    }

    const assignedUserId =
      eligibleClockedInUsers[
        Math.floor(Math.random() * eligibleClockedInUsers.length)
      ];

    const assignedUser = await interaction.guild.members
      .fetch(assignedUserId)
      .catch(() => null);

    if (!assignedUser) {
      return null;
    }

    const claimMessage = await claimChannel.send({
      content: `${assignedUser}`,
      embeds: [claimEmbed],
      components: [row],
    });

    const filter = (i) => {
      if (i.customId !== `claimticket-${ticketChannel.id}`) return false;
      return i.user.id === assignedUserId;
    };

    const collector = claimMessage.createMessageComponentCollector({
      filter,
      time: 120000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate().catch(() => {});

      if (supportbot.Ticket.TicketType === "threads") {
        await ticketChannel.members.add(i.user.id).catch(() => {});
      }

      await ticketChannel
        .send({
          content: `<@${assignedUserId}> has claimed the ticket.`,
        })
        .catch(() => {});

      if (typeof db.claimTicket === "function") {
        db.claimTicket(ticketChannel.id, assignedUserId);
      }

      await claimMessage.edit({ components: [] }).catch(() => {});
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        await claimMessage.delete().catch(() => {});

        if (attempts >= 1) {
          await claimChannel.send({
            content: `No one claimed the ticket. Tagging roles: ${claimPing}`,
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `Ticket is still unclaimed: <#${ticketChannel.id}>`,
                )
                .setColor(supportbot.Embed.Colours.Warn),
            ],
          });

          const retryClaimMessage = await claimChannel.send({
            content: claimPing,
            embeds: [claimEmbed],
            components: [row],
          });

          const retryFilter = (i) => {
            if (i.customId !== `claimticket-${ticketChannel.id}`) return false;

            const hasAdmin = i.member.roles.cache.has(Admin.id);
            const hasStaff = i.member.roles.cache.has(Staff.id);
            const hasDepartmentRole = departmentRole
              ? i.member.roles.cache.has(departmentRole.id)
              : false;

            return hasAdmin || hasStaff || hasDepartmentRole;
          };

          const retryCollector =
            retryClaimMessage.createMessageComponentCollector({
              filter: retryFilter,
              time: 120000,
            });

          retryCollector.on("collect", async (i) => {
            await i.deferUpdate().catch(() => {});

            if (supportbot.Ticket.TicketType === "threads") {
              await ticketChannel.members.add(i.user.id).catch(() => {});
            }

            await ticketChannel.send({
              content: `<@${i.user.id}> has claimed the ticket.`,
            });

            if (typeof db.claimTicket === "function") {
              db.claimTicket(ticketChannel.id, i.user.id);
            }

            await retryClaimMessage.edit({ components: [] }).catch(() => {});
          });

          retryCollector.on("end", async (retryCollected) => {
            if (retryCollected.size === 0) {
              await retryClaimMessage.delete().catch(() => {});
              await claimChannel.send({
                content: `No one claimed the ticket. Tagging roles: ${claimPing}`,
              });
            }
          });
        } else {
          const ReassigningEmbed = new EmbedBuilder()
            .setTitle(msgconfig.Ticket.ClaimTickets.ReassigningTitle)
            .setDescription(
              msgconfig.Ticket.ClaimTickets.ReassigningMessage.replace(
                "%user%",
                assignedUserId,
              ),
            )
            .setColor(supportbot.Embed.Colours.General);

          await claimChannel.send({
            embeds: [ReassigningEmbed],
            components: [],
          });

          await assignTicketToUser(
            ticketChannel,
            Staff,
            Admin,
            interaction,
            departmentRole,
            attempts + 1,
          );
        }
      }
    });

    return assignedUserId;
  } catch (error) {
    console.error("Error in assignTicketToUser function:", error);
    return null;
  }
}

module.exports = new Command({
  name: cmdconfig.OpenTicket.Command,
  description: cmdconfig.OpenTicket.Description,
  type: ApplicationCommandType.ChatInput,

  options: [
    ...(areDepartmentsEnabled()
      ? [
          {
            name: "department",
            description: "Choose a department",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: Object.entries(getDepartmentSystem().Departments || {})
              .slice(0, 25)
              .map(([key, dept]) => ({
                name: dept.Name || key,
                value: key,
              })),
          },
        ]
      : []),

    ...(arePrioritiesEnabled()
      ? [
          {
            name: "priority",
            description: "Choose a priority",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: Object.entries(getPrioritySystem().Priorities || {})
              .slice(0, 25)
              .map(([key, priority]) => ({
                name: priority.Name || key,
                value: key,
              })),
          },
        ]
      : []),

    {
      name: "reason",
      description: "Ticket Reason",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  permissions: cmdconfig.OpenTicket.Permission,

  async run(interaction) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});
      }

      if (await isBlacklisted(interaction.user.id)) {
        return interaction.editReply({
          content: msgconfig.Ticket.Blacklisted,
          flags: MessageFlags.Ephemeral,
        });
      }

      let TicketReason = null;
      if (supportbot.Ticket.TicketReason) {
        TicketReason =
          interaction.options?.getString?.("reason") ||
          interaction.reason ||
          null;
      }

      let TicketData = { tickets: db.getAllTickets() };

      const { getRole, getChannel } = interaction.client;

      if (
        supportbot.Ticket.TicketsPerUser &&
        TicketData.tickets.filter(
          (t) => t.user === interaction.user.id && t.open,
        ).length >= supportbot.Ticket.TicketsPerUser
      ) {
        return interaction.editReply({
          embeds: [
            {
              title: "Too Many Tickets!",
              description: `You can't have more than ${supportbot.Ticket.TicketsPerUser} open tickets!`,
              color: supportbot.Embed.Colours.Warn,
            },
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      const usingThreads = supportbot.Ticket.TicketType === "threads";
      const departmentsEnabled = areDepartmentsEnabled();
      const prioritiesEnabled = arePrioritiesEnabled();
      const aiModeEnabled = isAIModeEnabledGlobally();

      const departmentKey = departmentsEnabled
        ? getSelectedDepartmentKey(interaction)
        : null;
      const departmentConfig = departmentsEnabled
        ? getDepartmentConfig(departmentKey)
        : null;

      const priorityKey = prioritiesEnabled
        ? getPriorityKey(interaction, departmentKey)
        : null;
      const priorityConfig = prioritiesEnabled
        ? getPriorityConfig(priorityKey)
        : null;

      let ticketNumberID = await TicketNumberID.pad();
      const TicketSubject = TicketReason || msgconfig.Ticket.InvalidSubject;
      const ticketChannelName = buildTicketChannelName(
        ticketNumberID,
        priorityKey,
        departmentConfig,
      );

      const TicketExists = new EmbedBuilder()
        .setTitle("Ticket Exists!")
        .setDescription(msgconfig.Ticket.TicketExists);

      if (
        await interaction.guild.channels.cache.find(
          (ticketChannel) => ticketChannel.name === ticketChannelName,
        )
      ) {
        return await interaction.editReply({
          embeds: [TicketExists],
          flags: MessageFlags.Ephemeral,
        });
      }

      const Staff = await getRole(
        supportbot.Roles.StaffMember.Staff,
        interaction.guild,
      );
      const Admin = await getRole(
        supportbot.Roles.StaffMember.Admin,
        interaction.guild,
      );

      const departmentRoleId = departmentsEnabled
        ? departmentConfig?.Role || null
        : null;
      const DepartmentRole = departmentRoleId
        ? await getRole(departmentRoleId, interaction.guild)
        : null;

      if (!Staff || !Admin) {
        return interaction.editReply({
          content:
            "Some roles seem to be missing!\nPlease check for errors when starting the bot.",
          flags: MessageFlags.Ephemeral,
        });
      }

      let ticketChannel;

      if (usingThreads) {
        const TicketHome = interaction.guild.channels.cache.find(
          (c) =>
            c.name === supportbot.Ticket.TicketHome ||
            c.id === supportbot.Ticket.TicketHome,
        );

        const channel = await getChannel(
          supportbot.Ticket.TicketHome,
          interaction.guild,
        );

        ticketChannel = await channel.threads.create({
          name: ticketChannelName,
          type: ChannelType.PrivateThread,
          parent: TicketHome,
          autoArchiveDuration: 60,
          reason: "support ticket",
        });
      } else {
        let targetCategoryId = supportbot.Ticket.TicketChannelsCategory;

        if (departmentsEnabled && departmentConfig?.Category) {
          targetCategoryId = departmentConfig.Category;
        }

        const category = interaction.guild.channels.cache.find(
          (c) => c.name === targetCategoryId || c.id === targetCategoryId,
        );

        if (!category) {
          return interaction.editReply({
            content: "The ticket category does not exist!",
            flags: MessageFlags.Ephemeral,
          });
        }

        ticketChannel = await interaction.guild.channels.create({
          name: ticketChannelName,
          type: ChannelType.GuildText,
          parent: category.id,
          reason: "support ticket",
        });

        if (
          !departmentsEnabled &&
          category.children.cache &&
          category.children.cache.size >= 50
        ) {
          const secondaryCategory = interaction.guild.channels.cache.find(
            (c) =>
              c.name === supportbot.Ticket.TicketChannelsCategory2 ||
              c.id === supportbot.Ticket.TicketChannelsCategory2,
          );

          if (secondaryCategory) {
            await ticketChannel.setParent(secondaryCategory.id);
          } else {
            return interaction.editReply({
              content: "The secondary ticket category does not exist!",
              flags: MessageFlags.Ephemeral,
            });
          }
        }
      }

      if (supportbot.Ticket.ClaimTickets.Enabled) {
        await assignTicketToUser(
          ticketChannel,
          Staff,
          Admin,
          interaction,
          DepartmentRole || null,
        );
      }

      if (usingThreads) {
        await ticketChannel.members.add(interaction.user.id);
      } else {
        await ticketChannel.permissionOverwrites.create(interaction.user.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });

        await ticketChannel.permissionOverwrites.create(Admin.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });

        await ticketChannel.permissionOverwrites.create(Staff.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });

        if (DepartmentRole) {
          await ticketChannel.permissionOverwrites.create(DepartmentRole.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });
        }

        await ticketChannel.permissionOverwrites.create(
          interaction.guild.roles.everyone.id,
          {
            ViewChannel: false,
          },
        );
      }

      db.addTicket({
        id: ticketChannel.id,
        name: ticketChannel.name,
        user: interaction.user.id,
        number: ticketNumberID,
        reason: TicketSubject,
        open: true,
        subUsers: [],
        createdAt: new Date().toISOString(),
        claimedAt: null,
        department: departmentKey,
        priority: priorityKey,
        aiModeEnabled: !usingThreads && aiModeEnabled,
        aiChannelId: null,
        questionAnswers: [],
      });

      TicketData.tickets = db.getAllTickets();

      const CreatedTicket = new EmbedBuilder()
        .setDescription(
          msgconfig.Ticket.TicketCreatedAlert.replace(
            /%ticketauthor%/g,
            interaction.user.id,
          )
            .replace(/%ticketid%/g, ticketChannel.id)
            .replace(/%ticketusername%/g, interaction.user.username)
            .replace(/%ticketreason%/g, TicketSubject),
        )
        .setColor(supportbot.Embed.Colours.General);

      await interaction.editReply({
        embeds: [CreatedTicket],
        flags: MessageFlags.Ephemeral,
      });

      const ticketMsgContainer = new ContainerBuilder();

      if (supportbot.Embed.Colours.General) {
        ticketMsgContainer.setAccentColor(
          parseInt(supportbot.Embed.Colours.General.replace("#", ""), 16),
        );
      }

      const ticketAuthor = new TextDisplayBuilder().setContent(
        msgconfig.Ticket.TicketAuthorTitle.replace(
          /%ticketauthor%/g,
          interaction.user.id,
        )
          .replace(/%ticketid%/g, ticketChannel.id)
          .replace(/%ticketusername%/g, interaction.user.username),
      );

      ticketMsgContainer.addTextDisplayComponents(ticketAuthor);

      const ticketTitle = new TextDisplayBuilder().setContent(
        msgconfig.Ticket.TicketTitle.replace(
          /%ticketauthor%/g,
          interaction.user.id,
        )
          .replace(/%ticketid%/g, ticketChannel.id)
          .replace(/%ticketusername%/g, interaction.user.username),
      );

      ticketMsgContainer.addTextDisplayComponents(ticketTitle);

      const seperator2 = new SeparatorBuilder().setDivider(true);
      ticketMsgContainer.addSeparatorComponents(seperator2);

      const ticketDescription = new TextDisplayBuilder().setContent(
        msgconfig.Ticket.TicketMessage.replace(
          /%ticketauthor%/g,
          interaction.user.id,
        )
          .replace(/%ticketid%/g, ticketChannel.id)
          .replace(/%ticketusername%/g, interaction.user.username)
          .replace(/%ticketreason%/g, TicketSubject),
      );

      ticketMsgContainer.addTextDisplayComponents(ticketDescription);

      const seperator3 = new SeparatorBuilder().setDivider(true);
      ticketMsgContainer.addSeparatorComponents(seperator3);

      if (supportbot.Ticket.TicketReason && TicketReason) {
        const ticketReason = new TextDisplayBuilder().setContent(
          `**Reason:**\n${TicketReason}`,
        );
        ticketMsgContainer.addTextDisplayComponents(ticketReason);
      }

      if (departmentsEnabled && departmentConfig) {
        const deptLabel = departmentConfig?.Name || departmentKey || "General";
        const deptEmoji = departmentConfig?.Emoji || "🎫";

        const departmentText = new TextDisplayBuilder().setContent(
          `**Department:** ${deptEmoji} ${deptLabel}`,
        );

        ticketMsgContainer.addTextDisplayComponents(departmentText);
      }

      if (prioritiesEnabled && priorityConfig && priorityKey) {
        const priorityLabel = priorityConfig?.Name || priorityKey || "Medium";
        const priorityEmoji = priorityConfig?.Emoji || "🟡";

        const priorityText = new TextDisplayBuilder().setContent(
          `**Priority:** ${priorityEmoji} ${priorityLabel}`,
        );

        ticketMsgContainer.addTextDisplayComponents(priorityText);
      }

      if (usingThreads && aiModeEnabled) {
        const aiSeparator = new SeparatorBuilder().setDivider(true);
        ticketMsgContainer.addSeparatorComponents(aiSeparator);

        const aiTitleText = new TextDisplayBuilder().setContent(
          `**${msgconfig.Ticket.AIMode.Title}**`,
        );
        ticketMsgContainer.addTextDisplayComponents(aiTitleText);

        const aiBodyText = new TextDisplayBuilder().setContent(
          msgconfig.Ticket.AIMode.Description,
        );
        ticketMsgContainer.addTextDisplayComponents(aiBodyText);

        const aiRow = buildAIModeButtons(ticketChannel.id, false);
        ticketMsgContainer.addActionRowComponents(aiRow);
      }

      const selectMenuRow = new ActionRowBuilder();

      const SelectMenus = new StringSelectMenuBuilder()
        .setCustomId("ticketcontrolpanel")
        .setPlaceholder("Ticket Control Panel")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Close")
            .setDescription("Close the ticket.")
            .setEmoji(supportbot.SelectMenus.Tickets.CloseEmoji)
            .setValue("ticketclose"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Voice Channel")
            .setDescription("Create a support voice channel.")
            .setEmoji(supportbot.SelectMenus.Tickets.VCEmoji)
            .setValue("supportvc"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Archive")
            .setDescription("Archive the ticket.")
            .setEmoji(supportbot.SelectMenus.Tickets.ArchiveEmoji)
            .setValue("archiveticket"),
          ...(supportbot.Ticket.TicketType === "threads"
            ? [
                new StringSelectMenuOptionBuilder()
                  .setLabel("Lock Ticket")
                  .setDescription("Lock the ticket.")
                  .setEmoji(supportbot.SelectMenus.Tickets.LockEmoji)
                  .setValue("lockticket"),
              ]
            : []),
          new StringSelectMenuOptionBuilder()
            .setLabel("Rename Ticket")
            .setDescription("Rename the ticket.")
            .setEmoji(supportbot.SelectMenus.Tickets.RenameEmoji)
            .setValue("renameticket"),
        );

      if (supportbot.Ticket.TicketType === "threads") {
        SelectMenus.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Enable Invites")
            .setDescription("Enable invites.")
            .setEmoji(supportbot.SelectMenus.Tickets.EnableInvitesEmoji)
            .setValue("enableinvites"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Disable Invites")
            .setDescription("Disable invites.")
            .setEmoji(supportbot.SelectMenus.Tickets.DisableInvitesEmoji)
            .setValue("disableinvites"),
        );
      }

      selectMenuRow.addComponents(SelectMenus);
      ticketMsgContainer.addActionRowComponents(selectMenuRow);

      await ticketChannel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [ticketMsgContainer],
      });

      const departmentQuestions =
        departmentsEnabled && departmentConfig?.Questions
          ? departmentConfig.Questions
          : [];

      const globalQuestionsEnabled = supportbot.Ticket.Questions?.Enabled;
      const globalQuestions = supportbot.Ticket.Questions?.List || [];

      let questionsToAsk = [];

      if (departmentQuestions.length > 0) {
        questionsToAsk = departmentQuestions;
      } else if (globalQuestionsEnabled && globalQuestions.length > 0) {
        questionsToAsk = globalQuestions;
      }

      let ticketQuestionsAndAnswers = [];

      if (questionsToAsk.length > 0) {
        ticketQuestionsAndAnswers = await askTicketQuestions(
          ticketChannel,
          interaction,
          questionsToAsk,
        );

        if (typeof db.updateTicketQuestionAnswers === "function") {
          db.updateTicketQuestionAnswers(
            ticketChannel.id,
            ticketQuestionsAndAnswers,
          );
        }
      }

      if (!usingThreads && aiModeEnabled) {
        const aiThread = await createAITicketThread(
          ticketChannel,
          interaction,
        ).catch((error) => {
          console.error("Error creating AI mode thread:", error);
          return null;
        });
      }
    } catch (error) {
      console.error("Error in run method:", error);

      if (!interaction.replied && !interaction.deferred) {
        return interaction.editReply({
          content: "An error occurred while creating the ticket.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
});
