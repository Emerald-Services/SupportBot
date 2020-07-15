// SupportBot 6.0, Created by Emerald Services
// Bot Say Command

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const { execute } = require("./help");
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.BotSay,
    description: supportbot.BotSayDesc,

    execute(message, args) {

        let SupportStaff = message.guild.roles.cache.find(SupportTeam => SupportTeam.name === supportbot.Staff)
        let Admins = message.guild.roles.cache.find(AdminUser => AdminUser.name === supportbot.Admin)

        const NoPerms = new Discord.MessageEmbed()
            .setTitle("Invalid Permissions!")
            .setDescription(`${supportbot.IncorrectPerms}\n\nRole Required: \`${supportbot.Staff}\` or \`${supportbot.Admin}\``)
            .setColor(supportbot.WarningColour)

            if (!message.member.roles.cache.has(SupportStaff.id || Admins.id)) {

                const BotSpeaks = agrs.join(" ");

                const Speaking = new Discord.MessageEmbed()
                    .setDescription(args.join)
                    .setColor(supportbot.EmbedColour)
                message.channel.send({ embed: Speaking })        

            } else {

                return message.channel.send({ embed: NoPerms });

            }

    }
    
};