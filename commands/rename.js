// SupportBot
// Command: Close Ticket

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

exports.run = (bot, message, args) => {
    message.delete();

	let staffGroup = message.guild.roles.find(staffRole => staffRole.name === bot.settings.staff)

	const rolemissing = new Discord.RichEmbed()
		.setDescription(`:x: Looks like this server doesn't have the role **${bot.settings.staff}**`)
		.setColor(bot.settings.colour) 
	if (!staffGroup) return message.reply({embed: rolemissing});

	const donothaverole = new Discord.RichEmbed()
		.setDescription(`:x: Sorry! You cannot use this command with the role **${bot.settings.staff}**`)
		.setColor(bot.settings.colour) 
	if (!message.member.roles.has(staffGroup.id)) return message.reply({embed: donothaverole});
	
    const outsideticket = new Discord.RichEmbed()
		.setDescription(`:x: Cannot use this command becase you are outside a ticket channel.`)
		.setColor(bot.settings.colour) 
	if (!message.channel.name.startsWith(`ticket-`)) return message.channel.send({embed: outsideticket});
	const renameto = args.join(" ")
	message.channel.setName(`ticket-${renameto}`)
	
    // Renamed Ticket Logistic   
	const logEmbed = new Discord.RichEmbed()
        .setTitle(":ticket: Ticket Renamed")
		.setDescription(`<@${message.author.id}> has renamed a ticket to ${renameto}`)
        .setColor(bot.settings.colour)
        .setFooter(bot.settings.footer)
  
    let logChannel = message.guild.channels.find(TicketChannel => TicketChannel.name === `${bot.settings.Ticket_Logs}`);
    if(!logChannel) return message.channel.send(`:x: Error! Could not find the logs channel **${bot.settings.Ticket_Logs}**`);
    
    logChannel.send({embed: logEmbed})
	
    console.log(`\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.Rename_Command}`)

    const CMDLog = new Discord.RichEmbed()
        .setTitle(bot.settings.Commands_Log_Title)
        .addField(`User`, `<@${message.author.id}>`)
        .addField(`Command`, bot.settings.Rename_Command, true)
        .addField(`Channel`, message.channel, true)
        .addField(`Executed At`, message.createdAt, true)
        .setColor(bot.settings.colour)
        .setFooter(bot.settings.footer)

    let CommandLog = message.guild.channels.find(LogsChannel => LogsChannel.name === `${bot.settings.Command_Log_Channel}`);
    if(!CommandLog) return message.channel.send(`:x: Error! Could not find the logs channel. **${bot.settings.Command_Log_Channel}**\nThis can be changed via ``settings.json```);
    
    CommandLog.send(CMDLog);

}

exports.help = {
    name: bot.settings.Rename_Command,
}
