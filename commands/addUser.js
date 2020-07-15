// SupportBot 6.0, Created by Emerald Services
// Add User

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.AddUser,
    description: supportbot.AddUserDesc,

    execute(message, args) {        
        console.log(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[32m`, `${message.author.tag} has executed ${supportbot.Prefix}${supportbot.AddUser}!`);

        let SupportStaff = message.guild.roles.cache.find(SupportTeam => SupportTeam.name === supportbot.Staff)
        let Admins = message.guild.roles.cache.find(AdminUser => AdminUser.name === supportbot.Admin)

        const NoPerms = new Discord.MessageEmbed()
            .setTitle("Invalid Permissions!")
            .setDescription(`${supportbot.IncorrectPerms}\n\nRole Required: \`${supportbot.Staff}\` or \`${supportbot.Admin}\``)
            .setColor(supportbot.WarningColour)

            if (!message.member.roles.cache.has(SupportStaff.id || Admins.id)) {
                if (!message.channel.name.startsWith( `${supportbot.TicketChannel}-` )) {
                    const Exists = new Discord.MessageEmbed()
                        .setTitle("No Ticket Found!")
                        .setDescription(`${supportbot.NoValidTicket}`)
                        .setColor(supportbot.WarningColour);
                    message.channel.send({ embed: Exists });
        
                    return;
                }
        
                let rUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
                    const UserNotExist = new Discord.MessageEmbed()
                        .setTitle("User Not Found!")
                        .setDescription(`${supportbot.UserNotFound}\n\nTry Again:\`${supportbot.Prefix}${supportbot.AddUser} <user#0000>\``)
                        .setColor(supportbot.ErrorColour)
        
                    if (!rUser) return message.channel.send({ embed: UserNotExist });
                
                        message.channel.updateOverwrite(rUser, {
                            VIEW_CHANNEL: true,
                            CREATE_INVITE: false,
                            SEND_MESSAGES: true,
                            READ_MESSAGES: true
                        });
                
                    const Complete = new Discord.MessageEmbed()
                        .setTitle("User Added!")
                        .setDescription(supportbot.AddedUser.replace(/%user%/g, rUser.id))
                        .setTimestamp()
                        .setColor(supportbot.EmbedColour)
                   message.channel.send({ embed: Complete });
            } else {
                
                return message.channel.send({ embed: NoPerms });

            }

    }
};
