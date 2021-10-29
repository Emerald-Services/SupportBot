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
  slashCommandOptions: [
    {
      name: "title",
      description: "Embed Title",
      type: "STRING",
    },

    {
      name: "message",
      description: "Embed Message",
      type: "STRING",
    },
  ],
  permission: "SEND_MESSAGES",

  async run(interaction) {
    let SupportStaff =
      interaction.guild.roles.cache.find(
        (SupportTeam) => SupportTeam.name === supportbot.Staff
      ) ||
      interaction.guild.roles.cache.find(
        (SupportTeam) => SupportTeam.id === supportbot.Staff
      );
    let Admins =
      interaction.guild.roles.cache.find(
        (AdminUser) => AdminUser.name === supportbot.Admin
      ) ||
      interaction.guild.roles.cache.find(
        (AdminUser) => AdminUser.id === supportbot.Admin
      );

    const NoPerms = new Discord.MessageEmbed()
      .setTitle("Invalid Permissions!")
      .setDescription(
        `${supportbot.IncorrectPerms}\n\nRole Required: \`${supportbot.Staff}\` or \`${supportbot.Admin}\``
      )
      .setColor(supportbot.WarningColour);

    if (
      interaction.member.roles.cache.has(SupportStaff.id) ||
      interaction.member.roles.cache.has(Admins.id)
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
