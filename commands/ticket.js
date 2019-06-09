// SupportBot
// Command: Ticket

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

exports.run = async(bot, message, args) => {
    message.delete();

    const ID = Math.floor(Math.random() * 10) + 2000;
    const subject = args.join(" ") || "No Subject.";

    const alreadyopen = new Discord.RichEmbed()
        .setDescription(`:x: Cannot create a ticket because **ticket-${message.author.username}** already exists.`)
        .setColor(bot.settings.colour)
    if (message.guild.channels.find(TicketChannel => TicketChannel.name === 'ticket-' + message.author.username)) return message.channel.send(alreadyopen);
    message.guild.createChannel(`ticket-${message.author.username}`, 'text').then(TicketChannel => {

    // Roles
        let staff = message.guild.roles.find(staffRole => staffRole.name === `${bot.settings.support}`)
        let everyone = message.guild.roles.find(everyoneRole => everyoneRole.name === `@everyone`)

    // Permissions
        TicketChannel.overwritePermissions(everyone, { SEND_MESSAGES: false, READ_MESSAGES: false })
        TicketChannel.overwritePermissions(staff, { SEND_MESSAGES: true, READ_MESSAGES: true })
        TicketChannel.overwritePermissions(message.author, { SEND_MESSAGES: true, READ_MESSAGES: true })
        TicketChannel.overwritePermissions(bot.user, { SEND_MESSAGES: true, READ_MESSAGES: true })

    // Category
    let category = message.guild.channels.find(c => c.name === bot.settings.category);
        if (category) {
            TicketChannel.setParent(category.id);
        } else {
            if (message.guild.channels.get(bot.settings.category)) {
                TicketChannel.setParent(message.guild.channels.get(bot.settings.category).id);
            }
        }
        
    const ticketopened = new Discord.RichEmbed()
        .setDescription(`:white_check_mark: <@${message.author.id}> You ticket has been created <#${TicketChannel.id}>`)
        .setColor(bot.settings.colour)
    message.channel.send({embed: ticketopened});

    // Ticket Message - ( Able to edit this message via the settings.json file )
    const ticketMessage = `Hi! <@${message.author.id}>\n${bot.settings.Ticket_Message}`;

    const TicketMessage = new Discord.RichEmbed()
        .setDescription(ticketMessage)
        .setColor(bot.settings.colour)
        .setFooter(bot.settings.footer)
    TicketChannel.send({embed: TicketMessage});

    if (subject != 'No Subject.') {
        TicketChannel.setTopic(subject);
    }
	
    // Ticket Logging
    const logEmbed = new Discord.RichEmbed()
        .setTitle(":ticket: Logistics of your Ticket")
        .addField("Ticket ID", ID, true)
        .addField("User", `<@${message.author.id}>`, true)
        .addField("Channel", `ticket#${ID}`, true)
        .setColor(bot.settings.colour)
        .setFooter(bot.settings.footer)

    if (subject != 'No Subject.') {
        logEmbed.addField('Subject', subject, true);
    }
  
    let logChannel = message.guild.channels.find(TicketChannel => TicketChannel.name === `${bot.settings.Ticket_Logs}`);
    if(!logChannel) return message.channel.send(`:x: Error! Could not find the logs channel **${bot.settings.Ticket_Logs}**`);
    
    logChannel.send({embed: logEmbed})

    }).catch(err=>{console.error(err)});
    
    console.log(`\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.Ticket_Command}`)
	
}

exports.help = {
    name: bot.settings.Ticket_Command,
}