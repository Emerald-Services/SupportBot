const fs = require("fs");
const {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
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
      description: "The user to forcefully add",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
  permissions: cmdconfig.ForceAddUser.Permission,

  async run(interaction) {
    const userToAdd = interaction.options.getUser("user");
    const ticketChannel = interaction.channel;
    const ticketDataPath = "./Data/TicketData.json";

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
        ephemeral: true,
      });
    }

    try {

      if (supportbot.Ticket.TicketType === "threads") {
        try {
            // Explicitly ensure the bot is in the thread
            const botMember = await ticketChannel.members.fetch(interaction.client.user.id).catch(() => null);
            if (!botMember) {
                await ticketChannel.join();
            }
    
            // Delay to ensure API has processed the bot's membership
            await new Promise(res => setTimeout(res, 1000));
    
            // Attempt to add the user to the thread
            await ticketChannel.members.add(userToAdd.id);
    
            console.log("User successfully added to the thread.");
        } catch (err) {
            console.error("Error adding user to the thread:", err.message);
            const errorEmbed = new EmbedBuilder()
                .setTitle(msgconfig.ForceAddUser.Error_Title)
                .setDescription(`An error occurred: ${err.message}`)
                .setColor(supportbot.Embed.Colours.Error);
    
            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }

      } else if (supportbot.Ticket.TicketType === "channels") {
        await ticketChannel.permissionOverwrites.create(userToAdd.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        }); 
      }

      const ticketData = JSON.parse(fs.readFileSync(ticketDataPath, "utf8"));
      const ticketIndex = ticketData.tickets.findIndex((t) => t.id === ticketChannel.id);
      if (ticketIndex !== -1) {
        ticketData.tickets[ticketIndex].subUsers.push(userToAdd.id);
        fs.writeFileSync(ticketDataPath, JSON.stringify(ticketData, null, 4));
      }

      const addedEmbed = new EmbedBuilder()
        .setTitle(msgconfig.ForceAddUser.Added_Title)
        .setDescription(
          msgconfig.ForceAddUser.Added_Description.replace("%username%", userToAdd.username)
        )
        .setColor(supportbot.Embed.Colours.Success);

      await interaction.reply({
        embeds: [addedEmbed],
        ephemeral: true,
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
        ephemeral: true,
      });
    }
  },
});
