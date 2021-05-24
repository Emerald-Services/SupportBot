// SupportBot, Created by Emerald Services
// Say Command

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const { execute } = require("./help");
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.BotSay,
    description: supportbot.BotSayDesc,

    execute(message, args) {
	if (supportbot.DeleteMessages) message.delete();
	    
        let SupportStaff = message.guild.roles.cache.find(adminRole => adminRole.name === supportbot.Staff) || message.guild.roles.cache.find(adminRole => adminRole.id === supportbot.Staff)

        console.log(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[32m`, `${message.author.tag} has executed ${supportbot.Prefix}${supportbot.BotSay}!`);

        const NoPerms = new Discord.MessageEmbed()
            .setTitle("Invalid Permissions!")
            .setDescription(`${supportbot.IncorrectPerms}\n\nRole Required: \`${SupportStaff.name}\``)
            .setColor(supportbot.WarningColour)

            if (!message.member.roles.cache.has(SupportStaff.id)) 
                return message.channel.send({ embed: NoPerms });


            const embed = new Discord.MessageEmbed()
                .setDescription(`> **What would you like me to say!**`)
	            .setColor(supportbot.EmbedColour)
            message.channel.send({ embed: embed });

            let announcement = []
            message.channel.awaitMessages(response => response.content.length > 2, {
                max: 1,
                time: 500000,
                errors: ['time'],
            }).then((collected) => {
                announcement.push(collected.map(r => r.content));

                const AnnouncementEmbed = new Discord.MessageEmbed()
                    .setDescription(announcement)
                    .setColor(supportbot.EmbedColour)
                
                message.channel.send({ embed: AnnouncementEmbed })
        })

    } 
    
};
