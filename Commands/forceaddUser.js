// File: Commands/ForceAddUser.js
const fs = require("fs");
const {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
} = require("discord.js");
const yaml = require("js-yaml");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.ForceAddUser.Command,
  description: cmdconfig.ForceAddUser.Description,
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "The user to add",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
  permissions: cmdconfig.ForceAddUser.Permission,

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

    const userToAdd = interaction.options.getUser("user");
    const ticketChannel = interaction.channel;
    const ticketDataPath = "./Data/TicketData.json";

    if (!ticketChannel.isThread()) {
      const onlyInTicket = new EmbedBuilder()
        .setTitle(msgconfig.ForceAddUser.NotInTicket_Title)
        .setDescription(msgconfig.ForceAddUser.NotInTicket_Description)
        .setColor(supportbot.Embed.Colours.Error);

      return interaction.reply({
        embeds: [onlyInTicket],
        ephemeral: true,
      });
    }

    try {
      await ticketChannel.members.add(userToAdd.id);

      const ticketData = JSON.parse(fs.readFileSync(ticketDataPath, "utf8"));
      const ticketIndex = ticketData.tickets.findIndex((t) => t.id === ticketChannel.id);
      if (ticketIndex !== -1) {
        ticketData.tickets[ticketIndex].subUsers.push(userToAdd.id);
        fs.writeFileSync(ticketDataPath, JSON.stringify(ticketData, null, 4));
      }

      const addedEmbed = new EmbedBuilder()
        .setTitle(msgconfig.ForceAddUser.Added_Title)
        .setDescription(msgconfig.ForceAddUser.Added_Description.replace(
          "%username%",
          userToAdd.username
        ))
        .setColor(supportbot.Embed.Colours.Success);

      await interaction.reply({
        embeds: [addedEmbed],
        ephemeral: true,
      });

      const addedToTicketEmbed = new EmbedBuilder()
        .setTitle(msgconfig.ForceAddUser.AddedToTicket_Title)
        .setDescription(msgconfig.ForceAddUser.AddedToTicket_Description.replace(
          "%channel_link%",
          `[${ticketChannel.name}](https://discord.com/channels/${ticketChannel.guild.id}/${ticketChannel.id})`
        ))
        .setColor(supportbot.Embed.Colours.General);

      await userToAdd.send({
        embeds: [addedToTicketEmbed],
      });

    } catch (err) {
      console.error("Error adding user to the ticket:", err);

      const errorEmbed = new EmbedBuilder()
        .setTitle(msgconfig.ForceAddUser.Error_Title)
        .setDescription(msgconfig.ForceAddUser.Error_Adding)
        .setColor(supportbot.Embed.Colours.Error);

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  },
});
