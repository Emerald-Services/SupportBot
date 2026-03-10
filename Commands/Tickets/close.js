

const fs = require("fs");
const Discord = require("discord.js");
const yaml = require("js-yaml");

const db = require("../../Structures/Database.js");
const TicketManager = require("../../Structures/TicketManager.js");
const Command = require("../../Structures/Command.js");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

function getDepartmentConfig(departmentKey) {
  return supportbot.Ticket?.DepartmentSystem?.Departments?.[departmentKey] || null;
}

function getTicketUserId(ticket) {
  return ticket?.user || ticket?.user_id || null;
}

function buildContainer(title, lines = []) {
  const container = new Discord.ContainerBuilder();

  if (supportbot.Embed?.Colours?.General) {
    container.setAccentColor(
      parseInt(String(supportbot.Embed.Colours.General).replace("#", ""), 16),
    );
  }

  container.addTextDisplayComponents(new Discord.TextDisplayBuilder().setContent(`## ${title}`));

  container.addSeparatorComponents(new Discord.SeparatorBuilder().setDivider(true));

  if (lines.length > 0) {
    container.addTextDisplayComponents(
      new Discord.TextDisplayBuilder().setContent(lines.join("\n")),
    );
  }

  return container;
}

function buildReviewSummaryContainer(ticket, rating, comment) {
  const departmentConfig = ticket.department ? getDepartmentConfig(ticket.department) : null;
  const departmentName = departmentConfig?.Name || ticket.department || null;
  const departmentEmoji = departmentConfig?.Emoji || "🎫";

  const claimedByEnabled = supportbot.Ticket?.ClaimTickets?.Enabled === true;
  const claimedBy = claimedByEnabled && ticket.claimedBy ? `<@${ticket.claimedBy}>` : null;

  const ticketUserId = getTicketUserId(ticket);
  const lines = [
    `**${msgconfig.ReviewSystem.ReviewEmbed.ReviewedByTitle}** ${ticketUserId ? `<@${ticketUserId}>` : "Unknown User"}`,
  ];

  if (claimedBy) {
    lines.unshift(`**${msgconfig.ReviewSystem.ReviewEmbed.ReviewedStaffTitle}** ${claimedBy}`);
  }

  if (supportbot.Ticket?.DepartmentSystem?.Enabled === true && departmentName) {
    lines.push(`**Department** ${departmentEmoji} ${departmentName}`);
  }

  lines.push("");
  lines.push(`**${msgconfig.ReviewSystem.ReviewEmbed.RatingTitle}**`);
  lines.push(`${msgconfig.ReviewSystem.ReviewEmbed.ReviewEmoji.repeat(Number(rating))}`);
  lines.push("");
  lines.push(`**${msgconfig.ReviewSystem.ReviewEmbed.CommentTitle}**`);
  lines.push(comment || "No Comment Provided");

  const container = new Discord.ContainerBuilder();

  if (msgconfig.ReviewSystem?.ReviewEmbed?.Color) {
    container.setAccentColor(
      parseInt(String(msgconfig.ReviewSystem.ReviewEmbed.Color).replace("#", ""), 16),
    );
  } else if (supportbot.Embed?.Colours?.General) {
    container.setAccentColor(
      parseInt(String(supportbot.Embed.Colours.General).replace("#", ""), 16),
    );
  }

  container.addTextDisplayComponents(
    new Discord.TextDisplayBuilder().setContent(`## ${msgconfig.ReviewSystem.ReviewEmbed.Title}`),
  );

  container.addSeparatorComponents(new Discord.SeparatorBuilder().setDivider(true));

  container.addTextDisplayComponents(new Discord.TextDisplayBuilder().setContent(lines.join("\n")));

  return container;
}

async function collectReview(interaction, ticket) {
  const ticketUserId = getTicketUserId(ticket);
  if (!ticketUserId) return null;

  const ratingContainer = buildContainer(msgconfig.ReviewSystem.Rate.Title, [
    msgconfig.ReviewSystem.Rate.Description,
    "",
  ]);

  const ratingRow = new Discord.ActionRowBuilder().addComponents(
    new Discord.StringSelectMenuBuilder()
      .setCustomId(`closeReviewRating:${interaction.id}`)
      .setPlaceholder("Select a rating")
      .addOptions([
        { label: msgconfig.ReviewSystem.Stars.One, value: "1" },
        { label: msgconfig.ReviewSystem.Stars.Two, value: "2" },
        { label: msgconfig.ReviewSystem.Stars.Three, value: "3" },
        { label: msgconfig.ReviewSystem.Stars.Four, value: "4" },
        { label: msgconfig.ReviewSystem.Stars.Five, value: "5" },
      ]),
  );

  ratingContainer.addActionRowComponents(ratingRow);

  const ratingPrompt = await interaction.followUp({
    flags: Discord.MessageFlags.IsComponentsV2,
    components: [ratingContainer],
  });

  let rating = null;

  try {
    const ratingInteraction = await ratingPrompt.awaitMessageComponent({
      componentType: Discord.ComponentType.StringSelect,
      time: 120000,
      filter: (i) =>
        i.customId === `closeReviewRating:${interaction.id}` && i.user.id === ticketUserId,
    });

    rating = ratingInteraction.values[0];
    await ratingInteraction.deferUpdate().catch(() => {});
  } catch {
    return null;
  }

  const commentContainer = buildContainer(msgconfig.ReviewSystem.Comment.Title, [
    msgconfig.ReviewSystem.Comment.Description,
    "",
  ]);

  const commentRow = new Discord.ActionRowBuilder().addComponents(
    new Discord.ButtonBuilder()
      .setCustomId(`closeReviewWrite:${interaction.id}`)
      .setLabel("Write Comment")
      .setStyle(Discord.ButtonStyle.Secondary),
    new Discord.ButtonBuilder()
      .setCustomId(`closeReviewSkip:${interaction.id}`)
      .setLabel("Skip Comment")
      .setStyle(Discord.ButtonStyle.Danger),
  );

  commentContainer.addActionRowComponents(commentRow);

  const commentPrompt = await interaction.followUp({
    flags: Discord.MessageFlags.IsComponentsV2,
    components: [commentContainer],
  });

  let comment = "No Comment Provided";

  try {
    const buttonInteraction = await commentPrompt.awaitMessageComponent({
      componentType: Discord.ComponentType.Button,
      time: 120000,
      filter: (i) =>
        (i.customId === `closeReviewWrite:${interaction.id}` ||
          i.customId === `closeReviewSkip:${interaction.id}`) &&
        i.user.id === ticketUserId,
    });

    if (buttonInteraction.customId === `closeReviewSkip:${interaction.id}`) {
      await buttonInteraction.deferUpdate().catch(() => {});
      return { rating, comment };
    }

    await buttonInteraction
      .update({
        flags: Discord.MessageFlags.IsComponentsV2,
        components: [
          buildContainer(msgconfig.ReviewSystem.Comment.Title, [
            `Requested from: <@${ticketUserId}>`,
            "",
            "Please send your review comment in the channel now.",
            "Type `no` to skip.",
          ]),
        ],
      })
      .catch(() => {});

    const collected = await interaction.channel.awaitMessages({
      max: 1,
      time: 120000,
      filter: (m) => m.author.id === ticketUserId,
    });

    const message = collected.first();

    if (message) {
      const rawComment = message.content?.trim();
      if (rawComment && rawComment.toLowerCase() !== "no") {
        comment = rawComment;
      }

      await message.delete().catch(() => {});
    }
  } catch {
    return { rating, comment };
  }

  return { rating, comment };
}

function getTranscriptAttachmentFromResult(result) {
  if (!result) return null;

  if (typeof result === "string") {
    return result;
  }

  if (result.filePath) return result.filePath;
  if (result.attachment) return result.attachment;
  if (result.path) return result.path;

  return null;
}

async function maybeDMTranscript(interaction, ticket, transcriptResult) {
  if (supportbot.Ticket?.UserManagement?.DMTranscript !== true) {
    return;
  }

  const ticketUserId = getTicketUserId(ticket);
  if (!ticketUserId) return;

  const ticketUser = await interaction.client.users.fetch(ticketUserId).catch(() => null);

  if (!ticketUser) return;

  const attachmentPath = getTranscriptAttachmentFromResult(transcriptResult);
  if (!attachmentPath) return;

  try {
    await ticketUser.send({
      content: `Here is a copy of your ticket transcript from \`${interaction.guild.name}\`.`,
      files: [attachmentPath],
    });
  } catch (error) {
    console.error("Failed to DM transcript to user:", error);
  }
}

async function collectCloseConfirmation(interaction, ticket, reason) {
  const ticketUserId = getTicketUserId(ticket);

  const lines = [
    "Are you sure you want to close this ticket?",
    "",
    `**Ticket:** ${interaction.channel.name}`,
    `**Reason:** ${reason || "No Reason Provided."}`,
  ];

  if (ticketUserId) {
    lines.push(`**Ticket User:** <@${ticketUserId}>`);
  }

  if (supportbot.Ticket?.ReviewSystem?.Enabled === true) {
    lines.push("");
    lines.push("A review will be requested before the ticket is closed.");
  }

  const confirmContainer = buildContainer("Close Confirmation", lines);

  const confirmRow = new Discord.ActionRowBuilder().addComponents(
    new Discord.ButtonBuilder()
      .setCustomId(`confirmClose:${interaction.id}`)
      .setLabel("Confirm Close")
      .setStyle(Discord.ButtonStyle.Danger),
    new Discord.ButtonBuilder()
      .setCustomId(`cancelClose:${interaction.id}`)
      .setLabel("Cancel")
      .setStyle(Discord.ButtonStyle.Secondary),
  );

  confirmContainer.addActionRowComponents(confirmRow);

  const confirmMessage = await interaction.editReply({
    flags: Discord.MessageFlags.IsComponentsV2,
    components: [confirmContainer],
  });

  try {
    const buttonInteraction = await confirmMessage.awaitMessageComponent({
      componentType: Discord.ComponentType.Button,
      time: 120000,
      filter: (i) =>
        (i.customId === `confirmClose:${interaction.id}` ||
          i.customId === `cancelClose:${interaction.id}`) &&
        i.user.id === interaction.user.id,
    });

    if (buttonInteraction.customId === `cancelClose:${interaction.id}`) {
      await buttonInteraction
        .update({
          flags: Discord.MessageFlags.IsComponentsV2,
          components: [
            buildContainer("Close Cancelled", ["The ticket close process has been cancelled."]),
          ],
        })
        .catch(() => {});

      return false;
    }

    await buttonInteraction.deferUpdate().catch(() => {});
    return true;
  } catch {
    await interaction
      .editReply({
        flags: Discord.MessageFlags.IsComponentsV2,
        components: [buildContainer("Close Cancelled", ["The close confirmation timed out."])],
      })
      .catch(() => {});

    return false;
  }
}

async function postReview(interaction, ticket, reviewData) {
  const { getChannel } = interaction.client;
  const reviewChannel = await getChannel(supportbot.Ticket.ReviewSystem.Channel, interaction.guild);

  if (!reviewChannel || !reviewData) return;

  const reviewContainer = buildReviewSummaryContainer(
    ticket,
    reviewData.rating,
    reviewData.comment,
  );

  await reviewChannel
    .send({
      flags: Discord.MessageFlags.IsComponentsV2,
      components: [reviewContainer],
    })
    .catch(() => {});
}

async function handleCloseTicket(interaction, reason, ticket) {
  try {
    if (typeof db.updateTicketStatus === "function") {
      db.updateTicketStatus(interaction.channel.id, "closed");
    }

    const transcriptResult = await TicketManager.createTranscript(interaction, ticket, reason);

    await maybeDMTranscript(interaction, ticket, transcriptResult);

    await interaction
      .editReply({
        flags: Discord.MessageFlags.IsComponentsV2,
        components: [
          buildContainer("Ticket Closed", [
            `**Ticket:** ${interaction.channel.name}`,
            `**Closed By:** <@${interaction.user.id}>`,
            `**Reason:** ${reason || "No Reason Provided."}`,
          ]),
        ],
      })
      .catch(() => {});

    await interaction.channel.delete().catch(() => {});
  } catch (err) {
    console.error("Error handling ticket close:", err);

    if (interaction.deferred || interaction.replied) {
      await interaction
        .editReply({
          content: "An error occurred while closing the ticket.",
          components: [],
        })
        .catch(() => {});
      return;
    }

    await interaction
      .reply({
        content: "An error occurred while closing the ticket.",
        flags: Discord.MessageFlags.Ephemeral,
      })
      .catch(() => {});
  }
}

module.exports = new Command({
  name: cmdconfig.CloseTicket.Command,
  description: cmdconfig.CloseTicket.Description,
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "reason",
      description: "Ticket Close Reason",
      type: Discord.ApplicationCommandOptionType.String,
    },
  ],
  permissions: cmdconfig.CloseTicket.Permission,

  async run(interaction) {
    const { getRole } = interaction.client;

    if (supportbot.Ticket.Close.StaffOnly) {
      const SupportStaff = await getRole(supportbot.Roles.StaffMember.Staff, interaction.guild);
      const Admin = await getRole(supportbot.Roles.StaffMember.Admin, interaction.guild);

      if (!SupportStaff || !Admin) {
        return interaction.reply({
          content: "Some roles seem to be missing! Please check for errors when starting the bot.",
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      if (
        !interaction.member.roles.cache.has(SupportStaff.id) &&
        !interaction.member.roles.cache.has(Admin.id)
      ) {
        return interaction.reply({
          flags: Discord.MessageFlags.IsComponentsV2 | Discord.MessageFlags.Ephemeral,
          components: [
            buildContainer("Invalid Permissions!", [
              msgconfig.Error.IncorrectPerms,
              "",
              `Role Required: \`${supportbot.Roles.StaffMember.Staff}\` or \`${supportbot.Roles.StaffMember.Admin}\``,
            ]),
          ],
        });
      }
    }

    const isThread = interaction.channel.type === Discord.ChannelType.PrivateThread;

    if (
      (supportbot.Ticket.TicketType === "threads" && !isThread) ||
      (supportbot.Ticket.TicketType === "channels" &&
        interaction.channel.type !== Discord.ChannelType.GuildText)
    ) {
      return interaction.reply({
        flags: Discord.MessageFlags.IsComponentsV2 | Discord.MessageFlags.Ephemeral,
        components: [
          buildContainer("Invalid Channel!", [
            `This command can only be used in a ${
              supportbot.Ticket.TicketType === "threads" ? "ticket thread" : "ticket channel"
            }.`,
          ]),
        ],
      });
    }

    await interaction.deferReply({ flags: Discord.MessageFlags.Ephemeral });

    const ticket = db.getTicket(interaction.channel.id);

    if (!ticket) {
      return interaction.editReply({
        flags: Discord.MessageFlags.IsComponentsV2,
        components: [buildContainer("No Ticket Found!", [msgconfig.Error.NoValidTicket])],
      });
    }

    const reason = interaction.options?.getString("reason") || "No Reason Provided.";

    const confirmed = await collectCloseConfirmation(interaction, ticket, reason);
    if (!confirmed) {
      return;
    }

    if (supportbot.Ticket?.ReviewSystem?.Enabled === true) {
      const reviewData = await collectReview(interaction, ticket);

      if (reviewData) {
        await postReview(interaction, ticket, reviewData);
      }

      await handleCloseTicket(interaction, reason, ticket);
      return;
    }

    await handleCloseTicket(interaction, reason, ticket);
  },
});
