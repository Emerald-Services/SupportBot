const fs = require("fs");
const { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require("discord.js");
const yaml = require("js-yaml");
const db = require("../../Structures/Database.js");
const supportbot = require("../../Structures/ConfigStore").supportbot;
const cmdconfig = require("../../Structures/ConfigStore").commands;
const msgconfig = require("../../Structures/ConfigStore").messages;

const Command = require("../../Structures/Command.js");

// Function to chunk array into smaller arrays
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

module.exports = new Command({
  name: cmdconfig.Mod.Command,
  description: cmdconfig.Mod.Description || "Moderation commands",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: cmdconfig.Mod.TicketBlacklist.Command,
      description: cmdconfig.Mod.TicketBlacklist.Description || "Ticket Blacklist Commands",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: cmdconfig.Mod.TicketBlacklist.Add.Command,
          description: msgconfig.Mod.TicketBlacklist.Add.Description || "Add a user to the blacklist",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: 'user',
              description: 'The user to blacklist',
              type: ApplicationCommandOptionType.User,
              required: true
            },
            {
              name: 'reason',
              description: 'Reason for blacklisting',
              type: ApplicationCommandOptionType.String,
              required: false
            }
          ]
        },
        {
          name: cmdconfig.Mod.TicketBlacklist.Remove.Command,
          description: cmdconfig.Mod.TicketBlacklist.Remove.Description || "Remove a user from the blacklist",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: 'user',
              description: 'The user to remove from the blacklist',
              type: ApplicationCommandOptionType.User,
              required: true
            },
            {
              name: 'reason',
              description: 'Reason for unblacklisting',
              type: ApplicationCommandOptionType.String,
              required: false
            }
          ]
        },
        {
          name: "view",
          description: msgconfig.Mod.TicketBlacklist.View.Description || "View all blacklisted users",
          type: ApplicationCommandOptionType.Subcommand
        }
      ]
    }
  ],

  async run(interaction) {
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || "No reason provided"; 

    try {
      const blacklistedUsers = typeof db.getBlacklistedUsers === "function" ? db.getBlacklistedUsers() : [];

      if (subcommand === cmdconfig.Mod.TicketBlacklist.Add.Command) {
        if (db.isUserBlacklisted && db.isUserBlacklisted(user.id)) {
          const alreadyBlacklistedEmbed = new EmbedBuilder()
            .setDescription(msgconfig.Mod.TicketBlacklist.Add.AlreadyBlacklisted.replace("{userTag}", user.tag) || ":x: User is already blacklisted.")
            .setColor(supportbot.Embed.Colours.Warn);
          return interaction.reply({ embeds: [alreadyBlacklistedEmbed], flags: MessageFlags.Ephemeral  });
        }

        if (typeof db.addBlacklistedUser === "function") {
          db.addBlacklistedUser(user.id, reason, interaction.user.tag);
        }

        const successEmbed = new EmbedBuilder()
          .setDescription(msgconfig.Mod.TicketBlacklist.Add.Success.replace("{userTag}", user.tag) || ":white_check_mark: User has been blacklisted.")
          .setColor(supportbot.Embed.Colours.Success);

        const blacklistChannel = interaction.guild.channels.cache.get(supportbot.Ticket.Log.TicketBlacklistLog);
        if (blacklistChannel) {
          const blacklistLogEmbed = new EmbedBuilder()
            .setTitle(msgconfig.TicketBlacklistLog.Title || "Ticket Blacklist Log")
            .setColor(msgconfig.TicketBlacklistLog.Colour || supportbot.Embed.Colours.Success)
            .setFooter({ text: supportbot.Embed.Footer, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(`> **User:** ${user.tag} (\`${user.id}\`)\n> **Actioned by:** <@${interaction.user.id}>`)
            .addFields({ name: "Action", value: "\`\`\`Added to blacklist\`\`\`", inline: false })
            .addFields({ name: "Reason", value: `\`\`\`${reason}\`\`\``, inline: false });

          blacklistChannel.send({ embeds: [blacklistLogEmbed] });
        }

        return interaction.reply({
          embeds: [successEmbed],
          flags: MessageFlags.Ephemeral  
        });

      } else if (subcommand === cmdconfig.Mod.TicketBlacklist.Remove.Command) {
        if (db.isUserBlacklisted && !db.isUserBlacklisted(user.id)) {
          const notBlacklistedEmbed = new EmbedBuilder()
            .setDescription(msgconfig.Mod.TicketBlacklist.Remove.NotBlacklisted.replace("{userTag}", user.tag) || ":x: User is not blacklisted.")
            .setColor(supportbot.Embed.Colours.Warn);
          return interaction.reply({ embeds: [notBlacklistedEmbed], flags: MessageFlags.Ephemeral  });
        }

        if (typeof db.removeBlacklistedUser === "function") {
          db.removeBlacklistedUser(user.id);
        }

        const removedEmbed = new EmbedBuilder()
          .setDescription(msgconfig.Mod.TicketBlacklist.Remove.Success.replace("{userTag}", user.tag) || ":white_check_mark: User has been removed from the blacklist.")
          .setColor(supportbot.Embed.Colours.Success);

        const blacklistChannel = interaction.guild.channels.cache.get(supportbot.Ticket.Log.TicketBlacklistLog);
        if (blacklistChannel) {
          const blacklistLogEmbed = new EmbedBuilder()
            .setTitle(msgconfig.TicketBlacklistLog.Title || "Ticket Blacklist Log")
            .setColor(msgconfig.TicketBlacklistLog.Colour || supportbot.Embed.Colours.Success)
            .setFooter({ text: supportbot.Embed.Footer, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(`> **User:** ${user.tag} (\`${user.id}\`)\n> **Actioned by:** <@${interaction.user.id}>`)
            .addFields({ name: "Action", value: "\`\`\`Removed from blacklist\`\`\`", inline: false })
            .addFields({ name: "Reason", value: `\`\`\`${reason}\`\`\``, inline: false });

          blacklistChannel.send({ embeds: [blacklistLogEmbed] });
        }

        return interaction.reply({ embeds: [removedEmbed], flags: MessageFlags.Ephemeral  });

      } else if (subcommand === "view") {
        if (blacklistedUsers.length === 0) {
          const noBlacklistedUsersEmbed = new EmbedBuilder()
            .setDescription(msgconfig.Mod.TicketBlacklist.View.NoBlacklistedUsers || "No users are blacklisted.")
            .setColor(supportbot.Embed.Colours.Success);
          return interaction.reply({ embeds: [noBlacklistedUsersEmbed], flags: MessageFlags.Ephemeral  });
        }

        const chunkedUsers = chunkArray(blacklistedUsers, 5);
        let currentPage = 0;

        const createEmbed = (page) => {
          return new EmbedBuilder()
            .setTitle(msgconfig.Mod.TicketBlacklist.View.EmbedTitle || "Blacklisted Users")
            .setDescription(chunkedUsers[page].map(id => `<@${id}>`).join("\n"))
            .setColor(supportbot.Embed.Colours.Success)
            .setFooter({ text: `Page ${page + 1} of ${chunkedUsers.length}` });
        };

        const buttons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('previous')
              .setLabel('Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === 0),
            new ButtonBuilder()
              .setCustomId('next')
              .setLabel('Next')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === chunkedUsers.length - 1)
          );

        const response = await interaction.reply({
          embeds: [createEmbed(currentPage)],
          components: chunkedUsers.length > 1 ? [buttons] : [],
          flags: MessageFlags.Ephemeral 
        });

        if (chunkedUsers.length <= 1) return;

        const collector = response.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 60000 
        });

        collector.on('collect', async (i) => {
          if (i.user.id !== interaction.user.id) {
            return i.reply({
              content: 'You cannot use these buttons.',
              flags: MessageFlags.Ephemeral 
            });
          }

          if (i.customId === 'previous' && currentPage > 0) {
            currentPage--;
          } else if (i.customId === 'next' && currentPage < chunkedUsers.length - 1) {
            currentPage++;
          }

          buttons.components[0].setDisabled(currentPage === 0);
          buttons.components[1].setDisabled(currentPage === chunkedUsers.length - 1);

          await i.update({
            embeds: [createEmbed(currentPage)],
            components: [buttons]
          });
        });

        collector.on('end', () => {
          buttons.components.forEach(button => button.setDisabled(true));
          interaction.editReply({
            components: [buttons]
          }).catch(() => {});
        });
      }
    } catch (error) {
      console.error("Error in mod command:", error);
      const errorEmbed = new EmbedBuilder()
        .setDescription(msgconfig.Error.ActionFailed || "An error occurred while processing your request.")
        .setColor(supportbot.Embed.Colours.Warn);
      interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral  });
    }
  }
});