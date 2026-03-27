const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ApplicationCommandType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ApplicationCommandOptionType,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const fs = require("fs");
const yaml = require("js-yaml");
const db = require("../../Structures/Database.js");
const Command = require("../../Structures/Command.js");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

const clockedInUsers = new Set();

function safeGetProfile(userId) {
  try {
    if (typeof db.getProfile !== "function") {
      console.error("db.getProfile is not a function");
      return {
        bio: "",
        timezone: "",
        clockedIn: false,
      };
    }

    const profile = db.getProfile(userId);

    return {
      bio: profile?.bio || "",
      timezone: profile?.timezone || "",
      clockedIn: Boolean(profile?.clockedIn),
    };
  } catch (error) {
    console.error("Error getting profile:", error);
    return {
      bio: "",
      timezone: "",
      clockedIn: false,
    };
  }
}

function safeSetClockedIn(userId, value) {
  try {
    if (typeof db.setClockedIn !== "function") {
      console.error("db.setClockedIn is not a function");
      return false;
    }

    db.setClockedIn(userId, value);
    return true;
  } catch (error) {
    console.error("Error setting clocked in status:", error);
    return false;
  }
}

function buildProfileContainer({
  viewingUser,
  viewingUserId,
  bio,
  timezone,
  clockedIn,
  isStaff,
}) {
  const container = new ContainerBuilder();

  if (supportbot.Embed?.Colours?.General) {
    container.setAccentColor(
      parseInt(String(supportbot.Embed.Colours.General).replace("#", ""), 16),
    );
  }

  const avatarUrl = viewingUser.displayAvatarURL({ size: 128, extension: "png" });

  const gallery = new MediaGalleryBuilder().addItems(
    new MediaGalleryItemBuilder().setURL(avatarUrl)
  );

  container.addMediaGalleryComponents(gallery);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`## ${viewingUser.username}'s Profile`)
  );

  container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `**Bio:** ${bio || "No bio set."}`,
        `**Timezone:** ${timezone || "No timezone set."}`,
        ...(isStaff
          ? [`**Clocked In:** ${clockedIn ? "✅ Clocked In" : "❌ Clocked Out"}`]
          : []),
      ].join("\n")
    )
  );

  return container;
}

function buildProfileButtons({ isOwnProfile, isStaff, clockedIn }) {
  const row = new ActionRowBuilder();

  if (isOwnProfile) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("editProfile")
        .setLabel("Edit Profile")
        .setStyle(ButtonStyle.Secondary),
    );

    if (isStaff) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId("clockInOut")
          .setLabel(clockedIn ? "Clock Out" : "Clock In")
          .setStyle(ButtonStyle.Secondary),
      );
    }
  }

  if (isStaff && supportbot.Ticket?.ClaimTickets?.Enabled) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("viewTicketStats")
        .setLabel("View Ticket Stats")
        .setStyle(ButtonStyle.Secondary),
    );
  }

  return row.components.length ? [row] : [];
}

function buildTicketStatsContainer(viewingUserId, ticketsClaimed, ticketsOpen, avgMinutes) {
  const container = new ContainerBuilder();

  if (supportbot.Embed?.Colours?.General) {
    container.setAccentColor(
      parseInt(String(supportbot.Embed.Colours.General).replace("#", ""), 16),
    );
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${msgconfig.TicketStats.Title || "Ticket Stats"}`),
  );

  container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `> Ticket stats for <@${viewingUserId}>`,
        ``,
        `**${msgconfig.TicketStats.OpenTickets || "Open Tickets"}:** ${ticketsOpen.length}`,
        `**${msgconfig.TicketStats.TotalTickets || "Total Tickets"}:** ${ticketsClaimed.length}`,
        `**${msgconfig.TicketStats.ResponseTime || "Average Response Time"}:** ${avgMinutes} minutes`,
      ].join("\n"),
    ),
  );

  return container;
}

function buildOpenTicketsContainer(ticketsOpen) {
  const container = new ContainerBuilder();

  if (supportbot.Embed?.Colours?.General) {
    container.setAccentColor(
      parseInt(String(supportbot.Embed.Colours.General).replace("#", ""), 16),
    );
  }

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Active Tickets`));

  container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      ticketsOpen.length ? ticketsOpen.map((t) => `<#${t.id}>`).join("\n") : "No active tickets.",
    ),
  );

  return container;
}

module.exports = new Command({
  name: cmdconfig.Profile.Command,
  description: cmdconfig.Profile.Description,
  type: ApplicationCommandType.ChatInput,
  permissions: cmdconfig.Profile.Permission,
  options: [
    {
      name: "user",
      description: "The user to view the profile of",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],

  async run(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const viewingUser = interaction.options.getUser("user") || interaction.user;
      const viewingUserId = viewingUser.id;
      const interactionUserId = interaction.user.id;

      const member = await interaction.guild.members.fetch(viewingUserId);
      const { getRole } = interaction.client;

      const Staff = await getRole(supportbot.Roles.StaffMember.Staff, interaction.guild);
      const Admin = await getRole(supportbot.Roles.StaffMember.Admin, interaction.guild);

      if (!Staff || !Admin) {
        return interaction.editReply({
          content: "Some roles seem to be missing!\nPlease check for errors when starting the bot.",
        });
      }

      const isStaff = member.roles.cache.has(Staff.id) || member.roles.cache.has(Admin.id);
      const isOwnProfile = interactionUserId === viewingUserId;

      if (typeof db.ensureProfile === "function") {
        db.ensureProfile(viewingUserId);
      }

      let { bio, timezone, clockedIn } = safeGetProfile(viewingUserId);

      const profileContainer = buildProfileContainer({
        viewingUser,
        viewingUserId,
        bio,
        timezone,
        clockedIn,
        isStaff,
      });

      const buttonRows = buildProfileButtons({
        isOwnProfile,
        isStaff,
        clockedIn,
      });

      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [profileContainer, ...buttonRows],
      });

      const filter = (i) =>
        [
          "editProfile",
          "clockInOut",
          "viewTicketStats",
          "showOpenTickets",
          "backToStats",
          "backToProfile",
        ].includes(i.customId) && i.user.id === interactionUserId;

      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "editProfile") {
          const modal = new ModalBuilder()
            .setCustomId("editProfileModal")
            .setTitle("Edit Profile")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("bio")
                  .setLabel("Bio")
                  .setStyle(TextInputStyle.Paragraph)
                  .setPlaceholder("Enter your bio")
                  .setValue(String(bio || ""))
                  .setRequired(false),
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("timezone")
                  .setLabel("Timezone")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("Enter your timezone")
                  .setValue(String(timezone || ""))
                  .setRequired(false),
              ),
            );

          return i.showModal(modal);
        }

        if (i.customId === "clockInOut") {
          const newStatus = !clockedIn;
          const saved = safeSetClockedIn(viewingUserId, newStatus);

          if (!saved) {
            return i.reply({
              content:
                "Could not update clock in status because the profile database is not available.",
              flags: MessageFlags.Ephemeral,
            });
          }

          clockedIn = newStatus;

          if (newStatus) clockedInUsers.add(viewingUserId);
          else clockedInUsers.delete(viewingUserId);

          const updatedProfileContainer = buildProfileContainer({
            viewingUser,
            viewingUserId,
            bio,
            timezone,
            clockedIn,
            isStaff,
          });

          const updatedButtonRows = buildProfileButtons({
            isOwnProfile,
            isStaff,
            clockedIn,
          });

          await i.update({
            flags: MessageFlags.IsComponentsV2,
            components: [updatedProfileContainer, ...updatedButtonRows],
          });

          return interaction.followUp({
            content: newStatus
              ? "You have successfully clocked in."
              : "You have successfully clocked out.",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (i.customId === "viewTicketStats") {
          let TicketData = { tickets: [] };

          try {
            TicketData = JSON.parse(fs.readFileSync("./Data/TicketData.json", "utf8"));
          } catch (error) {
            console.error("Error reading TicketData.json:", error);
          }

          const ticketsClaimed = TicketData.tickets.filter((t) => t.claimedBy === viewingUserId);
          const ticketsOpen = ticketsClaimed.filter((t) => t.open);
          const totalTickets = ticketsClaimed.length;

          let totalResponseTime = 0;
          let responseCount = 0;

          ticketsClaimed.forEach((t) => {
            if (t.claimedAt && t.createdAt) {
              totalResponseTime += new Date(t.claimedAt) - new Date(t.createdAt);
              responseCount++;
            }
          });

          const avgMinutes = responseCount
            ? Math.round(totalResponseTime / responseCount / 60000)
            : 0;

          const statsContainer = buildTicketStatsContainer(
            viewingUserId,
            ticketsClaimed,
            ticketsOpen,
            avgMinutes,
          );

          const statsRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("showOpenTickets")
              .setLabel("Show Open Tickets")
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("backToProfile")
              .setLabel("Back to Profile")
              .setStyle(ButtonStyle.Secondary),
          );

          return i.update({
            flags: MessageFlags.IsComponentsV2,
            components: [statsContainer, statsRow],
          });
        }

        if (i.customId === "showOpenTickets") {
          let TicketData = { tickets: [] };

          try {
            TicketData = JSON.parse(fs.readFileSync("./Data/TicketData.json", "utf8"));
          } catch (error) {
            console.error("Error reading TicketData.json:", error);
          }

          const ticketsOpen = TicketData.tickets.filter(
            (t) => t.claimedBy === viewingUserId && t.open,
          );

          const openContainer = buildOpenTicketsContainer(ticketsOpen);

          const backRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("backToStats")
              .setLabel("Back to Stats")
              .setStyle(ButtonStyle.Secondary),
          );

          return i.update({
            flags: MessageFlags.IsComponentsV2,
            components: [openContainer, backRow],
          });
        }

        if (i.customId === "backToStats") {
          let TicketData = { tickets: [] };

          try {
            TicketData = JSON.parse(fs.readFileSync("./Data/TicketData.json", "utf8"));
          } catch (error) {
            console.error("Error reading TicketData.json:", error);
          }

          const ticketsClaimed = TicketData.tickets.filter((t) => t.claimedBy === viewingUserId);
          const ticketsOpen = ticketsClaimed.filter((t) => t.open);

          let totalResponseTime = 0;
          let responseCount = 0;

          ticketsClaimed.forEach((t) => {
            if (t.claimedAt && t.createdAt) {
              totalResponseTime += new Date(t.claimedAt) - new Date(t.createdAt);
              responseCount++;
            }
          });

          const avgMinutes = responseCount
            ? Math.round(totalResponseTime / responseCount / 60000)
            : 0;

          const statsContainer = buildTicketStatsContainer(
            viewingUserId,
            ticketsClaimed,
            ticketsOpen,
            avgMinutes,
          );

          const statsRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("showOpenTickets")
              .setLabel("Show Open Tickets")
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("backToProfile")
              .setLabel("Back to Profile")
              .setStyle(ButtonStyle.Secondary),
          );

          return i.update({
            flags: MessageFlags.IsComponentsV2,
            components: [statsContainer, statsRow],
          });
        }

        if (i.customId === "backToProfile") {
          const updatedProfileContainer = buildProfileContainer({
            viewingUser,
            viewingUserId,
            bio,
            timezone,
            clockedIn,
            isStaff,
          });

          const updatedButtonRows = buildProfileButtons({
            isOwnProfile,
            isStaff,
            clockedIn,
          });

          return i.update({
            flags: MessageFlags.IsComponentsV2,
            components: [updatedProfileContainer, ...updatedButtonRows],
          });
        }
      });
    } catch (error) {
      console.error("Error executing profile command:", error);

      if (interaction.deferred || interaction.replied) {
        return interaction
          .editReply({
            content: "An error occurred while loading the profile.",
            components: [],
          })
          .catch(() => {});
      }

      return interaction
        .reply({
          content: "An error occurred while loading the profile.",
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
    }
  },
});

module.exports.clockedInUsers = clockedInUsers;
