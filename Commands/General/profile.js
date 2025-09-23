const {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ApplicationCommandType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ApplicationCommandOptionType
} = require("discord.js");
const fs = require("fs");
const yaml = require("js-yaml");
const db = require("../../Structures/Database.js");
const Command = require("../../Structures/Command.js");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig  = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const msgconfig  = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

const clockedInUsers = new Set();

function updateClockedInStatus(embed, clockedIn) {
  embed.data.fields = embed.data.fields.map(f =>
    f.name === "Clocked In Status"
      ? { ...f, value: clockedIn ? "✅ Clocked In" : "❌ Clocked Out" }
      : f
  );
  return embed;
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
      required: false
    }
  ],

  async run(interaction) {
    await interaction.deferReply({ ephemeral: true });

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
        ephemeral: true
      });
    }

    const isStaff = member.roles.cache.has(Staff.id) || member.roles.cache.has(Admin.id);
    const isOwnProfile = interactionUserId === viewingUserId;

    const profileData = db.getProfile(viewingUserId);
    let { bio, timezone, clockedIn } = profileData;
    clockedIn = Boolean(clockedIn);

    let profileEmbed = new EmbedBuilder()
      .setTitle(`${viewingUser.username}'s Profile`)
      .setColor(supportbot.Embed.Colours.General)
      .setThumbnail(viewingUser.displayAvatarURL())
      .addFields(
        { name: "Bio", value: bio || "No bio set.", inline: false },
        { name: "Timezone", value: timezone || "No timezone set.", inline: true }
      );

    if (isStaff) {
      profileEmbed.addFields({
        name: "Clocked In Status",
        value: clockedIn ? "✅ Clocked In" : "❌ Clocked Out",
        inline: true
      });
    }

    const buttonRow = new ActionRowBuilder();
    if (isOwnProfile) {
      buttonRow.addComponents(
        new ButtonBuilder()
          .setCustomId("editProfile")
          .setLabel("Edit Profile")
          .setStyle(ButtonStyle.Secondary)
      );

      if (isStaff) {
        buttonRow.addComponents(
          new ButtonBuilder()
            .setCustomId("clockInOut")
            .setLabel(clockedIn ? "Clock Out" : "Clock In")
            .setStyle(ButtonStyle.Secondary)
        );
      }
    }

    if (isStaff && supportbot.Ticket.ClaimTickets.Enabled) {
      buttonRow.addComponents(
        new ButtonBuilder()
          .setCustomId("viewTicketStats")
          .setLabel("View Ticket Stats")
          .setStyle(ButtonStyle.Secondary)
      );
    }

    await interaction.editReply({
      embeds: [profileEmbed],
      components: buttonRow.components.length ? [buttonRow] : []
    });

    const filter = i =>
      ["editProfile", "clockInOut", "viewTicketStats", "showOpenTickets", "backToStats", "backToProfile"]
        .includes(i.customId) &&
      i.user.id === interactionUserId;

    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async i => {
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
                .setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("timezone")
                .setLabel("Timezone")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Enter your timezone")
                .setValue(String(timezone || ""))
                .setRequired(false)
            )
          );

        return i.showModal(modal);
      }

      if (i.customId === "clockInOut") {
        const newStatus = !clockedIn;
        db.setClockedIn(viewingUserId, newStatus);
        clockedIn = newStatus;
        profileEmbed = updateClockedInStatus(profileEmbed, newStatus);

        if (newStatus) clockedInUsers.add(viewingUserId);
        else clockedInUsers.delete(viewingUserId);

        const updatedRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("editProfile")
            .setLabel("Edit Profile")
            .setStyle(ButtonStyle.Secondary)
        );
        if (isStaff) {
          updatedRow.addComponents(
            new ButtonBuilder()
              .setCustomId("clockInOut")
              .setLabel(newStatus ? "Clock Out" : "Clock In")
              .setStyle(ButtonStyle.Secondary)
          );
          if (supportbot.Ticket.ClaimTickets.Enabled) {
            updatedRow.addComponents(
              new ButtonBuilder()
                .setCustomId("viewTicketStats")
                .setLabel("View Ticket Stats")
                .setStyle(ButtonStyle.Secondary)
            );
          }
        }

        await i.update({ embeds: [profileEmbed], components: [updatedRow] });

        const clockEmbed = new EmbedBuilder()
          .setTitle(newStatus ? "Clocked In!" : "Clocked Out!")
          .setDescription(newStatus ? "You have successfully clocked in." : "You have successfully clocked out.")
          .setColor(supportbot.Embed.Colours.General);

        return interaction.followUp({ embeds: [clockEmbed], ephemeral: true });
      }

      if (i.customId === "viewTicketStats") {
        const TicketData = JSON.parse(fs.readFileSync("./Data/TicketData.json", "utf8"));
        const ticketsClaimed = TicketData.tickets.filter(t => t.claimedBy === viewingUserId);
        const ticketsOpen = ticketsClaimed.filter(t => t.open);
        const totalTickets = ticketsClaimed.length;

        let totalResponseTime = 0;
        let responseCount = 0;
        ticketsClaimed.forEach(t => {
          if (t.claimedAt && t.createdAt) {
            totalResponseTime += new Date(t.claimedAt) - new Date(t.createdAt);
            responseCount++;
          }
        });

        const avgMinutes = responseCount ? Math.round(totalResponseTime / responseCount / 60000) : 0;

        const statsEmbed = new EmbedBuilder()
          .setTitle(msgconfig.TicketStats.Title)
          .setDescription(`> Ticket stats for <@${viewingUserId}>`)
          .setColor(supportbot.Embed.Colours.General)
          .addFields(
            { name: msgconfig.TicketStats.OpenTickets, value: `${ticketsOpen.length}`, inline: true },
            { name: msgconfig.TicketStats.TotalTickets, value: `${totalTickets}`, inline: true },
            { name: msgconfig.TicketStats.ResponseTime, value: `${avgMinutes} minutes`, inline: false }
          );

        const statsRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("showOpenTickets").setLabel("Show Open Tickets").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("backToProfile").setLabel("Back to Profile").setStyle(ButtonStyle.Secondary)
        );

        return i.update({ embeds: [statsEmbed], components: [statsRow] });
      }

      if (i.customId === "showOpenTickets") {
        const TicketData = JSON.parse(fs.readFileSync("./Data/TicketData.json", "utf8"));
        const ticketsOpen = TicketData.tickets.filter(t => t.claimedBy === viewingUserId && t.open);

        const openEmbed = new EmbedBuilder()
          .setTitle("Active Tickets")
          .setDescription(ticketsOpen.map(t => `<#${t.id}>`).join("\n") || "No active tickets.")
          .setColor(supportbot.Embed.Colours.General);

        const backRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("backToStats").setLabel("Back to Stats").setStyle(ButtonStyle.Secondary)
        );

        return i.update({ embeds: [openEmbed], components: [backRow] });
      }

      if (i.customId === "backToStats") {

        const TicketData = JSON.parse(fs.readFileSync("./Data/TicketData.json", "utf8"));
        const ticketsClaimed = TicketData.tickets.filter(t => t.claimedBy === viewingUserId);
        const ticketsOpen = ticketsClaimed.filter(t => t.open);
        const totalTickets = ticketsClaimed.length;

        let totalResponseTime = 0;
        let responseCount = 0;
        ticketsClaimed.forEach(t => {
          if (t.claimedAt && t.createdAt) {
            totalResponseTime += new Date(t.claimedAt) - new Date(t.createdAt);
            responseCount++;
          }
        });
        const avgMinutes = responseCount ? Math.round(totalResponseTime / responseCount / 60000) : 0;

        const statsEmbed = new EmbedBuilder()
          .setTitle(msgconfig.TicketStats.Title)
          .setDescription(`> Ticket stats for <@${viewingUserId}>`)
          .setColor(supportbot.Embed.Colours.General)
          .addFields(
            { name: msgconfig.TicketStats.OpenTickets, value: `${ticketsOpen.length}`, inline: true },
            { name: msgconfig.TicketStats.TotalTickets, value: `${totalTickets}`, inline: true },
            { name: msgconfig.TicketStats.ResponseTime, value: `${avgMinutes} minutes`, inline: false }
          );

        const statsRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("showOpenTickets").setLabel("Show Open Tickets").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("backToProfile").setLabel("Back to Profile").setStyle(ButtonStyle.Secondary)
        );

        return i.update({ embeds: [statsEmbed], components: [statsRow] });
      }

      if (i.customId === "backToProfile") {
        return i.update({
          embeds: [profileEmbed],
          components: buttonRow.components.length ? [buttonRow] : []
        });
      }
    });
  }
});

module.exports.clockedInUsers = clockedInUsers;
