// SupportBot | Emerald Services
// Remove user from a ticket 

const {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  MessageFlags,
} = require("discord.js");
const yaml = require("js-yaml");
const fs = require("fs");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const msgconfig   = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));
const cmdconfig   = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../../Structures/Command.js");
const db      = require("../../Structures/Database.js");

module.exports = new Command({
  name: cmdconfig.RemoveUser.Command,
  description: cmdconfig.RemoveUser.Description,
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "The user to remove",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
  permissions: cmdconfig.RemoveUser.Permission,

  async run(interaction) {
    const { getRole } = interaction.client;
    const SupportStaff = await getRole(supportbot.Roles.StaffMember.Staff, interaction.guild);
    const Admin        = await getRole(supportbot.Roles.StaffMember.Admin,  interaction.guild);

    if (!SupportStaff || !Admin) {
      return interaction.reply("Missing staff/admin roles in config.");
    }
    if (
      !interaction.member.roles.cache.has(SupportStaff.id) &&
      !interaction.member.roles.cache.has(Admin.id)
    ) {
      const NoPerms = new EmbedBuilder()
        .setTitle("Invalid Permissions!")
        .setDescription(
          `${msgconfig.Error.IncorrectPerms}\n\nRole Required: \`${supportbot.Roles.StaffMember.Staff}\` or \`${supportbot.Roles.StaffMember.Admin}\``
        )
        .setColor(supportbot.Embed.Colours.Warn);
      return interaction.reply({ embeds: [NoPerms], flags: MessageFlags.Ephemeral });
    }

    const userToRemove = interaction.options.getUser("user");
    const ticketChannel = interaction.channel;

    if (
      (supportbot.Ticket.TicketType === "threads" && !ticketChannel.isThread()) ||
      (supportbot.Ticket.TicketType === "channels" && ticketChannel.type !== ChannelType.GuildText)
    ) {
      const onlyInTicket = new EmbedBuilder()
        .setTitle(msgconfig.RemoveUser.NotInTicket_Title)
        .setDescription(msgconfig.RemoveUser.NotInTicket_Description)
        .setColor(supportbot.Embed.Colours.Error);
      return interaction.reply({ embeds: [onlyInTicket], flags: MessageFlags.Ephemeral });
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

      await interaction.reply({ embeds: [removedEmbed], flags: MessageFlags.Ephemeral });

      const removedFromTicketEmbed = new EmbedBuilder()
        .setTitle(msgconfig.RemoveUser.RemovedFromTicket_Title)
        .setDescription(
          msgconfig.RemoveUser.RemovedFromTicket_Description.replace(
            "%channel_link%",
            `[${ticketChannel.name}](https://discord.com/channels/${ticketChannel.guild.id}/${ticketChannel.id})`
          )
        )
        .setColor(supportbot.Embed.Colours.General);

      await userToRemove.send({ embeds: [removedFromTicketEmbed] }).catch(() => {});
    } catch (err) {
      console.error("Error removing user from the ticket:", err);

      const errorEmbed = new EmbedBuilder()
        .setTitle(msgconfig.RemoveUser.Error_Title)
        .setDescription(msgconfig.RemoveUser.Error_Removing)
        .setColor(supportbot.Embed.Colours.Error);

      await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
    }
  },
});
