const fs = require("fs");
const {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  MessageFlags,
} = require("discord.js");
const yaml = require("js-yaml");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../../Structures/Command.js");
const db = require("../../Structures/Database.js");

module.exports = new Command({
  name: cmdconfig.ForceAddUser.Command,
  description: cmdconfig.ForceAddUser.Description,
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "The user to forcefully add",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
  permissions: cmdconfig.ForceAddUser.Permission,

  async run(interaction) {
    const userToAdd = interaction.options.getUser("user");
    const ticketChannel = interaction.channel;

    if (
      (supportbot.Ticket.TicketType === "threads" && !ticketChannel.isThread()) ||
      (supportbot.Ticket.TicketType === "channels" && ticketChannel.type !== ChannelType.GuildText)
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
        const botMember = await ticketChannel.members.fetch(interaction.client.user.id).catch(() => null);
        if (!botMember) await ticketChannel.join();
        await new Promise(res => setTimeout(res, 1000));
        await ticketChannel.members.add(userToAdd.id);
      } else if (supportbot.Ticket.TicketType === "channels") {
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
          msgconfig.ForceAddUser.Added_Description.replace("%username%", userToAdd.username)
        )
        .setColor(supportbot.Embed.Colours.Success);

      await interaction.reply({
        embeds: [addedEmbed],
        flags: MessageFlags.Ephemeral,
      });

      const addedToTicketEmbed = new EmbedBuilder()
        .setTitle(msgconfig.ForceAddUser.AddedToTicket_Title)
        .setDescription(
          msgconfig.ForceAddUser.AddedToTicket_Description.replace(
            "%channel_link%",
            `[${ticketChannel.name}](https://discord.com/channels/${ticketChannel.guild.id}/${ticketChannel.id})`
          )
        )
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
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});
