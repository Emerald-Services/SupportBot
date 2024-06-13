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
  GuildMemberRoleManager,
} = require("discord.js");
const yaml = require("js-yaml");

const panelconfig = yaml.load(fs.readFileSync("./Configs/ticket-panel.yml", "utf8"));
const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

const Command = require("../Structures/Command.js");
const TicketNumberID = require("../Structures/TicketID.js");

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
    let department = interaction.customId?.split("-")[1] || null;
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
    const TicketSubject = interaction.options?.getString("reason") || msgconfig.Ticket.InvalidSubject;

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

    if (supportbot.Ticket.ClaimTickets.Enabled === false) {
      const InvStaff = await ticketChannel.send(`<@&${Staff.id}> <@&${Admin.id}>`)

      setTimeout(() => {
        InvStaff.delete();
      }, 2000)
    }

    // TICKET CLAIMING SYSTEM [START]

    if (supportbot.Ticket.ClaimTickets.Enabled) {
      const InvStaff1 = await ticketChannel.send(`<@&${Admin.id}>`)

      setTimeout(() => {
        InvStaff1.delete();
      }, 2000)
     
      const claimChannel = await getChannel(
        supportbot.Ticket.ClaimTickets.Channel,
        interaction.guild
      );

      const claimEmbed = new EmbedBuilder()
      .setTitle(msgconfig.Ticket.ClaimTickets.ClaimTitle)
      .setDescription(msgconfig.Ticket.ClaimTickets.ClaimMessage
        .replace('%user%', interaction.user.id)
      )
      .setColor(supportbot.Embed.Colours.General);

      const claimButton = new ButtonBuilder()
      .setCustomId(`claimticket-${ticketChannel.id}`)
      .setLabel(supportbot.Ticket.ClaimTickets.ButtonTitle)
      .setStyle(supportbot.Ticket.ClaimTickets.Button);

      const row = new ActionRowBuilder().addComponents(claimButton);

      await claimChannel.send({ 
        content: `<@&${Staff.id}>`,
        embeds: [claimEmbed], 
        components: [row] 
      });

    }     

    // TICKET CLAIMING SYSTEM [END]    

    if (!department) {
      await ticketChannel.members.add(interaction.user.id);
    }

    TicketData.tickets.push({
      id: ticketChannel.id,
      name: ticketChannel.name,
      user: interaction.user.id,
      number: ticketNumberID,
      reason: TicketSubject,
      open: true,
      subUsers: [],
      createdAt: new Date().toISOString(),
      claimedAt: null, // Will be updated when claimed
    });

    fs.writeFileSync(
      "./Data/TicketData.json",
      JSON.stringify(TicketData, null, 4),
      (err) => {
        if (err) console.error(err);
      }
    );

    const CreatedTicket = new EmbedBuilder()
      .setDescription(
        msgconfig.Ticket.TicketCreatedAlert.replace(/%ticketauthor%/g, interaction.user.id)
          .replace(/%ticketid%/g, ticketChannel.id)
          .replace(/%ticketusername%/g, interaction.user.username)
      )
      .setColor(supportbot.Embed.Colours.General);
    await interaction.reply({ embeds: [CreatedTicket], ephemeral: true });

    if (supportbot.Ticket.AllowMentions) {
      await ticketChannel.send(`${interaction.user}`);
    }

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
      )
      .setColor(supportbot.Embed.Colours.General);

    const SelectMenus = new StringSelectMenuBuilder()
      .setCustomId("ticketcontrolpanel")
      .setPlaceholder("Ticket Control Panel")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Add User")
          .setDescription("Add a user to the ticket.")
          .setEmoji(supportbot.SelectMenus.Tickets.AddUserEmoji)
          .setValue("ticketadduser"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Remove User")
          .setDescription("Remove a user from the ticket.")
          .setEmoji(supportbot.SelectMenus.Tickets.RemoveUserEmoji)
          .setValue("ticketremoveuser"),
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

    if (!department) {
      try {
        let buttons = supportbot.Departments.map((x) =>
          new ButtonBuilder()
            .setCustomId("Department" + supportbot.Departments.indexOf(x))
            .setLabel(x.title)
            .setStyle(x.color)
            .setEmoji(x.emoji)
        );

        if (supportbot.Ticket.AllowMentions) {
          await ticketChannel.send("<@&" + supportbot.Ticket.RoleMention + ">");
        }

        const row = new ActionRowBuilder().addComponents(buttons);
        const m = await ticketChannel.send({
          embeds: [TicketMessage],
          components: [row2],
        });

        try {
          const filter = (i) => i.user.id === interaction.user.id;
          await m.awaitMessageComponent({
            filter,
            max: 1,
            componentType: "BUTTON",
            time: supportbot.Ticket.Timeout * 60000,
          });
        } catch (e) {
          if (e.code === "COLLECTOR_ERROR") {
            try {
              let ticket = TicketData.tickets.findIndex((t) => t.id === ticketChannel.id);
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
            } catch (error) {
              console.error("An error occurred while handling collector:", error);
            }
            return await ticketChannel.delete();
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    } else {
      await ticketChannel.send({
        embeds: [TicketMessage],
        components: [row2],
      });

    }
    
  },
});
