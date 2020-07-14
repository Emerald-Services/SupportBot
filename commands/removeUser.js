// SupportBot 6.0, Created by Emerald Services
// Add User

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.RemoveUser,
    description: supportbot.RemoveUserDesc,

    execute(message, args) {        
        console.log(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[32m`, `${message.author.tag} has executed ${supportbot.Prefix}${supportbot.RemoveUser}!`);

        let SupportStaff = message.guild.roles.cache.find(staffRole => staffRole.name === supportbot.Staff);
        const NoPerms = new Discord.MessageEmbed()
            .setTitle("Invalid Permissions!")
            .setDescription(`${supportbot.IncorrectPerms}\n\nRole Required: \`${SupportStaff.name}\``)
            .setColor(supportbot.ErrorColour)

            if (!message.member.roles.cache.has(SupportStaff.id)) 
                return message.channel.send({ embed: NoPerms });

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
                .setDescription(`${supportbot.UserNotFound}\n\nTry Again:\`${supportbot.Prefix}${supportbot.RemoveUser} <user#0000>\``)
                .setColor(supportbot.ErrorColor)

            if (!rUser) return message.channel.send({ embed: UserNotExist });
        
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
           message.channel.send({ embed: Complete });
    }
};
