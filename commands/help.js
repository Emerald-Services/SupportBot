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
	if (supportbot.DeleteMessages == "true") message.delete();
        
    console.log(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[32m`, `${message.author.tag} has executed ${supportbot.Prefix}${supportbot.HelpCommand}!`);
    
    if (supportbot.helpmenu_withkey = "true") {
        let generalCommands = "";
            generalCommands += `**${supportbot.Prefix}${supportbot.HelpCommand}** ${supportbot.HelpDesc}\n`;
            generalCommands += `**${supportbot.Prefix}${supportbot.LinksCommand}** ${supportbot.LinkDesc}\n`;
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
            staffCommands += `**${supportbot.Prefix}${supportbot.AnnounceCommand}** ${supportbot.AnnounceDesc} \`Admin Only\`\n` 
            staffCommands += `**${supportbot.Prefix}${supportbot.BanUser}** ${supportbot.BanDesc} \`Admin Only\` \n` 
            staffCommands += `**${supportbot.Prefix}${supportbot.KickUser}** ${supportbot.KickDesc} \`Admin Only\` \n` 
            staffCommands += `**${supportbot.Prefix}${supportbot.BlacklistUser}** ${supportbot.BlacklistDesc} \`Admin Only\` \n` 
            
        const HelpEmbed1 = new Discord.MessageEmbed()
            .setTitle(supportbot.Bot_Name)
            .setThumbnail(message.author.displayAvatarURL())

            .addFields(
                { name: '🖥️ General Commands\n', value: `${generalCommands}\n`, inline: false },
                { name: '🎫 Support Commands\n', value: `${supportCommands}\n`, inline: false },
            )

            .setColor(supportbot.EmbedColour)
            .setFooter(supportbot.EmbedFooter, message.author.displayAvatarURL());

            if (message.member.roles.cache.some(role => role.name === supportbot.Staff || supportbot.Admin)) {
                HelpEmbed1.addFields(
                    { name: '🔐 Staff Commands\n', value: `${staffCommands}\n`, inline: false },
                )
            }

	    message.channel.send({ 
            embed: HelpEmbed1
        });
    }

    }
};
