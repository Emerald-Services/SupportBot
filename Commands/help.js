// SupportBot | Emerald Services
// Help Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.Help.Command,
  description: cmdconfig.Help.Description,
  type: Discord.ApplicationCommandType.ChatInput,
  options: [],
  permissions: cmdconfig.Help.Permission,

  async run(interaction) {
    let disableCommand = true;

    if (cmdconfig.Help.Enabled === false) {
      if (interaction.type === Discord.InteractionType.ApplicationCommand && disableCommand)
      return interaction.reply({
        content: ":x: This command is `disabled`",
        ephemeral: true,
      });
    }

    const { getRole } = interaction.client;
    let SupportStaff = await getRole(supportbot.Staff, interaction.guild);
    let Admin = await getRole(supportbot.Admin, interaction.guild);
    if (!SupportStaff || !Admin)
      return interaction.reply(
        "Some roles seem to be missing!\nPlease check for errors when starting the bot."
      );

    let botCommands = "";
      botCommands += ` \`${cmdconfig.Help.Command}\` `;
      botCommands += `\`${cmdconfig.Ping.Command}\` `;
      botCommands += `\`${cmdconfig.Info.Command}\` `;

    if (supportbot.DisableSuggestions === false) {
      botCommands += `\`${cmdconfig.Suggestion.Command}\` `;
    }

    let ticketCommands = "";
    ticketCommands += ` \`${cmdconfig.OpenTicket.Command}\` `;
    ticketCommands += `\`${cmdconfig.CloseTicket.Command}\` `;

    let staffCommands = "";
    staffCommands += ` \`${cmdconfig.TicketAdd.Command}\` `;
    staffCommands += `\`${cmdconfig.TicketRemove.Command}\` `;
    staffCommands += `\`${cmdconfig.UserInfo.Command}\` `;
    staffCommands += `\`${cmdconfig.Translate.Command}\` `;

    const HelpEmbed1 = new Discord.EmbedBuilder()
      .setTitle(supportbot.General.Name + " Commands")
      .setThumbnail(interaction.user.displayAvatarURL())
      .setColor(supportbot.Embed.Colours.General)
      .addFields(
        {
          name: "🖥️ General Commands\n",
          value: `${botCommands}\n`,
          inline: false,
        },
        {
          name: "🎫 Support Commands\n",
          value: `${ticketCommands}\n`,
          inline: false,
        }
      )

      .setColor(supportbot.Embed.Colours.General)
      .setFooter({
        text: supportbot.Embed.Footer,
        iconURL: interaction.user.displayAvatarURL(),
      });

    if (
      interaction.member.roles.cache.has(SupportStaff.id) ||
      interaction.member.roles.cache.has(Admin.id)
    ) {
      HelpEmbed1.addFields({
        name: "🔐 Staff Commands\n",
        value: `${staffCommands}\n`,
        inline: false,
      });
    }

      interaction.reply({
        ephemeral: true,
        embeds: [HelpEmbed1],
      });
  },
});
