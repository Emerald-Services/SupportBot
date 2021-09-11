// SupportBot, Created by Emerald Services
// Remove User

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.RemoveUser,
    description: supportbot.RemoveUserDesc,

    execute(message, args) {        
        if (supportbot.DeleteMessages) message.delete();
        
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
        
                let rUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
                    const UserNotExist = new Discord.MessageEmbed()
                        .setTitle("User Not Found!")
                        .setDescription(`${supportbot.UserNotFound}\n\nTry Again:\`${supportbot.Prefix}${supportbot.RemoveUser} <user#0000>\``)
                        .setColor(supportbot.ErrorColour)
        
                    if (!rUser) return message.channel.send({ embeds: [UserNotExist] });
                
                        message.channel.updateOverwrite(rUser, {
                            VIEW_CHANNEL: false,
                            CREATE_INVITE: false,
                            SEND_MESSAGES: false,
                            READ_MESSAGES: false
                        });
                
                    const Complete = new Discord.MessageEmbed()
                        .setTitle("User Removed!")
                        .setDescription(supportbot.RemovedUser.replace(/%user%/g, rUser.id))
                        .setTimestamp()
                        .setColor(supportbot.EmbedColour)
                   message.channel.send({ embeds: [Complete] });
            } else {
                return message.channel.send({ embeds: [NoPerms] });
            }

    }
};
