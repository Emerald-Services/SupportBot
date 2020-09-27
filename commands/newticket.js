const Discord = require("discord.js");
const bot = new Discord.Client()

const fs = require("fs")
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));
const TicketNumberID = require('../utils/TicketNumber.js');

const reacted = [];

module.exports = {
    name: supportbot.NewTicket,
    description: supportbot.NewTicketDesc,

    execute(message, args) {
      if (supportbot.DeleteMessages == "true") message.delete();
        
      console.log(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[32m`, `${message.author.tag} has executed ${supportbot.Prefix}${supportbot.NewTicket}!`);

      // Ticket ID
      let ticketNumberID = TicketNumberID.pad(message.guild.id);

      // Ticket Subject
      const TicketSubject = args.join(" ") || supportbot.NoTicketSubject;

      // Ticket Exists
      const TicketExists = new Discord.MessageEmbed()
        .setTitle("Ticket Exists!")
        .setDescription(`${supportbot.TicketExists}`)
        .setColor(supportbot.WarningColour)

      if (message.guild.channels.cache.find(SupportTicket => SupportTicket.name === `${supportbot.TicketChannel}-${ticketNumberID}`)) 
      return message.channel.send({ embed: TicketExists });

      message.guild.channels.create(`${supportbot.TicketChannel}-${ticketNumberID}`, {
        type: "text",
      }).then(SupportTicket => {

        let AllUsers = message.guild.roles.cache.find(everyone => everyone.name === '@everyone')
        let SupportStaff = message.guild.roles.cache.find(SupportTeam => SupportTeam.name === supportbot.Staff)
        let Admins = message.guild.roles.cache.find(AdminUser => AdminUser.name === supportbot.Admin)

        let DeptRole1 = message.guild.roles.cache.find(DepartmentRole => DepartmentRole.name === `${supportbot.DepartmentRole_1}`)
        let DeptRole2 = message.guild.roles.cache.find(DepartmentRole => DepartmentRole.name === `${supportbot.DepartmentRole_2}`)
        let DeptRole3 = message.guild.roles.cache.find(DepartmentRole => DepartmentRole.name === `${supportbot.DepartmentRole_3}`)
        
        SupportTicket.updateOverwrite(AllUsers, {
          VIEW_CHANNEL: false,
          READ_MESSAGES: false,
          SEND_MESSAGES: false,
        })
          
        SupportTicket.updateOverwrite(message.author, {
          VIEW_CHANNEL: true,
          READ_MESSAGES: true,
          SEND_MESSAGES: true,
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
          .setTitle(supportbot.Ticket_Title.replace(/%ticketauthor%/g, message.author.id).replace(/%ticketid%/g, SupportTicket.id).replace(/%ticketusername%/g, message.member.user.username))
          .setDescription(supportbot.TicketMessage.replace(/%ticketauthor%/g, message.author.id).replace(/%ticketid%/g, SupportTicket.id).replace(/%ticketusername%/g, message.member.user.username))
          .setColor(supportbot.EmbedColour)

        if (supportbot.TicketSubject === "embed") {

          if (TicketSubject != 'No Reason Provided.') {
            TicketMessage.addFields({ name: 'Reason', value: TicketSubject })
          }
          
        }

        if (supportbot.TicketSubject === "description") {

          if (TicketSubject != 'No Reason Provided.') {
            SupportTicket.setTopic(`Reason: ${TicketSubject}  -  User ID: ${message.author.id}  -  Ticket: ${SupportTicket.name}`)
          }
          
        }

        if (supportbot.TicketDepartments === "true") {
          TicketMessage.addFields({ name: 'Departments', value: `${supportbot.DepartmentEmoji_1} **${supportbot.DepartmentTitle_1}**\n${supportbot.DepartmentEmoji_2} **${supportbot.DepartmentTitle_2}**\n${supportbot.DepartmentEmoji_3} **${supportbot.DepartmentTitle_3}**` })
        }

        SupportTicket.send({ embed: TicketMessage }).then( async function(msg) {
        
          const Emoji_1 = supportbot.DepartmentEmoji_1;
          const Emoji_2 = supportbot.DepartmentEmoji_2;
          const Emoji_3 = supportbot.DepartmentEmoji_3;

          reacted[ticketNumberID] = false;

          if (supportbot.TicketDepartments === "true") {
            await msg.react(Emoji_1);
            await msg.react(Emoji_2);
            await msg.react(Emoji_3);
            let filter = (reaction, user) => {
              if (user.id !== message.author.id) return;
              if (typeof reacted[ticketNumberID] !== "boolean") return;
              delete reacted[ticketNumberID];
              if (reaction.emoji.name === Emoji_1) {
                SupportTicket.updateOverwrite(message.author.id, { VIEW_CHANNEL: true, READ_MESSAGES: true, SEND_MESSAGES: true, })
                SupportTicket.updateOverwrite(Admins, { VIEW_CHANNEL: true, READ_MESSAGES: true, SEND_MESSAGES: true, })
                SupportTicket.updateOverwrite(DeptRole1, { VIEW_CHANNEL: true, READ_MESSAGES: true, SEND_MESSAGES: true, })
          
                if (supportbot.AllowStaff === "true") {
                  SupportTicket.updateOverwrite(SupportStaff, { VIEW_CHANNEL: true, READ_MESSAGES: true, SEND_MESSAGES: true, })
                }
          
                if (supportbot.AllowStaff === "false") {
                  SupportTicket.updateOverwrite(SupportStaff, { VIEW_CHANNEL: false, READ_MESSAGES: true, SEND_MESSAGES: true, })
                }

                const Department1 = new Discord.MessageEmbed()
                  .setTitle(`> Thank for reaching out to the **${supportbot.DepartmentTitle_1} Department**. Please provide us information regarding your query.`)
                  .setColor(supportbot.EmbedColour)
                SupportTicket.send({ embed: Department1 });
          
              }
          
              if (reaction.emoji.name === Emoji_2) {
                SupportTicket.updateOverwrite(message.author.id, { VIEW_CHANNEL: true, READ_MESSAGES: true, SEND_MESSAGES: true, })
                SupportTicket.updateOverwrite(Admins, { VIEW_CHANNEL: true, READ_MESSAGES: true, SEND_MESSAGES: true, })
                SupportTicket.updateOverwrite(DeptRole2, { VIEW_CHANNEL: true, READ_MESSAGES: true, SEND_MESSAGES: true, })
          
                if (supportbot.AllowStaff === "true") {
                  SupportTicket.updateOverwrite(SupportStaff, { VIEW_CHANNEL: true, READ_MESSAGES: true, SEND_MESSAGES: true, })
                }

                if (supportbot.AllowStaff === "false") {
                  SupportTicket.updateOverwrite(SupportStaff, { VIEW_CHANNEL: false, READ_MESSAGES: true, SEND_MESSAGES: true, })
                }
          
                const Department2 = new Discord.MessageEmbed()
                .setTitle(`> Thank for reaching out to the **${supportbot.DepartmentTitle_2} Department**. Please provide us information regarding your query.`)
                  .setColor(supportbot.EmbedColour)
                SupportTicket.send({ embed: Department2 });
          
              }
          
              if (reaction.emoji.name === `${Emoji_3}`) {
                SupportTicket.updateOverwrite(message.author.id, { VIEW_CHANNEL: true, READ_MESSAGES: true, SEND_MESSAGES: true, })
                SupportTicket.updateOverwrite(Admins, { VIEW_CHANNEL: true, READ_MESSAGES: true, SEND_MESSAGES: true, })
                SupportTicket.updateOverwrite(DeptRole3, { VIEW_CHANNEL: true, READ_MESSAGES: true, SEND_MESSAGES: true, })
                SupportTicket.updateOverwrite(SupportStaff, { VIEW_CHANNEL: false, READ_MESSAGES: true, SEND_MESSAGES: true, })
          
                if (supportbot.AllowStaff === "true") {
                  SupportTicket.updateOverwrite(SupportStaff, { VIEW_CHANNEL: true, READ_MESSAGES: true, SEND_MESSAGES: true, })
                }

                if (supportbot.AllowStaff === "false") {
                  SupportTicket.updateOverwrite(SupportStaff, { VIEW_CHANNEL: false, READ_MESSAGES: true, SEND_MESSAGES: true, })
                }
          
                const Department3 = new Discord.MessageEmbed()
                .setTitle(`> Thank for reaching out to the **${supportbot.DepartmentTitle_3} Department**. Please provide us information regarding your query.`)
                  .setColor(supportbot.EmbedColour)
                SupportTicket.send({ embed: Department3 });
              }
              return [Emoji_1, Emoji_2, Emoji_3].includes(reaction.emoji.name) && user.id !== message.author.id;
            }
            msg.awaitReactions(filter, { 
              max: 4, 
              time: 60000, 
              errors: ['time'] 
            }).then(async collected => {
            });

            setTimeout(async function() {
              if (typeof reacted[ticketNumberID] == "boolean") {
                delete reacted[ticketNumberID];
                //delete channel because didn't react in a minute
              }
            }, 60000);

          }
  
        });
        const CreatedTicket = new Discord.MessageEmbed()
          .setDescription(supportbot.TicketCreatedAlert.replace(/%ticketauthor%/g, message.author.id).replace(/%ticketid%/g, SupportTicket.id).replace(/%ticketusername%/g, message.member.user.username))
          .setColor(supportbot.EmbedColour)
        message.channel.send({ embed: CreatedTicket });

        fs.writeFileSync("./storage/SupportTickets.json", '{\n    "ticket": "' + SupportTicket.name + '", \n    "id":' + message.author.id + "\n}", (err) => {
          if (!err) return;
          console.error(err)
      })

        // Ticket Logs

        const errornochannel = new Discord.MessageEmbed()
          .setTitle("SupportBot Error!")
          .setDescription(`:x: **Error!** Channel not Found, This command cannot be executed proberbly as their is no channel within this server.\nThis is configurable via **supportbot-config.yml**\n\nChannel Required: \`${supportbot.TicketLog}\`\n\nError Code: \`SB-03\``)
          .setColor(supportbot.ErrorColour);

        const TicketLogs = new Discord.MessageEmbed()
          .setTitle("Ticket Log")
          .setThumbnail(supportbot.Ticket_Thumbnail)
          .addFields(
            { name: 'Ticket', value: `<#${SupportTicket.id}>` },
            { name: 'User', value: `<@${message.author.id}>` },
          )
          .setColor(supportbot.EmbedColour)
          .setFooter(supportbot.EmbedFooter)

        let locateChannel = message.guild.channels.cache.find(LocateChannel => LocateChannel.name === supportbot.TicketLog)

        if(!locateChannel) return message.channel.send({ embed: errornochannel });

        locateChannel.send({ embed: TicketLogs });
      })

    }

};
