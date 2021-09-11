// SupportBot, Created by Emerald Services
// Help Command

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.HelpCommand,
    description: supportbot.HelpDesc,

    
    execute(message, args) {
	if (supportbot.DeleteMessages) message.delete();

    let SupportStaff = message.guild.roles.cache.find(adminRole => adminRole.name === supportbot.Staff) || message.guild.roles.cache.find(staffRole => staffRole.id === supportbot.Staff);
    let AdminStaff = message.guild.roles.cache.find(adminRole => adminRole.name === supportbot.Admin) || message.guild.roles.cache.find(adminRole => adminRole.id === supportbot.Admin);
        
    if (supportbot.HelpMenu) {
        let generalCommands = "";
            generalCommands += `**${supportbot.Prefix}${supportbot.HelpCommand}** ${supportbot.HelpDesc}\n`;
            generalCommands += `**${supportbot.Prefix}${supportbot.LinksCommand}** ${supportbot.LinksDesc}\n`;
            generalCommands += `**${supportbot.Prefix}${supportbot.SuggestCommand}** ${supportbot.SuggestionDesc}\n`;
            generalCommands += `**${supportbot.Prefix}${supportbot.PingCommand}** ${supportbot.PingDesc}\n`;
        
        let supportCommands = "";
            supportCommands += `**${supportbot.Prefix}${supportbot.NewTicket} [reason]** ${supportbot.NewTicketDesc}\n`
            supportCommands += `**${supportbot.Prefix}${supportbot.CloseTicket} [reason]** ${supportbot.CloseTicketDesc}\n`
        
        let staffCommands = "";
            staffCommands += `**${supportbot.Prefix}${supportbot.AddUser} <user#0000>** ${supportbot.AddUserDesc}\n`
            staffCommands += `**${supportbot.Prefix}${supportbot.RemoveUser} <user#0000>** ${supportbot.RemoveUserDesc}\n`
            staffCommands += `**${supportbot.Prefix}${supportbot.BotSay}** ${supportbot.BotSayDesc}\n` 
            staffCommands += `**${supportbot.Prefix}${supportbot.PurgeMessage}** ${supportbot.PurgeDesc}\n` 
            staffCommands += `**${supportbot.Prefix}${supportbot.ChatLog}** ${supportbot.ChatLogDesc}\n` 
	    
        let adminCommands = "";
            adminCommands += `**${supportbot.Prefix}${supportbot.AnnounceCommand}** ${supportbot.AnnounceDesc} \`Admin Only\`\n` 
            adminCommands += `**${supportbot.Prefix}${supportbot.BanUser}** ${supportbot.BanDesc} \`Admin Only\` \n` 
            adminCommands += `**${supportbot.Prefix}${supportbot.KickUser}** ${supportbot.KickDesc} \`Admin Only\` \n` 
            adminCommands += `**${supportbot.Prefix}${supportbot.BlacklistUser}** ${supportbot.BlacklistDesc} \`Admin Only\` \n`
            
        const HelpEmbed1 = new Discord.MessageEmbed()
            .setTitle(supportbot.Bot_Name)
            .setThumbnail(message.author.displayAvatarURL())

            .addFields(
                { name: '🖥️ General Commands\n', value: `${generalCommands}\n`, inline: false },
                { name: '🎫 Support Commands\n', value: `${supportCommands}\n`, inline: false },
            )

            .setColor(supportbot.EmbedColour)
            .setFooter(supportbot.EmbedFooter, message.author.displayAvatarURL());

            if (message.member.roles.cache.has(SupportStaff.id)) {
                HelpEmbed1.addFields(
                    { name: '🔐 Staff Commands\n', value: `${staffCommands}\n`, inline: false },
                )
            }
	    
            if (message.member.roles.cache.has(AdminStaff.id)) {
                HelpEmbed1.addFields(
                    { name: '🔐 Admin Commands\n', value: `${adminCommands}\n`, inline: false },
                )
            }

        if (supportbot.SendHelpPage === "dm") {
            message.author.send({ 
                embeds: [HelpEmbed1]
            });
        }

        if (supportbot.SendHelpPage === "channel") {
            message.channel.send({ 
                embeds: [HelpEmbed1]
            });
        }


    }

    }
};
