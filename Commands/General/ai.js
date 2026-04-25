// SupportBot | Emerald Services
// AI Command (Consolidated)

const fs = require("fs");
const { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, MessageFlags } = require("discord.js");
const yaml = require("js-yaml");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const supportbotai = yaml.load(fs.readFileSync("./Configs/supportbot-ai.yml", "utf8"));

const Command = require("../../Structures/Command.js");
const AIDatabase = require("../../Structures/AIDatabase.js");

module.exports = new Command({
  name: cmdconfig.AI?.Command || "ai",
  description: cmdconfig.AI?.Description || "Manage SupportBot AI settings and memory.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: cmdconfig.AI?.Train?.Command || "train",
      description: cmdconfig.AI?.Train?.Description || "Train the AI by adding knowledge to its database.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "content",
          description: "The text/knowledge you want the bot to learn",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: cmdconfig.AI?.Knowledge?.Command || "knowledge",
      description: cmdconfig.AI?.Knowledge?.Description || "Manage the AI knowledge base.",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: cmdconfig.AI?.Knowledge?.Clear?.Command || "clear",
          description: cmdconfig.AI?.Knowledge?.Clear?.Description || "Clear all trained knowledge from the AI.",
          type: ApplicationCommandOptionType.Subcommand,
        },
      ],
    },
    {
      name: cmdconfig.AI?.Memory?.Command || "memory",
      description: cmdconfig.AI?.Memory?.Description || "Manage the AI conversational memory.",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: cmdconfig.AI?.Memory?.Clear?.Command || "clear",
          description: cmdconfig.AI?.Memory?.Clear?.Description || "Clear recent conversation memory for this channel.",
          type: ApplicationCommandOptionType.Subcommand,
        },
      ],
    },
  ],
  permissions: cmdconfig.AI?.Permission || ["Administrator"],

  async run(interaction) {
    if (!supportbotai.Enabled) {
      return interaction.reply({
        content: "SupportBot AI is currently disabled.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand(false);

    try {
      if (subcommand === "train" || subcommand === cmdconfig.AI?.Train?.Command) {
        const content = interaction.options.getString("content");

        AIDatabase.addKnowledge({
          sourceType: "user_command",
          sourceName: interaction.user.tag,
          title: "Trained Knowledge",
          content: content,
        });

        const SuccessEmbed = new EmbedBuilder()
          .setDescription(`✅ **Knowledge Added!**\n\nThe AI has learned the following information:\n\`\`\`${content}\`\`\``)
          .setColor(supportbot.Embed.Colours.Success);

        return interaction.reply({ embeds: [SuccessEmbed], flags: MessageFlags.Ephemeral });
      }

      if (subcommandGroup === (cmdconfig.AI?.Knowledge?.Command || "knowledge")) {
        if (subcommand === (cmdconfig.AI?.Knowledge?.Clear?.Command || "clear")) {
          AIDatabase.clearKnowledge();

          const SuccessEmbed = new EmbedBuilder()
            .setDescription(`✅ **Knowledge Cleared!**\n\nAll manually trained knowledge has been wiped from the database.`)
            .setColor(supportbot.Embed.Colours.Success);

          return interaction.reply({ embeds: [SuccessEmbed], flags: MessageFlags.Ephemeral });
        }
      }

      if (subcommandGroup === (cmdconfig.AI?.Memory?.Command || "memory")) {
        if (subcommand === (cmdconfig.AI?.Memory?.Clear?.Command || "clear")) {
          AIDatabase.clearConversations(interaction.channel.id);

          const SuccessEmbed = new EmbedBuilder()
            .setDescription(`✅ **Memory Cleared!**\n\nThe AI's recent conversation memory in this channel has been wiped. It will no longer remember previous messages sent here.`)
            .setColor(supportbot.Embed.Colours.Success);

          return interaction.reply({ embeds: [SuccessEmbed], flags: MessageFlags.Ephemeral });
        }
      }

    } catch (error) {
      console.error("AI Command Error:", error);
      const ErrorEmbed = new EmbedBuilder()
        .setDescription(`❌ **Error:** Failed to process the AI command.`)
        .setColor(supportbot.Embed.Colours.Error);

      return interaction.reply({ embeds: [ErrorEmbed], flags: MessageFlags.Ephemeral });
    }
  },
});
