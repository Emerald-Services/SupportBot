// SupportBot | Emerald Services
// Close Ticket Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");

const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);

const cmdconfig = yaml.load(
  fs.readFileSync("./Configs/commands.yml", "utf8")
);

const msgconfig = yaml.load(
  fs.readFileSync("./Configs/messages.yml", "utf8")
);

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.CloseTicket.Command,
  description: cmdconfig.CloseTicket.Description,
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "reason",
      description: "Ticket Close Reason",
      type: Discord.ApplicationCommandOptionType.String,
    },
  ],
  permissions: cmdconfig.CloseTicket.Permission,

  async run(interaction) {
    let disableCommand = true;

    const { getRole, getChannel } = interaction.client;
    if (supportbot.Ticket.Close.StaffOnly) {
      let SupportStaff = await getRole(supportbot.Roles.StaffMember.Staff, interaction.guild);
      let Admin = await getRole(supportbot.Roles.StaffMember.Admin, interaction.guild);
      if (!SupportStaff || !Admin)
        return interaction.reply(
          "Some roles seem to be missing!\nPlease check for errors when starting the bot."
        );

    const NoPerms = new Discord.EmbedBuilder()
      .setTitle("Invalid Permissions!")
      .setDescription(
        `${supportbot.IncorrectPerms}\n\nRole Required: \`${supportbot.Roles.StaffMember.Staff}\` or \`${supportbot.Roles.StaffMember.Admin}\``
      )
      .setColor(supportbot.Embed.Colours.Warn);


      if (
        !interaction.member.roles.cache.has(SupportStaff.id) &&
        !interaction.member.roles.cache.has(Admin.id)
      )
        return interaction.reply({ embeds: [NoPerms] });
    }
    await interaction.deferReply();
    let tickets = await JSON.parse(
      fs.readFileSync("./Data/TicketData.json", "utf8")
    );
    let TicketData = await tickets.tickets.findIndex(
      (t) => t.id === interaction.channel.id
    );
    let ticket = tickets.tickets[TicketData];
    if (TicketData === -1) {
      const Exists = new Discord.EmbedBuilder()
        .setTitle("No Ticket Found!")
        .setDescription(msgconfig.Error.NoValidTicket)
        .setColor(supportbot.Embed.Colours.Warn);
      return interaction.followUp({ embeds: [Exists] });
    }
    let tUser = interaction.client.users.cache.get(ticket.user);
    let transcriptChannel = await getChannel(
      supportbot.Ticket.Log.TranscriptLog,
      interaction.guild
    );
    let logChannel = await getChannel(supportbot.Log.TicketLog, interaction.guild);
    let reason =
      (await interaction.options?.getString("reason")) || "No Reason Provided.";

    if (!transcriptChannel || !logChannel)
      return interaction.followUp("Some Channels seem to be missing!");
    if (supportbot.Ticket.Close.CloseConfirmation) {
      const CloseTicketRequest = new Discord.EmbedBuilder()
        .setTitle(`**${supportbot.ClosingTicket}**`)
        .setDescription(
          `Please confirm by repeating the following word.. \`${supportbot.Ticket.Close.ClosingConfirmation_Word}\` `
        )
        .setColor(supportbot.Embed.Colours.General);
      await interaction.followUp({ embeds: [CloseTicketRequest] });
      let filter = (m) =>
        m.content.toLowerCase() === supportbot.Ticket.Close.ClosingConfirmation_Word &&
        m.author.id === interaction.user.id;
      await interaction.channel.awaitMessages({
        filter,
        max: 1,
        time: 20000,
        errors: ["time"],
      });
    }
    try {
      tickets.tickets[TicketData].open = false;
      fs.writeFileSync(
        "./Data/TicketData.json",
        JSON.stringify(tickets, null, 4),
        (err) => {
          if (err) console.error(err);
        }
      );
      await interaction.followUp(`**${msgconfig.Ticket.ClosingTicket}**`);
      const transcriptEmbed = new Discord.EmbedBuilder()
        .setTitle(supportbot.Ticket.Log.TranscriptTitle)
        .setColor(supportbot.Embed.Colours.General)
        .setFooter({
          text: supportbot.Embed.Footer,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .addField(
          "Ticket",
          `${interaction.channel.name} (${interaction.channel.id})`
        )
        .addField(
          "User",
          `${tUser?.username || "N/A"}#${tUser?.discriminator || "N/A"} (${
            tUser?.id || ticket.user
          })`
        )
        .addField("Closed By", interaction.user.tag)
        .addField("Reason", reason);
      const logEmbed = new Discord.EmbedBuilder()
        .setTitle(supportbot.Ticket.Log.TicketLog_Title)
        .setColor(supportbot.Embed.Colours.General)
        .setFooter({
          text: supportbot.Embed.Footer,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .addField(
          "Ticket",
          `${interaction.channel.name} (${interaction.channel.id})`
        )
        .addField(
          "User",
          `${tUser?.username || "N/A"}#${tUser?.discriminator || "N/A"} (${
            tUser?.id || ticket.user
          })`
        )
        .addField("Closed By", interaction.user.tag)
        .addField("Reason", reason);
      let msgs = await interaction.channel.messages.fetch({ limit: 100 });
      let html = "";

      msgs = msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
      html += `<style>* {background-color: #2c2f33;color: #fff;font-family: Arial, Helvetica, sans-serif;}</style>`;
      html += `<strong>Server Name:</strong> ${interaction.guild.name}<br>`;
      html += `<strong>Ticket:</strong> ${interaction.channel.name}<br>`;
      html += `<strong>Message:</strong> ${msgs.size} Messages<br><br><br>`;

      await msgs.forEach((msg) => {
        if (msg.content) {
          html += `<strong>User:</strong> ${msg.author.tag}<br>`;
          html += `<strong>Message:</strong> ${msg.content}<br>`;
          html += `-----<br><br>`;
        }
      });
      if (!(supportbot.Ticket.Log.DisableTicketLogChannel)) {
        await logChannel.send({ embeds: [logEmbed] }).catch((err) => {
          console.error(err);
        });
      }
      let file = new Discord.MessageAttachment(
        Buffer.from(html),
        `${interaction.channel.name}.html`
      );
      await transcriptChannel
        .send({ embeds: [transcriptEmbed], files: [file] })
        .catch(async (err) => {
          console.error(err);
        });

      if (supportbot.Ticket.DMTranscripts) {

        await tUser
        ?.send({ embeds: [transcriptEmbed], files: [file] })
        .catch(async (err) => {
          console.error(err);
        });
      if (ticket.subUsers) {
        ticket.subUsers.forEach(async (subUser) => {
          await interaction.client.users.cache
            .get(subUser)
            ?.send({ embeds: [transcriptEmbed], files: [file] });
        });
      }

      }

      await interaction.channel.delete().catch(async (error) => {
        console.error(error);
        if (error.code !== Discord.Constants.APIErrors.UNKNOWN_CHANNEL) {
          console.error("Failed to delete the interaction:", error);
        }
      });
    } catch (error) {
      console.error(error);
    }
  },
});
