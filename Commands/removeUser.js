// File path: Commands/RemoveUser.js

const fs = require("fs");
const {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const yaml = require("js-yaml");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");

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
    let SupportStaff = await getRole(supportbot.Roles.StaffMember.Staff, interaction.guild);
    let Admin = await getRole(supportbot.Roles.StaffMember.Admin, interaction.guild);
    if (!SupportStaff || !Admin)
    
      return interaction.reply(
        "Some roles seem to be missing!\nPlease check for errors when starting the bot."
      );

      const NoPerms = new EmbedBuilder()
      .setTitle("Invalid Permissions!")
      .setDescription(
        `${msgconfig.Error.IncorrectPerms}\n\nRole Required: \`${supportbot.Roles.StaffMember.Staff}\` or \`${supportbot.Roles.StaffMember.Admin}\``
      )
      .setColor(supportbot.Embed.Colours.Warn);

    if (
        !interaction.member.roles.cache.has(SupportStaff.id) &&
        !interaction.member.roles.cache.has(Admin.id)
    )
      return interaction.reply({ embeds: [NoPerms] });

    const userToRemove = interaction.options.getUser("user");
    const ticketChannel = interaction.channel;
    const ticketDataPath = "./Data/TicketData.json";

    // Check if the channel is a ticket thread
    if (!ticketChannel.isThread()) {
      const onlyInTicket = new EmbedBuilder()
        .setTitle(msgconfig.RemoveUser.NotInTicket_Title)
        .setDescription(msgconfig.RemoveUser.NotInTicket_Description)
        .setColor(supportbot.Embed.Colours.Error);

      return interaction.reply({
        embeds: [onlyInTicket],
        ephemeral: true,
      });
    }

    try {
      await ticketChannel.members.remove(userToRemove.id);

      const ticketData = JSON.parse(fs.readFileSync(ticketDataPath, "utf8"));
      const ticketIndex = ticketData.tickets.findIndex((t) => t.id === ticketChannel.id);
      if (ticketIndex !== -1) {
        const subUsers = ticketData.tickets[ticketIndex].subUsers;
        const userIndex = subUsers.indexOf(userToRemove.id);
        if (userIndex !== -1) {
          subUsers.splice(userIndex, 1);
          fs.writeFileSync(ticketDataPath, JSON.stringify(ticketData, null, 4));
        }
      }

      const removedEmbed = new EmbedBuilder()
        .setTitle(msgconfig.RemoveUser.Removed_Title)
        .setDescription(msgconfig.RemoveUser.Removed_Message)
        .setColor(supportbot.Embed.Colours.Success);

      await interaction.reply({
        embeds: [removedEmbed],
        ephemeral: true,
      });

      const removedFromTicketEmbed = new EmbedBuilder()
        .setTitle(msgconfig.RemoveUser.RemovedFromTicket_Title)
        .setDescription(msgconfig.RemoveUser.RemovedFromTicket_Description.replace(
          "%channel_link%",
          `[${ticketChannel.name}](https://discord.com/channels/${ticketChannel.guild.id}/${ticketChannel.id})`
        ))
        .setColor(supportbot.Embed.Colours.General);

      await userToRemove.send({
        embeds: [removedFromTicketEmbed],
      });

    } catch (err) {
      console.error("Error removing user from the ticket:", err);

      const errorEmbed = new EmbedBuilder()
        .setTitle(msgconfig.RemoveUser.Error_Title)
        .setDescription(msgconfig.RemoveUser.Error_Removing)
        .setColor(supportbot.Embed.Colours.Error);

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  },
});
