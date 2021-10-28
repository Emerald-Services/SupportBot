// SupportBot | Emerald Services
// Interaction Create Event

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Event = require("../Structures/Event.js");

module.exports = new Event("interactionCreate", (client, interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.find(
      (cmd) => cmd.name.toLowerCase() == interaction.commandName
    );

    if (interaction.user.bot || !interaction.isCommand() || !interaction.guild)
      return;

    const NotValid = new Discord.MessageEmbed()
      .setDescription(`:x: \`Invalid Command\` `)
      .setColor(supportbot.ErrorColour);

    if (!command)
      return interaction.reply({
        embeds: [NotValid],
      });

    const permission = interaction.member.permissions.has(command.permission);

    const ValidPerms = new Discord.MessageEmbed()
      .setDescription(
        ":x: `Invalid Permissions` Do you have the correct permissions to execute this command?"
      )
      .setColor(supportbot.ErrorColour);

    if (!permission)
      return interaction.reply({
        embeds: [ValidPerms],
      });
    interaction.user = interaction.user;
    command.run(interaction);
  }
  if (interaction.isButton()) {
    if (interaction.customId === "openticket") {
      try {
        const cmd = client.commands.get(cmdconfig.OpenTicket);
        if (!cmd) return;
        cmd.run(interaction);
      } catch (error) {
        console.error(error);
      }
    }

    if (interaction.customId === "ticketclose") {
      if (interaction.channel.name.startsWith(`${supportbot.TicketPrefix}`)) {
        interaction.message.fetch();
        interaction.deferUpdate();
        const DeleteTicketEmbed = new Discord.MessageEmbed()
          .setDescription(supportbot.TicketDeleteMessage)
          .setColor(supportbot.EmbedColour);
        interaction.channel.send({ embeds: [DeleteTicketEmbed] });

        let logChannel =
          interaction.guild.channels.cache.find(
            (channel) => channel.name === supportbot.TranscriptLog
          ) ||
          interaction.guild.channels.cache.find(
            (channel) => channel.id === supportbot.TranscriptLog
          );

        let user = interaction.user;
        let name = interaction.channel.name;
        let ticketChannel = interaction.channel;
        let reason = "No Reason Provided.";

        interaction.channel
          .send({ content: `**${supportbot.ClosingTicket}**` })
          .then(() => {
            const logEmbed = new Discord.MessageEmbed()
              .setTitle(supportbot.TranscriptTitle)
              .setColor(supportbot.EmbedColour)
              .setFooter(supportbot.EmbedFooter)
              .addField("Closed By", user.username)
              .addField("Reason", reason);

            interaction.channel.messages.fetch({ limit: 100 }).then((msgs) => {
              let html = "";

              msgs = msgs.sort(
                (a, b) => a.createdTimestamp - b.createdTimestamp
              );
              html += `<style>* {background-color: #2c2f33;color: #fff;font-family: Arial, Helvetica, sans-serif;}</style>`;
              html += `<strong>Server Name:</strong> ${interaction.guild.name}<br>`;
              html += `<strong>Ticket:</strong> ${ticketChannel.name}<br>`;
              html += `<strong>Message:</strong> ${msgs.size} Messages<br><br><br>`;

              msgs.forEach((msg) => {
                if (msg.content) {
                  html += `<strong>User:</strong> ${msg.author.tag}<br>`;
                  html += `<strong>Message:</strong> ${msg.content}<br>`;
                  html += `-----<br><br>`;
                }
              });

              const TranscriptSavedEmbed = new Discord.MessageEmbed()
                .setDescription(supportbot.TranscriptSavedMessage)
                .setColor(supportbot.SuccessColour);
              interaction.channel.send({ embeds: [TranscriptSavedEmbed] });

              let file = new Discord.MessageAttachment(
                Buffer.from(html),
                `${name}.html`
              );
              logChannel.send({ embeds: [logEmbed], files: [file] });

              setTimeout(
                () => interaction.channel.delete(),
                supportbot.TicketDeleteTime
              );
            });
          });
      }
    }
    if (interaction.customId === "ticketlock") {
      if (interaction.channel.name.startsWith(`${supportbot.TicketPrefix}`)) {
        interaction.message.fetch();
        interaction.deferUpdate();
        let Admin =
          interaction.guild.roles.cache.find(
            (AdminUser) => AdminUser.name === supportbot.Admin
          ) ||
          interaction.guild.roles.cache.find(
            (AdminUser) => AdminUser.id === supportbot.Admin
          );
        let all = interaction.channel.permissionOverwrites.cache;

        let parent =
          interaction.guild.channels.cache.find(
            (c) => c.name === `${supportbot.LockTicketCategory}`
          ) ||
          interaction.guild.channels.cache.find(
            (c) => c.id === `${supportbot.LockTicketCategory}`
          );
        if (parent) {
          interaction.channel.setParent(parent.id);
        }

        all.forEach((perm) => {
          interaction.channel.permissionOverwrites.delete(perm.id);
        });
        interaction.channel.permissionOverwrites.create(Admin.id, {
          VIEW_CHANNEL: true,
        });

        interaction.channel.permissionOverwrites.create(interaction.guild.id, {
          VIEW_CHANNEL: false,
        });

        const ticketDeleteButton = new Discord.MessageButton()
          .setCustomId("ticketclose")
          .setLabel("Close")
          .setStyle(supportbot.TicketDeleteColour)
          .setEmoji(supportbot.TicketDeleteEmoji);

        const row = new Discord.MessageActionRow().addComponents(
          ticketDeleteButton
        );
        const ArchiveEmbed = new Discord.MessageEmbed()
          .setTitle("Archived")
          .setDescription(`Archived ${interaction.channel.name}`)
          .setColor(`${supportbot.SuccessColour}`);

        interaction.channel.send({ embeds: [ArchiveEmbed] });
        interaction.message.edit({ components: [row] });
      }
    }
  }
});
