// SupportBot | Emerald Services
// Close Ticket Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(fs.readFileSync("./Data/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Data/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");
const TicketNumberID = require("../Structures/TicketID.js");

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

module.exports = new Command({
  name: cmdconfig.HelpCommand,
  description: cmdconfig.HelpCommandDesc,
  slashCommandOptions: [],
  permission: "SEND_MESSAGES",

  async run(interaction) {
    let SupportStaff =
      interaction.guild.roles.cache.find(
        (adminRole) => adminRole.name === supportbot.Staff
      ) ||
      interaction.guild.roles.cache.find(
        (staffRole) => staffRole.id === supportbot.Staff
      );
    let AdminStaff =
      interaction.guild.roles.cache.find(
        (adminRole) => adminRole.name === supportbot.Admin
      ) ||
      interaction.guild.roles.cache.find(
        (adminRole) => adminRole.id === supportbot.Admin
      );

    if (supportbot.HelpMenu) {
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

      if (interaction.member.roles.cache.has(SupportStaff.id)) {
        HelpEmbed1.addFields({
          name: "🔐 Staff Commands\n",
          value: `${staffCommands}\n`,
          inline: false,
        });
      } else {
        if (interaction.member.roles.cache.has(AdminStaff.id)) {
          HelpEmbed1.addFields({
            name: "🔐 Staff Commands\n",
            value: `${staffCommands}\n`,
            inline: false,
          });
        }
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
    }
  },
});
