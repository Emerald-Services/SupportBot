// SupportBot 6.0, Created by Emerald Services
// Help Command

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.HelpCommand,

    execute(message, args) {
        let generalCommands = "";
            generalCommands += `**${supportbot.Prefix}${supportbot.HelpCommand}** Lists all the bot commands\n`;
            generalCommands += `**${supportbot.Prefix}${supportbot.LinksCommand}** Get some important links\n`;
            generalCommands += `**${supportbot.Prefix}${supportbot.SuggestCommand}** Create a new suggestion\n`;
            generalCommands += `**${supportbot.Prefix}${supportbot.PingCommand}** Check bot's latency\n`;
        
        let supportCommands = "";
            supportCommands += `**${supportbot.Prefix}${supportbot.NewTicket} [reason]** Create a support ticket\n`
            supportCommands += `**${supportbot.Prefix}${supportbot.CloseTicket} [reason]** Close your support ticket\n`
        
        let staffCommands = "";
            staffCommands += `**${supportbot.Prefix}${supportbot.RenameTicket} <name>** Rename a valid support ticket\n`
            staffCommands += `**${supportbot.Prefix}${supportbot.AddUser} <user#0000>** Add a user to a valid support ticket\n`
            staffCommands += `**${supportbot.Prefix}${supportbot.RemoveUser} <user#0000>** Remove a user from a valid support ticket\n`
        
        let adminCommands = "";
            adminCommands += `**${supportbot.Prefix}${supportbot.AnnounceCommand}** Create a new server announcement\n`
            adminCommands += `**${supportbot.Prefix}${supportbot.SayCommand}** Send a message as the bot\n`
            
        const HelpCommandEmbed = new Discord.MessageEmbed()
            .setTitle(supportbot.Bot_Name)
            .setThumbnail(message.author.displayAvatarURL())

            .addFields(
                { name: '🖥️ General Commands', value: `${generalCommands}\n`, inline: false },
                { name: '🎫 Support Commands', value: `${supportCommands}\n`, inline: false },
                { name: '🔑 Staff Commands', value: `${staffCommands}\n`, inline: false },
                { name: '🔐 Admin Commands', value: `${adminCommands}`, inline: false },
            )

            .setColor(supportbot.EmbedColour)
            .setFooter(supportbot.EmbedFooter, message.author.displayAvatarURL());

	    message.channel.send({ embed: HelpCommandEmbed });
    }
};