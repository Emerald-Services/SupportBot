// SupportBot | Emerald Services
// Embed Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.EmbedCommand,
  description: cmdconfig.EmbedCommandDesc,
  options: [
    {
      name: "title",
      description: "Embed Title",
      type: "STRING",
      required: true,
    },

    {
      name: "message",
      description: "Embed Message",
      type: "STRING",
      required: true,
    },
  ],
  permissions: ["SEND_MESSAGES"],

  async run(interaction) {
    const { getRole, getChannel, getCategory } = interaction.client;
    let SupportStaff = await getRole(supportbot.Staff, interaction.guild);
    let Admin = await getRole(supportbot.Admin, interaction.guild);

    if (!SupportStaff || !Admin)
      return interaction.reply(
        "Some roles seem to be missing!\nPlease check for errors when starting the bot."
      );
    const NoPerms = new Discord.MessageEmbed()
      .setTitle("Invalid Permissions!")
      .setDescription(
        `${supportbot.IncorrectPerms}\n\nRole Required: \`${supportbot.Staff}\` or \`${supportbot.Admin}\``
      )
      .setColor(supportbot.WarningColour);

    if (
      interaction.member.roles.cache.has(SupportStaff.id) ||
      interaction.member.roles.cache.has(Admin.id)
    ) {
      const EmbedTitle = interaction.options.getString("title");
      const EmbedSubject = interaction.options.getString("message");

      const EmbedMsg = new Discord.MessageEmbed()
        .setTitle(EmbedTitle)
        .setDescription(EmbedSubject);

      interaction.reply({
        embeds: [EmbedMsg],
      });
    } else {
      return interaction.reply({ embeds: [NoPerms] });
    }
  },
});
