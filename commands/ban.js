// SupportBot, Created by Emerald Services
// Say Command

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const { execute } = require("./help");
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.BanUser,
    description: supportbot.BanDesc,

    execute(message, args, member) {
	if (supportbot.DeleteMessages) message.delete();
	    
        let SupportStaff = message.guild.roles.cache.find(adminRole => adminRole.name === supportbot.Admin) || message.guild.roles.cache.find(adminRole => adminRole.id === supportbot.Admin)

        const NoPerms = new Discord.MessageEmbed()
            .setTitle("Invalid Permissions!")
            .setDescription(`${supportbot.IncorrectPerms}\n\nRole Required: \`${SupportStaff.name}\``)
            .setColor(supportbot.WarningColour)

            if (!message.member.roles.cache.has(SupportStaff.id)) 
                return message.channel.send({ embed: NoPerms });

            let locateChannel = message.guild.channels.cache.find(ModLogChannel => ModLogChannel.name === supportbot.ModLogChannel) || message.guild.channels.cache.find(ModLogChannel => ModLogChannel.id === supportbot.ModLogChannel)

        const errornochannel = new Discord.MessageEmbed()
            .setTitle("Invalid Channel")
            .setDescription(`${supportbot.InvalidChannel}\n\nChannel Required: \`${supportbot.ModLogChannel}\``)
            .setColor(supportbot.ErrorColour);
    
            if(!locateChannel) return message.channel.send({ embed: errornochannel });

            const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

            const embed1 = new Discord.MessageEmbed()
                .setDescription("> :x: Please provide a reason to ban.\n\n`Try Again!`")
	            .setColor(supportbot.ErrorColour)

            if (!args[0]) return message.channel.send({
                embed: embed1
            });

            const embed2 = new Discord.MessageEmbed()
                .setDescription("> :detective: **Hmm!** Can\'t seem tp find this user.\n\n`Are they in the server?`")
	            .setColor(supportbot.EmbedColour)

            if (!user) return message.channel.send({
                embed: embed2
            })

            const embed3 = new Discord.MessageEmbed()
                .setDescription("> :x: **Err No!** Cannot punish this user!\n\n`Reason: Their permissions and or roles are greater than mine.`")
	            .setColor(supportbot.EmbedColour)

            if(!user.bannable) return message.channel.send({
                embed: embed3
            });

            const embed4 = new Discord.MessageEmbed()
                .setDescription("> :joy: **OML!** Did you really just try to ban yourself!")
	            .setColor(supportbot.EmbedColour)

            if(user.id === message.author.id) return message.channel.send({
                embed: embed4
            });

            let reason = args.slice(1).join(" ");

            if(!reason) reason = 'No Reason Provided.';

            const embed5 = new Discord.MessageEmbed()
                .setDescription("> :thinking: **Hmm** Something seems to have gone wrong.\n\n`Check your system for errors!`")
	            .setColor(supportbot.EmbedColour)

                  user.ban({ days: supportbot.DaysBannedFor, reason: `${reason}` }).catch(err => { 
                    message.channel.send({ embed: embed5 })
                      console.log(err)
                  })


            const successEmbed = new Discord.MessageEmbed()
                .setDescription(`> :white_check_mark: **OOF!** ${user} has been banned!`)
                .setColor(supportbot.SuccessColour)
            message.channel.send({
                embed: successEmbed
            })

            const logEmbed = new Discord.MessageEmbed()
                .setTitle(supportbot.BanTitle)
                .setThumbnail(supportbot.ModThumbnail)
                .addField('Banned User:', user)
                .addField('Staff Member', message.author)
                .addField('Reason:', reason)
                .setFooter(supportbot.EmbedFooter)
                .setColor(supportbot.BanLogColour)
                .setTimestamp()

                locateChannel.send({ embed: logEmbed })
    


    } 
    
};
