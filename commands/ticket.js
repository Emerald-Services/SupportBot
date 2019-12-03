// SupportBot
// Command: Ticket

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

exports.run = (bot, message, args) => {
    message.delete();

    const ID = Math.floor(Math.random() * 10) + 2000;
    const subject = args.join(" ") || `${bot.settings.Default_Ticket_Reason}`;

    const alreadyopen = new Discord.RichEmbed()
        .setDescription(`:x: Cannot create a ticket because **${bot.settings.Ticket_Channel_Name}-${message.author.username}** already exists.`)
        .setColor(bot.settings.colour)
    if (message.guild.channels.find(TicketChannel => TicketChannel.name === `${bot.settings.Ticket_Channel_Name}-` + message.author.username)) return message.channel.send(alreadyopen);
    message.guild.createChannel(`${bot.settings.Ticket_Channel_Name}-${message.author.username}`, {
        type: 'text',
    }).then(TicketChannel => {
        
    // Roles
        let staff = message.guild.roles.find(supportRole => supportRole.name === `${bot.settings.staff}`)
        let everyone = message.guild.roles.find(everyoneRole => everyoneRole.name === "@everyone")
        let department = message.guild.roles.find(DepartmentRole => DepartmentRole.name === `${bot.settings.Department_Role_1}`)
        let department2 = message.guild.roles.find(DepartmentRole => DepartmentRole.name === `${bot.settings.Department_Role_2}`)
        let department3 = message.guild.roles.find(DepartmentRole => DepartmentRole.name === `${bot.settings.Department_Role_3}`)

    // Permissions
        TicketChannel.overwritePermissions(everyone, { SEND_MESSAGES: false, READ_MESSAGES: false })
        TicketChannel.overwritePermissions(department, { SEND_MESSAGES: false, READ_MESSAGES: false })
        TicketChannel.overwritePermissions(department2, { SEND_MESSAGES: false, READ_MESSAGES: false })
        TicketChannel.overwritePermissions(department3, { SEND_MESSAGES: false, READ_MESSAGES: false })
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
        .setTitle(":white_check_mark: Support Ticket Created")
        .setDescription(`<@${message.author.id}> your support ticket created successfully`)
        .addField("Your Ticket:", `<#${TicketChannel.id}>`)
        .setColor(bot.settings.Ticket_Colour)
    message.channel.send({embed: ticketopened});
    // Ticket Message - ( Able to edit this message via the settings.json file )
    const ticketMessage = `Hi! <@${message.author.id}>\n${bot.settings.Ticket_Message}`;

    const Department_1 = bot.settings.Ticket_Department_1;
    const Department_2 = bot.settings.Ticket_Department_2;
    const Department_3 = bot.settings.Ticket_Department_3;

    const Emoji_1 = bot.settings.Ticket_Department_Emoji_1;
    const Emoji_2 = bot.settings.Ticket_Department_Emoji_2;
    const Emoji_3 = bot.settings.Ticket_Department_Emoji_3;

    const TicketMessage = new Discord.RichEmbed()
        .setDescription(ticketMessage, true)
        .addField("Available Departments", `${Emoji_1} ${Department_1}\n${Emoji_2} ${Department_2}\n${Emoji_3} ${Department_3}`)
        .setColor(bot.settings.Ticket_Colour)
        .setFooter(bot.settings.footer)

        if (subject != 'No Subject.') {
            TicketChannel.setTopic(subject);
        }
        

    TicketChannel.send({embed: TicketMessage}).then(function(msg) {

        msg.react(Emoji_1).then(() => msg.react(Emoji_2)).then(() => msg.react(Emoji_3));

        const filter = (reaction, user) => {
			return [Emoji_1, Emoji_2, Emoji_3].includes(reaction.emoji.name) && user.id !== msg.author.id;
        };
        
        msg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
        .then(collected => {
            const reaction = collected.first();

        if (reaction.emoji.name === `${Emoji_1}`) {
			TicketChannel.overwritePermissions(staff, { SEND_MESSAGES: true, READ_MESSAGES: true })
            TicketChannel.overwritePermissions(department, { SEND_MESSAGES: true, READ_MESSAGES: true })

            msg.channel.send("You have contacted out " + department + "\nPlease wait patiently for somone to reach out to you.")
        }

        if (reaction.emoji.name === `${Emoji_2}`) {
			TicketChannel.overwritePermissions(staff, { SEND_MESSAGES: true, READ_MESSAGES: true })
            TicketChannel.overwritePermissions(department2, { SEND_MESSAGES: true, READ_MESSAGES: true })

            msg.channel.send("You have contacted out " + department2 + "\nPlease wait patiently for somone to reach out to you.")
        }

        if (reaction.emoji.name === `${Emoji_3}`) {
			TicketChannel.overwritePermissions(staff, { SEND_MESSAGES: true, READ_MESSAGES: true })
            TicketChannel.overwritePermissions(department3, { SEND_MESSAGES: true, READ_MESSAGES: true })

            msg.channel.send("You have contacted out " + department3 + "\nPlease wait patiently for somone to reach out to you.")
        }

        });

    });

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
	
    const CMDLog = new Discord.RichEmbed()
        .setTitle(bot.settings.Commands_Log_Title)
        .addField(`User`, `<@${message.author.id}>`)
        .addField(`Command`, bot.settings.Ticket_Command, true)
        .addField(`Channel`, message.channel, true)
        .addField(`Executed At`, message.createdAt, true)
        .setColor(bot.settings.colour)
        .setFooter(bot.settings.footer)

    let CommandLog = message.guild.channels.find(LogsChannel => LogsChannel.name === `${bot.settings.Command_Log_Channel}`);
    if(!CommandLog) return message.channel.send(`:x: Error! Could not find the logs channel. **${bot.settings.Command_Log_Channel}**\nThis can be changed via ``settings.json```);
    
    CommandLog.send(CMDLog);
    }

exports.help = {
    name: bot.settings.Ticket_Command,
}
