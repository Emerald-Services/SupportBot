const fs = require("fs");
const {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js");
const yaml = require("js-yaml");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.AddUser.Command,
  description: cmdconfig.AddUser.Description,
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "The user to add",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
  permissions: cmdconfig.AddUser.Permission,

  async run(interaction) {
    const userToAdd = interaction.options.getUser("user");
    const ticketChannel = interaction.channel;
    const ticketDataPath = "./Data/TicketData.json";

    if (
      (supportbot.Ticket.TicketType === "threads" && !ticketChannel.isThread()) ||
      (supportbot.Ticket.TicketType === "channels" && ticketChannel.type !== ChannelType.GuildText)
    ) {
      const onlyInTicket = new EmbedBuilder()
        .setTitle(msgconfig.AddUser.NotInTicket_Title)
        .setDescription(msgconfig.AddUser.NotInTicket_Description)
        .setColor(supportbot.Embed.Colours.Error);

      return interaction.reply({
        embeds: [onlyInTicket],
        ephemeral: true,
      });
    }

    const ticketInviteEmbed = new EmbedBuilder()
      .setTitle(msgconfig.AddUser.Invite_Title)
      .setDescription(msgconfig.AddUser.Invite_Description.replace("%username%", userToAdd.username))
      .setColor(supportbot.Embed.Colours.General);

    await interaction.reply({
      embeds: [ticketInviteEmbed],
      ephemeral: true,
    });

    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle(msgconfig.AddUser.DM_Title)
        .setDescription(msgconfig.AddUser.DM_Description.replace("%channelname%", ticketChannel.name))
        .setColor(supportbot.Embed.Colours.General);

      const acceptButton = new ButtonBuilder()
        .setCustomId("accept_invite")
        .setLabel(msgconfig.AddUser.Accept_Label)
        .setEmoji("✅")
        .setStyle(ButtonStyle.Primary);

      const rejectButton = new ButtonBuilder()
        .setCustomId("reject_invite")
        .setLabel(msgconfig.AddUser.Reject_Label)
        .setEmoji("❌")
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(acceptButton, rejectButton);

      const dmMessage = await userToAdd.send({
        embeds: [dmEmbed],
        components: [row],
      });

      const filter = (i) => i.user.id === userToAdd.id;
      const collector = dmMessage.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "accept_invite") {
          try {
            // Add user to thread or channel based on TicketType
            if (supportbot.Ticket.TicketType === "threads") {
              await ticketChannel.members.add(userToAdd.id); // For threads
            } else if (supportbot.Ticket.TicketType === "channels") {
              await ticketChannel.permissionOverwrites.create(userToAdd.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
              }); // For channels
            }

            const ticketData = JSON.parse(fs.readFileSync(ticketDataPath, "utf8"));
            const ticketIndex = ticketData.tickets.findIndex((t) => t.id === ticketChannel.id);
            if (ticketIndex !== -1) {
              ticketData.tickets[ticketIndex].subUsers.push(userToAdd.id);
              fs.writeFileSync(ticketDataPath, JSON.stringify(ticketData, null, 4));
            }

            const acceptedEmbed = new EmbedBuilder()
              .setTitle(msgconfig.AddUser.Accepted_Title)
              .setDescription(msgconfig.AddUser.Accepted_Message)
              .setColor(supportbot.Embed.Colours.Success);

            await i.update({
              embeds: [acceptedEmbed],
              components: [],
            });

            // Send the added user ticket message in the ticket channel

              const addeduserTicket = new EmbedBuilder()
                .setTitle(msgconfig.AddUser.Added_Title)
                .setDescription(msgconfig.AddUser.Added_Description.replace('%username%', userToAdd.username))
                .setColor(supportbot.Embed.Colours.General);

              await ticketChannel.send({
                embeds: [addeduserTicket],
              });


            const addedToTicketEmbed = new EmbedBuilder()
              .setTitle(msgconfig.AddUser.AddedToTicket_Title)
              .setDescription(msgconfig.AddUser.AddedToTicket_Description.replace(
                "%channel_link%",
                `[${ticketChannel.name}](https://discord.com/channels/${ticketChannel.guild.id}/${ticketChannel.id})`
              ))
              .setColor(supportbot.Embed.Colours.General);

            const ticketLinkButton = new ButtonBuilder()
              .setLabel(msgconfig.AddUser.ViewTicket_Label)
              .setURL(`https://discord.com/channels/${ticketChannel.guild.id}/${ticketChannel.id}`)
              .setStyle(ButtonStyle.Link);

            await userToAdd.send({
              embeds: [addedToTicketEmbed],
              components: [new ActionRowBuilder().addComponents(ticketLinkButton)],
            });

          } catch (err) {
            console.error("Error adding user to the ticket:", err);

            const errorEmbed = new EmbedBuilder()
              .setTitle(msgconfig.AddUser.Error_Title)
              .setDescription(msgconfig.AddUser.Error_Adding)
              .setColor(supportbot.Embed.Colours.Error);

            await i.update({
              embeds: [errorEmbed],
              components: [],
            });
          }
        } else {
          const declinedEmbed = new EmbedBuilder()
            .setTitle(msgconfig.AddUser.Declined_Title)
            .setDescription(msgconfig.AddUser.Declined_Message)
            .setColor(supportbot.Embed.Colours.Error);

          await i.update({
            embeds: [declinedEmbed],
            components: [],
          });
        }
      });

      collector.on("end", (collected) => {
        if (collected.size === 0) {
          userToAdd.send({
            embeds: [
              new EmbedBuilder()
                .setTitle(msgconfig.AddUser.NoResponse_Title)
                .setDescription(msgconfig.AddUser.NoResponse_Message)
                .setColor(supportbot.Embed.Colours.Warning),
            ],
          });
        }
      });
    } catch (error) {
      if (error.code === 50007) {
        const errorEmbed = new EmbedBuilder()
          .setTitle(msgconfig.AddUser.DM_Error_Title)
          .setDescription(msgconfig.AddUser.DM_Error_Description.replace("%username%", userToAdd.username))
          .setColor(supportbot.Embed.Colours.Error);

        await ticketChannel.send({
          embeds: [errorEmbed],
        });
      } else {
        console.error("Error sending DM:", error);

        const unexpectedErrorEmbed = new EmbedBuilder()
          .setTitle(msgconfig.AddUser.Unexpected_Error_Title)
          .setDescription(msgconfig.AddUser.Unexpected_Error_Description.replace("%error%", error.message))
          .setColor(supportbot.Embed.Colours.Error);

        await ticketChannel.send({
          embeds: [unexpectedErrorEmbed],
        });
      }
    }
  },
});
