// SupportBot
// Created by © 2020 Emerald Services
// Command: Say

const Discord = require("discord.js");
const bot = new Discord.Client();

const fs = require("fs");
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

exports.run = (bot, message, args) => {

    console.log(`\u001b[33m`, `[${supportbot.Bot_Name}] > `, `\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${supportbot.Prefix}${supportbot.Ticket_Command}`);

    const ID = Math.floor(Math.random() * 10) + 2000;
    const subject = args.join(" ") || `${supportbot.Default_Ticket_Reason}`;

    const alreadyopen = new Discord.RichEmbed()
        .setDescription(`:x: Cannot create a ticket because **${supportbot.Ticket_Channel_Name}-${ID}** already exists.`)
        .setColor(supportbot.EmbedColour)
    
    if (message.guild.channels.find(TicketChannel => TicketChannel.name === `${supportbot.Ticket_Channel_Name}-` + message.author.username)) return message.channel.send(alreadyopen);
    
    message.guild.createChannel(`${supportbot.Ticket_Channel_Name}-${ID}`, {
        type: 'text',
    }).then(TicketChannel => {
        
    // Roles
        let staff = message.guild.roles.find(supportRole => supportRole.name === `${supportbot.StaffRole}`)
        let everyone = message.guild.roles.find(everyoneRole => everyoneRole.name === "@everyone")
        let department = message.guild.roles.find(DepartmentRole => DepartmentRole.name === `${supportbot.Department_Role_1}`)
        let department2 = message.guild.roles.find(DepartmentRole => DepartmentRole.name === `${supportbot.Department_Role_2}`)
        let department3 = message.guild.roles.find(DepartmentRole => DepartmentRole.name === `${supportbot.Department_Role_3}`)

    // Permissions
        TicketChannel.overwritePermissions(everyone, { SEND_MESSAGES: false, READ_MESSAGES: false })
        TicketChannel.overwritePermissions(department, { SEND_MESSAGES: false, READ_MESSAGES: false })
        TicketChannel.overwritePermissions(department2, { SEND_MESSAGES: false, READ_MESSAGES: false })
        TicketChannel.overwritePermissions(department3, { SEND_MESSAGES: false, READ_MESSAGES: false })
        TicketChannel.overwritePermissions(staff, { SEND_MESSAGES: true, READ_MESSAGES: true })
        TicketChannel.overwritePermissions(message.author, { SEND_MESSAGES: true, READ_MESSAGES: true })
        TicketChannel.overwritePermissions(bot.user, { SEND_MESSAGES: true, READ_MESSAGES: true })

    // Category
    let category = message.guild.channels.find(c => c.name === supportbot.category);
        if (category) {
            TicketChannel.setParent(category.id);
        } else {
            if (message.guild.channels.get(supportbot.category)) {
                TicketChannel.setParent(message.guild.channels.get(supportbot.category).id);
            }
        }
        
    const ticketopened = new Discord.RichEmbed()
        .setTitle(":white_check_mark: Support Ticket Created")
        .setDescription(`<@${message.author.id}> your support ticket created successfully`)
        .addField("Your Ticket:", `<#${TicketChannel.id}>`)
        .setColor(supportbot.Ticket_Colour)
    message.channel.send({embed: ticketopened});
    // Ticket Message - ( Able to edit this message via the settings.json file )
    const ticketMessage = `Hi! <@${message.author.id}>\n${supportbot.Ticket_Message}`;

    const Department_1 = supportbot.Ticket_Department_1;
    const Department_2 = supportbot.Ticket_Department_2;
    const Department_3 = supportbot.Ticket_Department_3;

    const Emoji_1 = supportbot.Ticket_Department_Emoji_1;
    const Emoji_2 = supportbot.Ticket_Department_Emoji_2;
    const Emoji_3 = supportbot.Ticket_Department_Emoji_3;

    const TicketMessage = new Discord.RichEmbed()
        .setDescription(ticketMessage, true)
        .addField("Available Departments", `${Emoji_1} ${Department_1}\n${Emoji_2} ${Department_2}\n${Emoji_3} ${Department_3}`)
        .setColor(supportbot.Ticket_Colour)
        .setFooter(supportbot.EmbedFooter)

        if (subject != 'No Subject.') {
            TicketMessage.addField("Reason", subject);
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

            msg.channel.send("You have contacted out " + department + "\nPlease wait patiently for someone to reach out to you.")
        }

        if (reaction.emoji.name === `${Emoji_2}`) {
			TicketChannel.overwritePermissions(staff, { SEND_MESSAGES: true, READ_MESSAGES: true })
            TicketChannel.overwritePermissions(department2, { SEND_MESSAGES: true, READ_MESSAGES: true })

            msg.channel.send("You have contacted out " + department2 + "\nPlease wait patiently for someone to reach out to you.")
        }

        if (reaction.emoji.name === `${Emoji_3}`) {
			TicketChannel.overwritePermissions(staff, { SEND_MESSAGES: true, READ_MESSAGES: true })
            TicketChannel.overwritePermissions(department3, { SEND_MESSAGES: true, READ_MESSAGES: true })

            msg.channel.send("You have contacted out " + department3 + "\nPlease wait patiently for someone to reach out to you.")
        }

        });

    });

    // Ticket Logging
    const logEmbed = new Discord.RichEmbed()
        .setTitle(":ticket: Logistics of your Ticket")
        .addField("Ticket ID", ID, true)
        .addField("User", `<@${message.author.id}>`, true)
        .addField("Channel", `ticket#${ID}`, true)
        .setColor(supportbot.EmbedColour)
        .setFooter(supportbot.EmbedFooter)

    if (subject != 'No Subject.') {
        logEmbed.addField('Subject', subject, true);
    }
  
    let logChannel = message.guild.channels.find(TicketChannel => TicketChannel.name === `${supportbot.Ticket_Logs}`);
    if(!logChannel) return message.channel.send(`:x: Error! Could not find the logs channel **${supportbot.Ticket_Logs}**`);
    
    logChannel.send({embed: logEmbed})

    }).catch(err=>{console.error(err)});
    
};

exports.help = {
    name: supportbot.Ticket_Command,
};
