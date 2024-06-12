const { EmbedBuilder, ApplicationCommandType } = require("discord.js");
const fs = require("fs");
const yaml = require("js-yaml");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.TicketStats.Command,
  description: cmdconfig.TicketStats.Description,
  type: ApplicationCommandType.ChatInput,
  permissions: ["SendMessages"], // Adjust permissions as needed

  async run(interaction) {

    if (supportbot.Ticket.ClaimTickets.Enabled) {

        const TicketData = JSON.parse(fs.readFileSync("./Data/TicketData.json", "utf8"));
        const userId = interaction.user.id;
    
        const ticketsClaimed = TicketData.tickets.filter(t => t.claimedBy === userId);
        const ticketsOpen = ticketsClaimed.filter(t => t.open);
        const totalTickets = ticketsClaimed.length;
    
        let totalResponseTime = 0;
        let responseCount = 0;
    
        ticketsClaimed.forEach(ticket => {
          if (ticket.claimedAt && ticket.createdAt) {
            const responseTime = new Date(ticket.claimedAt) - new Date(ticket.createdAt);
            totalResponseTime += responseTime;
            responseCount++;
          }
        });
    
        const averageResponseTime = responseCount ? totalResponseTime / responseCount : 0;
        const averageResponseTimeMinutes = Math.round(averageResponseTime / 60000); // Convert to minutes
    
        const statsEmbed = new EmbedBuilder()
          .setTitle(msgconfig.TicketStats.Title)
          .setDescription(`> Ticket stats for <@${interaction.user.id}>`)
          .setColor(supportbot.Embed.Colours.General)
          .addFields(
            { name: msgconfig.TicketStats.OpenTickets, value: `${ticketsOpen.length}`, inline: true },
            { name: msgconfig.TicketStats.TotalTickets, value: `${totalTickets}`, inline: true },
            { name: msgconfig.TicketStats.ResponseTime, value: `${averageResponseTimeMinutes} minutes`, inline: false }
          );
    
        await interaction.reply({ embeds: [statsEmbed], ephemeral: true });
      }

    }
});
