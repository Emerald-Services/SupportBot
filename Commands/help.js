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
  name: cmdconfig.HelpCommand,
  description: cmdconfig.HelpCommandDesc,
  options: [],
  permissions: ["SEND_MESSAGES"],

  async run(interaction) {
    const { getRole} = interaction.client;
    let SupportStaff = await getRole(supportbot.Staff, interaction.guild);
    let Admin = await getRole(supportbot.Admin, interaction.guild);
    if (!SupportStaff || !Admin)
      return interaction.reply(
        "Some roles seem to be missing!\nPlease check for errors when starting the bot."
      );

    let botCommands = "";
    botCommands += `**/${cmdconfig.HelpCommand}** ${cmdconfig.HelpCommandDesc}\n`;
    botCommands += `**/${cmdconfig.InfoCommand}** ${cmdconfig.InfoCommandDesc}\n`;
    botCommands += `**/${cmdconfig.PingCommand}** ${cmdconfig.PingCommandDesc}\n`;

    let ticketCommands = "";
    ticketCommands += `**/${cmdconfig.OpenTicket}** ${cmdconfig.OpenTicketDesc}\n`;
    ticketCommands += `**/${cmdconfig.CloseTicket}** ${cmdconfig.CloseTicketDesc}\n`;

    let staffCommands = "";
    staffCommands += `**/${cmdconfig.TicketAdd}** ${cmdconfig.TicketAddDesc}\n`;
    staffCommands += `**/${cmdconfig.TicketRemove}** ${cmdconfig.TicketRemoveDesc}\n`;

    const HelpEmbed1 = new Discord.MessageEmbed()
      .setTitle(supportbot.Name + " Commands")
      .setThumbnail(interaction.user.displayAvatarURL())

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

      .setColor(supportbot.EmbedColour)
      .setFooter(supportbot.EmbedFooter, interaction.user.displayAvatarURL());

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

    if (supportbot.SendHelpPage === "dm") {
      interaction.user.reply({
        embeds: [HelpEmbed1],
      });
    }

    if (supportbot.SendHelpPage === "channel") {
      interaction.reply({
        embeds: [HelpEmbed1],
      });
    }
  },
});
