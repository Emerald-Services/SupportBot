// SupportBot | Emerald Services
// Info Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./Data/supportbot.yml', 'utf8'));
const cmdconfig = yaml.load(fs.readFileSync('./Data/commands.yml', 'utf8'));

const Command = require("../Structures/Command.js");

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
  }

module.exports = new Command({
	name: cmdconfig.TicketAdd,
	description: cmdconfig.TicketAddDesc,
	type: "BOTH",
	slashCommandOptions: [],
	permission: "SEND_MESSAGES",

	async run(message, args, client) {

        let SupportStaff = message.guild.roles.cache.find(SupportTeam => SupportTeam.name === supportbot.Staff) || message.guild.roles.cache.find(SupportTeam => SupportTeam.id === supportbot.Staff)
        let Admins = message.guild.roles.cache.find(AdminUser => AdminUser.name === supportbot.Admin) || message.guild.roles.cache.find(AdminUser => AdminUser.id === supportbot.Admin)

        const NoPerms = new Discord.MessageEmbed()
            .setTitle("Invalid Permissions!")
            .setDescription(`${supportbot.IncorrectPerms}\n\nRole Required: \`${supportbot.Staff}\` or \`${supportbot.Admin}\``)
            .setColor(supportbot.WarningColour)

            if (message.member.roles.cache.has(SupportStaff.id) || message.member.roles.cache.has(Admins.id)) {
                if (!message.channel.name.startsWith( `${supportbot.TicketChannel}-` )) {
                    const Exists = new Discord.MessageEmbed()
                        .setTitle("No Ticket Found!")
                        .setDescription(`${supportbot.NoValidTicket}`)
                        .setColor(supportbot.WarningColour);
                    message.channel.send({ embeds: [Exists] });
        
                    return;
                }
        
                let uMember = message.mentions.users.first();
                    const UserNotExist = new Discord.MessageEmbed()
                        .setTitle("User Not Found!")
                        .setDescription(`${supportbot.UserNotFound}\n\nTry Again:\`${supportbot.Prefix}${cmdconfig.TicketAdd} <user#0000>\``)
                        .setColor(supportbot.ErrorColour)
        
                    if (!uMember) return message.channel.send({ embeds: [UserNotExist] });
                
                        message.channel.permissionOverwrites.edit(uMember, {
                            VIEW_CHANNEL: true,
                            READ_MESSAGE_HISTORY: true,
                            SEND_MESSAGES: true,
                        });
                
                    const Complete = new Discord.MessageEmbed()
                        .setTitle("User Added!")
                        .setDescription(supportbot.AddedUser.replace(/%user%/g, uMember.id))
                        .setTimestamp()
                        .setColor(supportbot.EmbedColour)
                   message.channel.send({ embeds: [Complete] });
            } else {
                
                return message.channel.send({ embeds: [NoPerms] });

            }

    }

});