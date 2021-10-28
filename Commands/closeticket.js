// SupportBot | Emerald Services
// Close Ticket Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");
const TicketNumberID = require("../Structures/TicketID.js");

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

module.exports = new Command({
  name: cmdconfig.CloseTicket,
  description: cmdconfig.CloseTicketDesc,
  slashCommandOptions: [
    {
      name: "reason",
      description: "Ticket Close Reason",
      type: "STRING",
    },
  ],
  permission: "SEND_MESSAGES",

  async run(interaction) {
    if (!interaction.channel.name.startsWith(`${supportbot.TicketChannel}-`)) {
      const Exists = new Discord.MessageEmbed()
        .setTitle("No Ticket Found!")
        .setDescription(`${supportbot.NoValidTicket}`)
        .setColor(supportbot.WarningColour);
      return interaction.reply({ embed: Exists });
    }

    if (supportbot.CloseConfirmation) {
      const CloseTicketRequest = new Discord.MessageEmbed()
        .setTitle(`**${supportbot.ClosingTicket}**`)
        .setDescription(
          `Please confirm by repeating the following word.. \`${supportbot.ClosingConfirmation_Word}\` `
        )
        .setColor(supportbot.EmbedColour);

      interaction
        .reply(CloseTicketRequest)
        .then((m) => {
          interaction.channel
            .awaitMessages(
              (response) =>
                response.content.toLowerCase() ===
                supportbot.ClosingConfirmation_Word,
              {
                max: 1,
                time: 20000,
                errors: ["time"],
              }
            )
            .then((collected) => {
              let logChannel =
                interaction.guild.channels.cache.find(
                  (channel) => channel.name === supportbot.TranscriptLog
                ) ||
                interaction.guild.channels.cache.find(
                  (channel) => channel.id === supportbot.TranscriptLog
                );
              let user = interaction.user;
              let reason =
                interaction.options.getString("reason") ||
                "No Reason Provided.";

              let name = interaction.channel.name;
              let ticketChannel = interaction.channel;

              interaction
                .reply(`**${supportbot.ClosingTicket}**`)

                .then(() => {
                  const logEmbed = new Discord.MessageEmbed()
                    .setTitle(supportbot.TranscriptTitle)
                    .setColor(supportbot.EmbedColour)
                    .setFooter(supportbot.EmbedFooter)
                    .addField("Closed By", interaction.user.tag)
                    .addField("Reason", reason);

                  interaction.channel.interactions
                    .fetch({ limit: 100 })
                    .then((msgs) => {
                      let html = "";

                      msgs = msgs.sort(
                        (a, b) => a.createdTimestamp - b.createdTimestamp
                      );
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

                      logChannel.send({ embeds: [logEmbed] }).catch((err) => {
                        interaction.reply(err);
                      });

                      let file = new Discord.MessageAttachment(
                        Buffer.from(html),
                        `${name}.html`
                      );
                      logChannel
                        .send({ embeds: [logEmbed], files: [file] })
                        .catch((err) => {
                          interaction.reply(err);
                        });

                      interaction.channel.delete().catch((error) => {
                        if (
                          error.code !==
                          Discord.Constants.APIErrors.UNKNOWN_CHANNEL
                        ) {
                          console.error(
                            "Failed to delete the interaction:",
                            error
                          );
                        }
                      });
                    });
                });
            });
        })
        .catch(() => {
          interaction
            .followUp({
              content: "The request to close the ticket has timed out.",
            })
            .then((m2) => setTimeout(() => interaction.channel.delete(3000)));
        });
    }

    if (!supportbot.CloseConfirmation) {
      let logChannel =
        interaction.guild.channels.cache.find(
          (channel) => channel.name === supportbot.TranscriptLog
        ) ||
        interaction.guild.channels.cache.find(
          (channel) => channel.id === supportbot.TranscriptLog
        );
      let user = interaction.user;
      let reason =
        (await interaction.options.getString("reason")) ||
        "No Reason Provided.";

      let name = interaction.channel.name;
      let ticketChannel = interaction.channel;

      interaction
        .reply(`**${supportbot.ClosingTicket}**`)

        .then(() => {
          const logEmbed = new Discord.MessageEmbed()
            .setTitle(supportbot.TranscriptTitle)
            .setColor(supportbot.EmbedColour)
            .setFooter(supportbot.EmbedFooter)
            .addField("Closed By", interaction.user.tag)
            .addField("Reason", reason);

          interaction.channel.interactions
            .fetch({ limit: 100 })
            .then((msgs) => {
              let html = "";

              msgs = msgs.sort(
                (a, b) => a.createdTimestamp - b.createdTimestamp
              );
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

              logChannel.send({ embeds: [logEmbed] }).catch((err) => {
                interaction.reply(err);
              });

              let file = new Discord.MessageAttachment(
                Buffer.from(html),
                `${name}.html`
              );
              logChannel
                .send({ embeds: [logEmbed], files: [file] })
                .catch((err) => {
                  interaction.reply(err);
                });

              interaction.channel.delete().catch((error) => {
                if (
                  error.code !== Discord.Constants.APIErrors.UNKNOWN_CHANNEL
                ) {
                  console.error("Failed to delete the interaction:", error);
                }
              });
            });
        })
        .catch(() => {
          interaction
            .followUp({
              content: "The request to close the ticket has timed out.",
            })
            .then((m2) => setTimeout(() => interaction.channel.delete(3000)));
        });
    }
  },
});
