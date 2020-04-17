// SupportBot
// Created by © 2020 Emerald Services
// Command: Ticket

const Discord = require("discord.js");
const bot = new Discord.Client();

const fs = require("fs");
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));
const TicketNumberID = require('../utility/TicketNumber');

exports.run = async (bot, message, args) => {

    console.log(`\u001b[33m`, `[${supportbot.Bot_Name}] > `, `\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${supportbot.Prefix}${supportbot.Ticket_Command}`);
	
    // Ticket Number ID Settings
	let ticketNumberID = TicketNumberID.pad(message.guild.id);
	
    // Ticket Subject Settings
	const subject = args.join(" ") || `${supportbot.Default_Ticket_Reason}`;

    // Ticket Limitiations
	const alreadyopen = new Discord.MessageEmbed()
        	.setDescription(`:x: Cannot create a ticket because **${supportbot.Ticket_Channel_Name}-${ticketNumberID}** already exists.`)
        	.setColor(supportbot.EmbedColour)
    
    // Ticket Creation
    	if (message.guild.channels.cache.find(TicketChannel => TicketChannel.name === `${supportbot.Ticket_Channel_Name}-` + message.author.username)) return message.channel.send(alreadyopen);
    		message.guild.channels.create(`${supportbot.Ticket_Channel_Name}-${ticketNumberID}`, {
			type: 'text',
		}).then(TicketChannel => {
        
    // Roles
        let staff = message.guild.roles.cache.find(supportRole => supportRole.name === `${supportbot.StaffRole}`)
        let everyone = message.guild.roles.cache.find(everyoneRole => everyoneRole.name === supportbot.everyone)
        let department = message.guild.roles.cache.find(DepartmentRole => DepartmentRole.name === `${supportbot.Department_Role_1}`)
        let department2 = message.guild.roles.cache.find(DepartmentRole => DepartmentRole.name === `${supportbot.Department_Role_2}`)
        let department3 = message.guild.roles.cache.find(DepartmentRole => DepartmentRole.name === `${supportbot.Department_Role_3}`)

    // Permissions
        TicketChannel.updateOverwrite(everyone, { VIEW_CHANNEL: false });
        TicketChannel.updateOverwrite(message.author, { VIEW_CHANNEL: true, CREATE_INVITE: false, SEND_MESSAGES: false, READ_MESSAGES: true });
        TicketChannel.updateOverwrite(staff, { VIEW_CHANNEL: true, CREATE_INVITE: false, CREATE_INVITE: false, SEND_MESSAGES: true, READ_MESSAGES: true });
        TicketChannel.updateOverwrite(department, { VIEW_CHANNEL: true, CREATE_INVITE: false, SEND_MESSAGES: true, READ_MESSAGES: true });
        TicketChannel.updateOverwrite(department2, { VIEW_CHANNEL: true, CREATE_INVITE: false, SEND_MESSAGES: true, READ_MESSAGES: true });
        TicketChannel.updateOverwrite(department3, { VIEW_CHANNEL: true, CREATE_INVITE: false, SEND_MESSAGES: true, READ_MESSAGES: true });

    // Category
    let category = message.guild.channels.cache.find(c => c.name === supportbot.category);
        if (category) {
            TicketChannel.setParent(category.id);
        } else {
            if (message.guild.channels.cache.get(supportbot.category)) {
                TicketChannel.setParent(message.guild.channels.cache.get(supportbot.category).id);
            }
        }
        
    const ticketopened = new Discord.MessageEmbed()
        .setTitle(":white_check_mark: Support Ticket Created")
        .setDescription(`<@${message.author.id}> your support ticket created successfully`)
        .addField("Your Ticket:", `<#${TicketChannel.id}>`)
        .setColor(supportbot.SuccessColour)
    message.channel.send({embed: ticketopened});
    // Ticket Message - ( Able to edit this message via the settings.json file )
    const ticketMessage = `Hi! <@${message.author.id}>\n${supportbot.Ticket_Message}`;

    const Department_1 = supportbot.Ticket_Department_1;
    const Department_2 = supportbot.Ticket_Department_2;
    const Department_3 = supportbot.Ticket_Department_3;

    const Emoji_1 = supportbot.Ticket_Department_Emoji_1;
    const Emoji_2 = supportbot.Ticket_Department_Emoji_2;
    const Emoji_3 = supportbot.Ticket_Department_Emoji_3;

    const TicketMessage = new Discord.MessageEmbed()
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
            TicketChannel.updateOverwrite(message.author, { VIEW_CHANNEL: true, CREATE_INVITE: false, SEND_MESSAGES: true, READ_MESSAGES: true });
			TicketChannel.updateOverwrite(staff, { VIEW_CHANNEL: true, CREATE_INVITE: false, SEND_MESSAGES: true, READ_MESSAGES: true });
			TicketChannel.updateOverwrite(department, { VIEW_CHANNEL: true, CREATE_INVITE: false, SEND_MESSAGES: true, READ_MESSAGES: true });
			
            const dept1 = new Discord.MessageEmbed()
                .setDescription(`You have requested to contact ${department}. Please wait patiently for someone to reach out to you.`)
                .setColor(supportbot.SuccessColour)
            TicketChannel.send(dept1)
        }

        if (reaction.emoji.name === `${Emoji_2}`) {
            TicketChannel.updateOverwrite(message.author, { VIEW_CHANNEL: true, CREATE_INVITE: false, SEND_MESSAGES: true, READ_MESSAGES: true });
			TicketChannel.updateOverwrite(staff, { VIEW_CHANNEL: true, CREATE_INVITE: false, SEND_MESSAGES: true, READ_MESSAGES: true });
			TicketChannel.updateOverwrite(department2, { VIEW_CHANNEL: true, CREATE_INVITE: false, SEND_MESSAGES: true, READ_MESSAGES: true });

            const dept2 = new Discord.MessageEmbed()
                .setDescription(`You have requested to contact ${department2}. Please wait patiently for someone to reach out to you.`)
                .setColor(supportbot.SuccessColour)
            TicketChannel.send(dept2)
        }

        if (reaction.emoji.name === `${Emoji_3}`) {
            TicketChannel.updateOverwrite(message.author, { VIEW_CHANNEL: true, CREATE_INVITE: false, SEND_MESSAGES: true, READ_MESSAGES: true });
			TicketChannel.updateOverwrite(staff, { VIEW_CHANNEL: true, CREATE_INVITE: false, SEND_MESSAGES: true, READ_MESSAGES: true });
			TicketChannel.updateOverwrite(department3, { VIEW_CHANNEL: true, CREATE_INVITE: false, SEND_MESSAGES: true, READ_MESSAGES: true });
			
            const dept3 = new Discord.MessageEmbed()
                .setDescription(`You have requested to contact ${department3}. Please wait patiently for someone to reach out to you.`)
                .setColor(supportbot.SuccessColour)
            TicketChannel.send(dept3)
        }

        });

    });

    // Ticket Logging
    const logEmbed = new Discord.MessageEmbed()
        .setTitle(":ticket: Ticket Log")
        .addField("Ticket ID", ticketNumberID, true)
        .addField("User", `<@${message.author.id}>`, true)
        .addField("Channel", `ticket#${ticketNumberID}`, true)
        .setColor(supportbot.EmbedColour)
        .setFooter(supportbot.EmbedFooter)

    if (subject != 'No Subject.') {
        logEmbed.addField('Subject', subject, true);
    }
  
    let locateChannel = message.guild.channels.cache.find(LocateChannel => LocateChannel.name === `${supportbot.Ticket_Logs}`)

    const errornochannel = new Discord.MessageEmbed()
        .setTitle("SupportBot Error!")
        .setDescription(`:x: **Error!** Channel not Found, This command cannot be executed proberbly as their is no channel within this server.\nThis is configurable via **supportbot-config.yml**\n\nChannel Required: \`${supportbot.Ticket_Logs}\`\n\nError Code: \`SB-03\``)
        .setColor(supportbot.ErrorColour);
    if(!locateChannel) return message.channel.send(errornochannel);
        
    locateChannel.send(logEmbed)

    }).catch(err=>{console.error(err)});
    
};

exports.help = {
    name: supportbot.Ticket_Command,
};
