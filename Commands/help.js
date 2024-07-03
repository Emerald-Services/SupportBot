const fs = require("fs");
const Discord = require("discord.js");
const yaml = require("js-yaml");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.Help.Command,
  description: cmdconfig.Help.Description,
  type: Discord.ApplicationCommandType.ChatInput,
  options: [],
  permissions: cmdconfig.Help.Permission,

  async run(interaction) {
    const { getRole } = interaction.client;
    let SupportStaff = await getRole(supportbot.Roles.StaffMember.Staff, interaction.guild);
    let Admin = await getRole(supportbot.Roles.StaffMember.Admin, interaction.guild);
    if (!SupportStaff || !Admin) {
      return interaction.reply(
        "Some roles seem to be missing!\nPlease check for errors when starting the bot."
      );
    }

    // Separate regular commands and addon commands
    let botCommands = "";
    let addonCommands = "";

    interaction.client.commands.forEach((command) => {
      if (command.permissions) {
        if (command.addon) {
          addonCommands += `\`${command.name}\` `;
        } else {
          botCommands += `\`${command.name}\` `;
        }
      }
    });

    // Create embed
    const HelpEmbed1 = new Discord.EmbedBuilder()
      .setTitle(supportbot.General.Name + " Commands")
      .setThumbnail(interaction.user.displayAvatarURL())
      .setColor(supportbot.Embed.Colours.General)
      .addFields({
        name: "🖥️ Commands\n",
        value: botCommands || "No commands available.",
        inline: false,
      });

    HelpEmbed1.setFooter({
      text: supportbot.Embed.Footer,
      iconURL: interaction.user.displayAvatarURL(),
    });

    interaction.reply({
      ephemeral: true,
      embeds: [HelpEmbed1],
    });
  },
});
