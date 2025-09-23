const Discord = require("discord.js");
const fs      = require("fs");
const yaml    = require("js-yaml");

const supportbot  = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const msgconfig   = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));
const cmdconfig   = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const SuggestionDB = require("../../Structures/Database.js");
const Command     = require("../../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.SuggestionAdmin.Command,
  description: cmdconfig.SuggestionAdmin.Description,
  type: Discord.ApplicationCommandType.ChatInput,
  permissions: cmdconfig.SuggestionAdmin.Permission,
  options: [
    {
      name: "status",
      description: "New status",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Solved",      value: "Solved" },
        { name: "Denied",      value: "Denied" },
        { name: "Considering", value: "Considering" }
      ]
    },
    {
      name: "id",
      description: "Message ID (required in Channel mode)",
      type: Discord.ApplicationCommandOptionType.String,
      required: false
    }
  ],

  async run(interaction) {
    const status   = interaction.options.getString("status");
    const idOption = interaction.options.getString("id");
    const mode     = supportbot.Suggestions.Mode || "Channel";

    const { getRole } = interaction.client;
    const staffRole = await getRole(supportbot.Roles.StaffMember.Staff, interaction.guild);
    const adminRole = await getRole(supportbot.Roles.StaffMember.Admin, interaction.guild);
    if (
      !interaction.member.roles.cache.has(staffRole?.id) &&
      !interaction.member.roles.cache.has(adminRole?.id)
    ) {
      return interaction.reply({
        embeds: [
          new Discord.EmbedBuilder()
            .setTitle("Invalid Permissions!")
            .setDescription(
              `${msgconfig.Error.IncorrectPerms}\nRequired: ${supportbot.Roles.StaffMember.Staff} or ${supportbot.Roles.StaffMember.Admin}`
            )
            .setColor(supportbot.Embed.Colours.Warn)
        ],
        flags: Discord.MessageFlags.Ephemeral,
      });
    }

    if (mode === "Forum") {
      const thread = interaction.channel;
      if (!thread.isThread() || thread.parentId !== supportbot.Suggestions.ForumChannel) {
        return interaction.reply({
          embeds: [
            new Discord.EmbedBuilder()
              .setTitle("Not a Suggestion Thread")
              .setDescription(msgconfig.Error.MissingChannel)
              .setColor(supportbot.Embed.Colours.Error)
          ],
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      const tagMap = {
        Solved:      supportbot.Suggestions.Tags.Solved,
        Denied:      supportbot.Suggestions.Tags.Denied,
        Considering: supportbot.Suggestions.Tags.Considering
      };
      const tagId = tagMap[status];
      if (!tagId) {
        return interaction.reply({
          embeds: [
            new Discord.EmbedBuilder()
              .setTitle("Tag Missing")
              .setDescription("No forum tag configured for this status.")
              .setColor(supportbot.Embed.Colours.Error)
          ],
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      await thread.setAppliedTags([tagId]).catch(() => null);
      SuggestionDB.setStatus(thread.id, status);

      return interaction.reply({
        embeds: [
          new Discord.EmbedBuilder()
            .setTitle("Suggestion Updated")
            .setDescription(`Status set to **${status}**.`)
            .setColor(supportbot.Embed.Colours.Success)
        ],
        flags: Discord.MessageFlags.Ephemeral,
      });
    }

    if (!idOption) {
      return interaction.reply({
        embeds: [
          new Discord.EmbedBuilder()
            .setTitle("Message ID Required")
            .setDescription("Provide the suggestion’s message ID when in Channel mode.")
            .setColor(supportbot.Embed.Colours.Error)
        ],
        flags: Discord.MessageFlags.Ephemeral,
      });
    }

    const channel = await interaction.guild.channels
      .fetch(supportbot.Suggestions.Channel)
      .catch(() => null);
    if (!channel) {
      return interaction.reply({
        embeds: [
          new Discord.EmbedBuilder()
            .setTitle("Missing Suggestion Channel")
            .setDescription(msgconfig.Error.MissingChannel)
            .setColor(supportbot.Embed.Colours.Error)
        ],
        flags: Discord.MessageFlags.Ephemeral,
      });
    }

    const targetMsg = await channel.messages.fetch(idOption).catch(() => null);
    if (!targetMsg) {
      return interaction.reply({
        embeds: [
          new Discord.EmbedBuilder()
            .setTitle("Message Not Found")
            .setDescription("Could not fetch a suggestion with that ID.")
            .setColor(supportbot.Embed.Colours.Error)
        ],
        flags: Discord.MessageFlags.Ephemeral,
      });
    }

    const oldEmbed = targetMsg.embeds[0];
    if (!oldEmbed) {
      return interaction.reply({
        embeds: [
          new Discord.EmbedBuilder()
            .setTitle("No Embed Found")
            .setDescription("The target message has no suggestion embed.")
            .setColor(supportbot.Embed.Colours.Error)
        ],
        flags: Discord.MessageFlags.Ephemeral,
      });
    }

    const colorMap = {
      Solved:      supportbot.Embed.Colours.Success,
      Denied:      supportbot.Embed.Colours.Error,
      Considering: supportbot.Embed.Colours.Warn
    };

    const newEmbed = Discord.EmbedBuilder.from(oldEmbed)
      .setColor(colorMap[status])
      .addFields({ name: "Status", value: status, inline: true });

    await targetMsg.edit({ embeds: [newEmbed], components: targetMsg.components });
    SuggestionDB.setStatus(idOption, status);

    return interaction.reply({
      embeds: [
        new Discord.EmbedBuilder()
          .setTitle("Suggestion Updated")
          .setDescription(`Suggestion **${idOption}** marked as **${status}**.`)
          .setColor(supportbot.Embed.Colours.Success)
      ],
      flags: Discord.MessageFlags.Ephemeral,
    });
  }
});
