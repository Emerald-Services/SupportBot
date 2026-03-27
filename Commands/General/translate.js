// SupportBot | Emerald Services
// Translate Command

const fs = require("fs");
const Discord = require("discord.js");
const yaml = require("js-yaml");

const { translate } = require("@vitalets/google-translate-api");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

const Command = require("../../Structures/Command.js");

const LANGUAGES = [
  { name: "Auto Detect", value: "auto" },
  { name: "English", value: "en" },
  { name: "Spanish", value: "es" },
  { name: "French", value: "fr" },
  { name: "German", value: "de" },
  { name: "Italian", value: "it" },
  { name: "Portuguese", value: "pt" },
  { name: "Dutch", value: "nl" },
  { name: "Polish", value: "pl" },
  { name: "Russian", value: "ru" },
  { name: "Ukrainian", value: "uk" },
  { name: "Turkish", value: "tr" },
  { name: "Arabic", value: "ar" },
  { name: "Hebrew", value: "he" },
  { name: "Hindi", value: "hi" },
  { name: "Japanese", value: "ja" },
  { name: "Korean", value: "ko" },
  { name: "Chinese (Simplified)", value: "zh-cn" },
  { name: "Chinese (Traditional)", value: "zh-tw" },
  { name: "Thai", value: "th" },
  { name: "Vietnamese", value: "vi" },
  { name: "Indonesian", value: "id" },
  { name: "Greek", value: "el" },
  { name: "Swedish", value: "sv" },
  { name: "Romanian", value: "ro" },
];

function buildContainer(title, lines = [], color = null) {
  const container = new Discord.ContainerBuilder();

  if (color) {
    container.setAccentColor(parseInt(color.replace("#", ""), 16));
  }

  container.addTextDisplayComponents(new Discord.TextDisplayBuilder().setContent(`## ${title}`));

  container.addSeparatorComponents(new Discord.SeparatorBuilder().setDivider(true));

  container.addTextDisplayComponents(new Discord.TextDisplayBuilder().setContent(lines.join("\n")));

  return container;
}

function trim(text, max = 1800) {
  if (text.length <= max) return text;
  return text.substring(0, max) + "...";
}

module.exports = new Command({
  name: cmdconfig.Translate.Command,
  description: cmdconfig.Translate.Description,
  type: Discord.ApplicationCommandType.ChatInput,

  options: [
    {
      type: Discord.ApplicationCommandOptionType.String,
      name: "from",
      description: "Language to translate FROM",
      required: true,
      choices: LANGUAGES,
    },
    {
      type: Discord.ApplicationCommandOptionType.String,
      name: "to",
      description: "Language to translate TO",
      required: true,
      choices: LANGUAGES.filter((l) => l.value !== "auto"),
    },
    {
      type: Discord.ApplicationCommandOptionType.String,
      name: "text",
      description: "Text to translate",
      required: true,
    },
  ],

  permissions: cmdconfig.Translate.Permission,

  async run(interaction) {
    const { getRole, getChannel } = interaction.client;

    const Staff = await getRole(supportbot.Roles.StaffMember.Staff, interaction.guild);

    const Admin = await getRole(supportbot.Roles.StaffMember.Admin, interaction.guild);

    if (!Staff || !Admin) {
      return interaction.reply({
        content: "Some roles seem to be missing!",
        flags: Discord.MessageFlags.Ephemeral,
      });
    }

    if (
      !interaction.member.roles.cache.has(Staff.id) &&
      !interaction.member.roles.cache.has(Admin.id)
    ) {
      return interaction.reply({
        flags: Discord.MessageFlags.IsComponentsV2 | Discord.MessageFlags.Ephemeral,
        components: [
          buildContainer(
            "Invalid Permissions",
            [
              msgconfig.Error.IncorrectPerms,
              "",
              `Required role: \`${supportbot.Roles.StaffMember.Staff}\` or \`${supportbot.Roles.StaffMember.Admin}\``,
            ],
            supportbot.Embed.Colours.Warn,
          ),
        ],
      });
    }

    await interaction.deferReply({ flags: Discord.MessageFlags.Ephemeral });

    const fromLang = interaction.options.getString("from");
    const toLang = interaction.options.getString("to");
    const text = interaction.options.getString("text");

    const translateLog = await getChannel(supportbot.Translate?.TranslateLog, interaction.guild);

    let result;

    try {
      result = await translate(text, {
        from: fromLang === "auto" ? undefined : fromLang,
        to: toLang,
      });
    } catch (err) {
      console.error("Translate error:", err);

      return interaction.editReply({
        flags: Discord.MessageFlags.IsComponentsV2,
        components: [
          buildContainer(
            "Translation Failed",
            ["The translation service returned an error."],
            supportbot.Embed.Colours.Warn,
          ),
        ],
      });
    }

    const detectedLanguage = result.from?.language?.iso || result.from?.language || "unknown";

    const container = buildContainer(
      "Translation",
      [
        `**Requested By:** <@${interaction.user.id}>`,
        `**From:** \`${fromLang === "auto" ? detectedLanguage : fromLang}\``,
        `**To:** \`${toLang}\``,
        "",
        "**Original Text**",
        trim(text),
        "",
        "**Translated Text**",
        trim(result.text),
      ],
      supportbot.Embed.Colours.Success,
    );

    await interaction.editReply({
      flags: Discord.MessageFlags.IsComponentsV2,
      components: [container],
    });

    if (translateLog) {
      const logContainer = buildContainer(
        "Translation Log",
        [
          `User: <@${interaction.user.id}>`,
          `Channel: <#${interaction.channel.id}>`,
          `From: ${fromLang}`,
          `To: ${toLang}`,
          "",
          trim(text),
          "",
          trim(result.text),
        ],
        supportbot.Embed.Colours.General,
      );

      translateLog
        .send({
          flags: Discord.MessageFlags.IsComponentsV2,
          components: [logContainer],
        })
        .catch(() => {});
    }
  },
});
