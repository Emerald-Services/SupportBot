const Discord = require("discord.js");
const bot = new Discord.Client()

const fs = require("fs")
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));
const TicketNumberID = require('../utils/TicketNumber.js');

module.exports = {
    name: supportbot.NewTicket,

    execute(message, args) {
      console.log(`\u001b[43;1m`, `[${supportbot.Bot_Name}]:`, `\u001b[32m`, `${message.author.tag} has executed ${supportbot.Prefix}${supportbot.NewTicket}!`);

      // Ticket ID
      let ticketNumberID = TicketNumberID.pad(message.guild.id);

      // Ticket Subject
      const TicketSubject = args.join(" ") || supportbot.NoTicketSubject;

      // Ticket Exists
      const TicketExists = new Discord.MessageEmbed()
        .setTitle("Ticket Exists!")
        .setDescription(":no_entry_sign: This ticket cannot be opened, It already exists!")
        .setColor(supportbot.WarningColour)

      if (message.guild.channels.cache.find(SupportTicket => SupportTicket.name === `${supportbot.TicketChannel}-${ticketNumberID}`)) 
      return message.channel.send({ embed: TicketExists });
      
      message.guild.channels.create(`${supportbot.TicketChannel}-${ticketNumberID}`, {
        type: "text",
      }).then(SupportTicket => {

        let AllUsers = message.guild.roles.cache.find(everyone => everyone.name === '@everyone')
        let SupportStaff = message.guild.roles.cache.find(SupportTeam => SupportTeam.name === supportbot.Support)
        let Admins = message.guild.roles.cache.find(AdminUser => AdminUser.name === supportbot.Admin)
        let Dept1 = message.guild.roles.cache.find(Dept1Role => Dept1Role.name === supportbot.DepartmentRole_1)
        let Dept2 = message.guild.roles.cache.find(Dept1Role => Dept1Role.name === supportbot.DepartmentRole_2)
        let Dept3 = message.guild.roles.cache.find(Dept1Role => Dept1Role.name === supportbot.DepartmentRole_3)

        SupportTicket.updateOverwrite(AllUsers, {
          VIEW_CHANNEL: false,
        })

        SupportTicket.updateOverwrite(SupportStaff, {
          VIEW_CHANNEL: true,
          READ_MESSAGES: true,
          SEND_MESSAGES: true,
        })

        SupportTicket.updateOverwrite(Admins, {
          VIEW_CHANNEL: true,
          READ_MESSAGES: true,
          SEND_MESSAGES: true,
        })

        SupportTicket.updateOverwrite(Dept1, {
          VIEW_CHANNEL: true,
          READ_MESSAGES: true,
          SEND_MESSAGES: false,
        })

        SupportTicket.updateOverwrite(Dept2, {
          VIEW_CHANNEL: true,
          READ_MESSAGES: true,
          SEND_MESSAGES: false,
        })

        SupportTicket.updateOverwrite(Dept3, {
          VIEW_CHANNEL: true,
          READ_MESSAGES: true,
          SEND_MESSAGES: false,
        })

        // Ticket Category
        let TicketCategory = message.guild.channels.cache.find(category => category.name === supportbot.TicketCategory)

        if (TicketCategory) {
          SupportTicket.setParent(TicketCategory.id)
        } else {
          if (message.guild.channels.cache.get(supportbot.TicketCategory)) {
            SupportTicket.setParent(message.guild.channels.cache.get(supportbot.TicketCategory).id);
          }
        }

        // Ticket Created, Message Sent
        const TicketMessage = new Discord.MessageEmbed()
          .setTitle(supportbot.Ticket_Title)
          .setDescription(supportbot.TicketMessage.replace(/%ticketauthor%/g, message.author.id))
          .setColor(supportbot.EmbedColour)
        SupportTicket.send({ embed: TicketMessage });

      message.channel.send(`Command is working! #${SupportTicket.id}`)



      })

    }

};
