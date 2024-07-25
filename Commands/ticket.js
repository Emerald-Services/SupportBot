// ticket.js

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
} = require("discord.js");
const yaml = require("js-yaml");

const panelconfig = yaml.load(fs.readFileSync("./Configs/ticket-panel.yml", "utf8"));
const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

const Command = require("../Structures/Command.js");
const TicketNumberID = require("../Structures/TicketID.js");
const MySQLStorage = require("../Structures/Storage.js");

// Initialize storage
const storage = new MySQLStorage();
storage.connect();

let ticket_data;
if (!storage.useMySQL) {
  try {
    ticket_data = require("../Data/TicketData.json");
  } catch (error) {
    ticket_data = {};
  }
}

async function getClockedInUsers(guild) {
  const clockedInUsers = new Set();

  const profilesDir = './Data/Profiles';
  const profileFiles = fs.readdirSync(profilesDir);

  for (const file of profileFiles) {
    const profileData = JSON.parse(fs.readFileSync(`${profilesDir}/${file}`, "utf8"));
    if (profileData.clockedIn) {
      const userId = file.replace('.json', '');
      const member = await guild.members.fetch(userId);
      if (member) clockedInUsers.add(member.id);
    }
  }
  return clockedInUsers;
}

async function assignTicketToUser(ticketChannel, Staff, Admin, interaction, attempts = 0) {
  console.log(`Assigning ticket attempt ${attempts}`);

  try {
    const clockedInUsers = await getClockedInUsers(interaction.guild);
    console.log(`Clocked in users: ${Array.from(clockedInUsers).join(', ')}`);

    if (clockedInUsers.size === 0 || attempts >= 2) {
      console.log("No clocked in users or max attempts reached");
      const claimChannel = await interaction.guild.channels.cache.get(supportbot.Ticket.ClaimTickets.Channel);
      if (claimChannel) {
        const claimEmbed = new EmbedBuilder()
          .setTitle(msgconfig.Ticket.ClaimTickets.ClaimTitle || 'Default Claim Title')
          .setDescription(msgconfig.Ticket.ClaimTickets.ClaimMessage || 'Default Claim Message')
          .setColor(supportbot.Embed.Colours.General);

        const claimButton = new ButtonBuilder()
          .setCustomId(`claimticket-${ticketChannel.id}`)
          .setLabel(supportbot.Ticket.ClaimTickets.ButtonTitle || 'Claim Ticket')
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(claimButton);

        const claimMessage = await claimChannel.send({
          content: `<@&${Staff.id}> <@&${Admin.id}>`,
          embeds: [claimEmbed],
          components: [row],
        });

        const filter = i => i.customId === `claimticket-${ticketChannel.id}` && i.member.roles.cache.has(Staff.id);
        const collector = claimMessage.createMessageComponentCollector({ filter, time: 120000 });

        collector.on('collect', async i => {
          console.log(`Ticket claimed by user ${i.user.id}`);
          await ticketChannel.send({ content: `<@${i.user.id}> has claimed the ticket.` });
        });

        collector.on('end', async collected => {
          if (collected.size === 0) {
            console.log("No one claimed the ticket, notifying admins");
            await claimMessage.delete();

            await claimChannel.send({
              content: `No one claimed the ticket. Tagging roles: <@&${Staff.id}> <@&${Admin.id}>`,
              embeds: [new EmbedBuilder().setDescription(`Ticket is still unclaimed: <#${ticketChannel.id}>`).setColor(supportbot.Embed.Colours.Warn)],
            });
          }
        });

        return null;
      } else {
        console.error("Claim channel not found");
        return null;
      }
    }

    const clockedInArray = Array.from(clockedInUsers);
    const assignedUserId = clockedInArray[Math.floor(Math.random() * clockedInArray.length)];
    const assignedUser = await interaction.guild.members.fetch(assignedUserId);
    console.log(`Assigned user: ${assignedUserId}`);

    const claimEmbed = new EmbedBuilder()
      .setTitle(msgconfig.Ticket.ClaimTickets.ClaimTitle || 'Default Claim Title')
      .setDescription(msgconfig.Ticket.ClaimTickets.ClaimMessage.replace('%user%', interaction.user.id) || 'Default Claim Message')
      .setColor(supportbot.Embed.Colours.General);

    const claimButton = new ButtonBuilder()
      .setCustomId(`claimticket-${ticketChannel.id}`)
      .setLabel(supportbot.Ticket.ClaimTickets.ButtonTitle || 'Claim Ticket')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(claimButton);

    const claimChannel = await interaction.guild.channels.cache.get(supportbot.Ticket.ClaimTickets.Channel);
    if (!claimChannel) {
      console.error("Claim channel not found");
      return null;
    }

    const claimMessage = await claimChannel.send({
      content: `${assignedUser}`,
      embeds: [claimEmbed],
      components: [row],
    });

    const filter = i => i.customId === `claimticket-${ticketChannel.id}` && i.user.id === assignedUserId;
    const collector = claimMessage.createMessageComponentCollector({ filter, time: 120000 });

    collector.on('collect', async i => {
      console.log(`Ticket claimed by user ${i.user.id}`);
      await ticketChannel.send({ content: `<@${assignedUserId}>` });
    });

    collector.on('end', async collected => {
      if (collected.size === 0) {
        console.log("No one claimed the ticket, attempting reassignment");
        await claimMessage.delete();

        if (attempts >= 1) {
          await claimChannel.send({
            content: `No one claimed the ticket. Tagging roles: <@&${Staff.id}> <@&${Admin.id}>`,
            embeds: [new EmbedBuilder().setDescription(`Ticket is still unclaimed: <#${ticketChannel.id}>`).setColor(supportbot.Embed.Colours.Warn)],
          });

          // Add a claim button for any staff member to click
          const claimEmbed = new EmbedBuilder()
            .setTitle(msgconfig.Ticket.ClaimTickets.ClaimTitle)
            .setDescription(msgconfig.Ticket.ClaimTickets.ClaimMessage)
            .setColor(supportbot.Embed.Colours.General);

          const claimButton = new ButtonBuilder()
            .setCustomId(`claimticket-${ticketChannel.id}`)
            .setLabel(supportbot.Ticket.ClaimTickets.ButtonTitle)
            .setEmoji(supportbot.Ticket.ClaimTickets.ButtonEmoji)
            .setStyle(ButtonStyle.Primary);

          const row = new ActionRowBuilder().addComponents(claimButton);

          const claimMessage = await claimChannel.send({
            content: `<@&${Staff.id}> <@&${Admin.id}>`,
            embeds: [claimEmbed],
            components: [row],
          });

          const filter = i => i.customId === `claimticket-${ticketChannel.id}` && i.member.roles.cache.has(Staff.id);
          const collector = claimMessage.createMessageComponentCollector({ filter, time: 120000 });

          collector.on('collect', async i => {
            console.log(`Ticket ${ticketChannel.id} claimed by user ${i.user.id}`);
            await ticketChannel.member.add(i.user.id);
          });

          collector.on('end', async collected => {
            if (collected.size === 0) {
              console.log(`No one claimed the ticket (${ticketChannel.id}), notifying all staff`);
              await claimMessage.delete();

              await claimChannel.send({
                content: `No one claimed the ticket. Tagging roles: <@&${Staff.id}> <@&${Admin.id}>`,
              });
            }
          });
        } else {
          const ReassigningEmbed = new EmbedBuilder()
            .setTitle(msgconfig.Ticket.ClaimTickets.ReassigningTitle)
            .setDescription(msgconfig.Ticket.ClaimTickets.ReassigningMessage.replace('%user%', assignedUserId))
            .setColor(supportbot.Embed.Colours.General);

          await claimChannel.send({ embeds: [ReassigningEmbed], components: [] });
          await assignTicketToUser(ticketChannel, Staff, Admin, interaction, attempts + 1);
        }
      }
    });

    return assignedUserId;
  } catch (error) {
    console.error("Error in assignTicketToUser function:", error);
    if (error instanceof CombinedError) {
      console.error("CombinedError details:", error.errors);
    }
    return null;
  }
}

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
    try {
      let TicketReason = null;
      if (supportbot.Ticket.TicketReason) {
        TicketReason = interaction.reason || null; // Retrieve the reason from the interaction object
      }

      let TicketData = JSON.parse(fs.readFileSync("./Data/TicketData.json", "utf8"));
      const { getRole, getChannel } = interaction.client;
      let User = interaction.guild.members.cache.get(interaction.user.id);

      if (
        supportbot.Ticket.TicketsPerUser &&
        TicketData.tickets.filter((t) => t.user === interaction.user.id && t.open).length >= supportbot.Ticket.TicketsPerUser
      ) {
        return interaction.reply({
          embeds: [
            {
              title: "Too Many Tickets!",
              description: `You can't have more than ${supportbot.Ticket.TicketsPerUser} open tickets!`,
              color: supportbot.Embed.Colours.Warn,
            },
          ],
          ephemeral: true,
        });
      }

      if (User.roles.cache.has(supportbot.Roles.ModRoles.Blacklisted)) {
        return interaction.reply({
          content: msgconfig.Ticket.Blacklisted,
          ephemeral: true,
        });
      }

      if (User.roles.cache.has(supportbot.Roles.ModRoles.Muted)) {
        return interaction.reply({
          content: msgconfig.Ticket.Muted,
          ephemeral: true,
        });
      }

      let ticketNumberID = await TicketNumberID.pad();
      const TicketSubject = TicketReason || msgconfig.Ticket.InvalidSubject;

      const TicketExists = new EmbedBuilder()
        .setTitle("Ticket Exists!")
        .setDescription(msgconfig.Ticket.TicketExists);

      if (
        await interaction.guild.channels.cache.find(
          (ticketChannel) => ticketChannel.name === `${supportbot.Ticket.Channel}${ticketNumberID}`
        )
      ) {
        return await interaction.reply({
          embeds: [TicketExists],
          ephemeral: true,
        });
      }

      const Staff = await getRole(supportbot.Roles.StaffMember.Staff, interaction.guild);
      const Admin = await getRole(supportbot.Roles.StaffMember.Admin, interaction.guild);
      if (!Staff || !Admin)
        return interaction.reply({
          content: "Some roles seem to be missing!\nPlease check for errors when starting the bot.",
          ephemeral: true,
        });

      const TicketCategory = interaction.guild.channels.cache.find(
        (c) => c.name === supportbot.Ticket.TicketCategory || c.id === supportbot.Ticket.TicketCategory
      );

      const channel = await getChannel(supportbot.Ticket.TicketCategory, interaction.guild);
      const ticketChannel = await channel.threads.create({
        name: `${supportbot.Ticket.Channel}${ticketNumberID}`,
        type: ChannelType.PrivateThread,
        parent: TicketCategory,
        autoArchiveDuration: 60,
        reason: 'support ticket',
      });

      // Assign ticket to a user if claiming tickets is enabled
      if (supportbot.Ticket.ClaimTickets.Enabled) {
        const assignedUserId = await assignTicketToUser(ticketChannel, Staff, Admin, interaction);
        if (!assignedUserId) {
          const claimChannel = await interaction.guild.channels.cache.get(supportbot.Ticket.ClaimTickets.Channel);
          await claimChannel.send(`<@&${Staff.id}> <@&${Admin.id}>`);
        }
      }

      // Add user to the ticket channel
      await ticketChannel.members.add(interaction.user.id);

      // Save ticket data
      TicketData.tickets.push({
        id: ticketChannel.id,
        name: ticketChannel.name,
        user: interaction.user.id,
        number: ticketNumberID,
        reason: TicketSubject,
        open: true,
        subUsers: [],
        createdAt: new Date().toISOString(),
        claimedAt: null,
      });

      if (storage.useMySQL) {
        // Ensuring no undefined values are passed to the MySQL query
        const ticketToSave = {
          id: ticketChannel.id,
          user: interaction.user.id,
          reason: TicketSubject,
          createdAt: new Date().toISOString(),
          open: true,
        };
        await storage.saveTicket(ticketToSave);
      } else {
        fs.writeFileSync(
          "./Data/TicketData.json",
          JSON.stringify(TicketData, null, 4),
          (err) => {
            if (err) console.error(err);
          }
        );
      }

      // Notify the user that the ticket was created
      const CreatedTicket = new EmbedBuilder()
        .setDescription(
          msgconfig.Ticket.TicketCreatedAlert.replace(/%ticketauthor%/g, interaction.user.id)
            .replace(/%ticketid%/g, ticketChannel.id)
            .replace(/%ticketusername%/g, interaction.user.username)
            .replace(/%ticketreason%/g, TicketSubject)
        )
        .setColor(supportbot.Embed.Colours.General);
      await interaction.reply({ embeds: [CreatedTicket], ephemeral: true });

      // Create the ticket message
      const TicketMessage = new EmbedBuilder()
        .setAuthor({
          name: msgconfig.Ticket.TicketAuthorTitle.replace(/%ticketauthor%/g, interaction.user.id)
            .replace(/%ticketid%/g, ticketChannel.id)
            .replace(/%ticketusername%/g, interaction.user.username),
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle(
          msgconfig.Ticket.TicketTitle.replace(/%ticketauthor%/g, interaction.user.id)
            .replace(/%ticketid%/g, ticketChannel.id)
            .replace(/%ticketusername%/g, interaction.user.username)
        )
        .setDescription(
          msgconfig.Ticket.TicketMessage.replace(/%ticketauthor%/g, interaction.user.id)
            .replace(/%ticketid%/g, ticketChannel.id)
            .replace(/%ticketusername%/g, interaction.user.username)
            .replace(/%ticketreason%/g, TicketSubject)
        )
        .setColor(supportbot.Embed.Colours.General);

      // Add reason field if ticket reason is enabled
      if (supportbot.Ticket.TicketReason && TicketReason) {
        TicketMessage.addFields(
          { name: "Reason", value: TicketReason, inline: false }
        );
      }

      // Create the control panel
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

      const row2 = new ActionRowBuilder().addComponents(SelectMenus);

      // Send the ticket message and control panel
      await ticketChannel.send({
        embeds: [TicketMessage],
        components: [row2],
      });

      // Handle department selection if not specified
      if (!department) {
        try {
          const buttons = supportbot.Departments.map((x, index) =>
            new ButtonBuilder()
              .setCustomId("Department" + index)
              .setLabel(x.title)
              .setStyle(x.color)
              .setEmoji(x.emoji)
          );

          const row = new ActionRowBuilder().addComponents(buttons);

          const message = await ticketChannel.send({
            content: "Please select a department:",
            components: [row],
          });

          const filter = (i) => i.user.id === interaction.user.id;
          await message.awaitMessageComponent({
            filter,
            max: 1,
            componentType: "BUTTON",
            time: supportbot.Ticket.Timeout * 60000,
          });

        } catch (e) {
          if (e.code === "COLLECTOR_ERROR") {
            try {
              const ticket = TicketData.tickets.findIndex((t) => t.id === ticketChannel.id);
              TicketData.tickets[ticket].open = false;
              fs.writeFileSync(
                "./Data/TicketData.json",
                JSON.stringify(TicketData, null, 4),
                (err) => {
                  if (err) console.error(err);
                }
              );
              await interaction.user.send(
                "Your ticket has timed out. Please open a new one and select a department."
              );
            } catch (error) {
              console.error("An error occurred while handling collector:", error);
            }
            await ticketChannel.delete();
          }
        }
      }
    } catch (error) {
      console.error("Error in run method:", error);
    }
  },
});
