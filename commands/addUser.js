// SupportBot 6.0, Created by Emerald Services
// Add User

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.AddUser,

    execute(message, args) {        
        console.log(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[32m`, `${message.author.tag} has executed ${supportbot.Prefix}${supportbot.AddUser}!`);

        let staffGroup = message.guild.roles.cache.find(staffRole => staffRole.name === supportbot.StaffRole);
            const NoPerms = new Discord.MessageEmbed()
                .setTitle("Invalid Permissions!")
                .setDescription(":warning: **Err!** You do not have the correct permissions to use this command.")
                .setColor(supportbot.WarningColour)
            message.channel.send({ embed: NoPerms });

        if (!message.channel.name.startsWith( `${supportbot.TicketChannel}-` )) {
            const Exists = new Discord.MessageEmbed()
                .setTitle("Incorrect Channel")
                .setDescription(`:warning: You cannot execute this command here. This command is used when closing a ticket.`)
                .setColor(supportbot.WarningColour);
            message.channel.send({ embed: Exists });

            return;
        }

        let rUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
            const UserNotExist = new Discord.MessageEmbed()
                .setTitle("User Not Found!")
                .setDescription(`:x: **Error!** This user doesn't exist, Are they in this server?\n\nTry Again:\`${supportbot.Prefix}${supportbot.AddUser} <user#0000>\``)
                .setColor(supportbot.ErrorColor)

            if (!rUser) return message.channel.send({ embed: UserNotExist });
        
                message.channel.updateOverwrite(rUser, {
                    VIEW_CHANNEL: true,
                    CREATE_INVITE: false,
                    SEND_MESSAGES: true,
                    READ_MESSAGES: true
                });
        
            const Complete = new Discord.MessageEmbed()
                .setTitle("User Added!")
                .setDescription(`👍 ${rUser} has been added to this ticket`)
                .setTimestamp()
                .setColor(supportbot.EmbedColour)
           message.channel.send({ embed: Complete });
    }
};
