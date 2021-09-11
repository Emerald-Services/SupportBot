// SupportBot, Created by Emerald Services
// Blacklist Command

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const { execute } = require("./help");
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.BlacklistUser,
    description: supportbot.BlacklistDesc,

    execute(message, args) {
        if (supportbot.DeleteMessages) message.delete();

        let SupportStaff = message.guild.roles.cache.find(adminRole => adminRole.name === supportbot.Admin) || message.guild.roles.cache.find(adminRole => adminRole.id === supportbot.Admin)

        const NoPerms = new Discord.MessageEmbed()
            .setTitle("Invalid Permissions!")
            .setDescription(`${supportbot.IncorrectPerms}\n\nRole Required: \`${SupportStaff.name}\``)
            .setColor(supportbot.WarningColour)

        if (!message.member.roles.cache.has(SupportStaff.id)) {
            return message.channel.send({ embeds: [NoPerms] });
        }

        let locateChannel = message.guild.channels.cache.find(ModLogChannel => ModLogChannel.name === supportbot.ModLogChannel) || message.guild.channels.cache.find(ModLogChannel => ModLogChannel.id === supportbot.ModLogChannel)

        const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        const errornochannel = new Discord.MessageEmbed()
            .setTitle("Invalid Channel")
            .setDescription(`${supportbot.InvalidChannel}\n\nChannel Required: \`${supportbot.ModLogChannel}\``)
            .setColor(supportbot.ErrorColour);
    
        if(!locateChannel) return message.channel.send({ embeds: [errornochannel] });

        const embed1 = new Discord.MessageEmbed()
                .setDescription("> :x: Please mention or write an ID\n\n`Try Again!`")
	            .setColor(supportbot.ErrorColour)

        if (!args[0]) return message.channel.send({
                embeds: [embed1]
        });

        const embed2 = new Discord.MessageEmbed()
                .setDescription("> :detective: **Hmm!** Can\'t seem tp find this user.\n\n`Are they in the server?`")
	            .setColor(supportbot.EmbedColour)

        if (!user) return message.channel.send({
            embeds: [embed2]
        });

        let role = message.guild.roles.cache.find(role => role.name === supportbot.TicketBlackListRole) || message.guild.roles.cache.find(role => role.id === supportbot.TicketBlackListRole)

        const embed3 = new Discord.MessageEmbed()
            .setDescription("> :detective: **Hmm!** Can\'t seem to find the blacklist role.\n\n`Did you created it?")
            .setColor(supportbot.ErrorColour)
        

        if (!role) return message.channel.send({
            embeds: [embed3]
        });

        const embed4 = new Discord.MessageEmbed()
            .setDescription(`${user} is already blacklisted`)
            .setColor(supportbot.ErrorColour)
        
        if(user.roles.cache.find(role => role.name === supportbot.TicketBlackListRole) || user.roles.cache.find(role => role.id === supportbot.TicketBlackListRole)) {
            return message.channel.send({
                embeds: [embed4]
            })
        };

        user.roles.add(role);

        const embed5 = new Discord.MessageEmbed()
            .setDescription(`Blacklisted ${user} successfully from creating a ticket`)
            .setColor(supportbot.EmbedColour)

        message.channel.send({
            embeds: [embed5]
        });

        const logEmbed = new Discord.MessageEmbed()
                .setTitle(supportbot.BlacklistTitle)
                .setThumbnail(supportbot.ModThumbnail)
                .addField('Banned User:', user)
                .addField('Staff Member', message.author)
                .setFooter(supportbot.EmbedFooter)
                .setColor(supportbot.BlacklistColour)
                .setTimestamp()

        locateChannel.send({ embeds: [logEmbed] });

    }

};
