// SupportBot, Created by Emerald Services
// Announce

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const { execute } = require("./help");
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.ChatLog,
    description: supportbot.ChatLogDesc,

    execute(message, args) {
        if (supportbot.DeleteMessages) message.delete();

        let name = message.channel.name;
    
        message.channel.messages.fetch({ limit: 100 }).then( msgs => {
            let html = '';
    
            msgs = msgs.sort( ( a, b ) => a.createdTimestamp - b.createdTimestamp );
            html += `<strong>--- Channel Transcript ---</strong><br>`;
            html += `<strong>Server Name:</strong> ${message.guild.name}<br>`;
            html += `<strong>Channel:</strong> ${name}<br>`;
            html += `<strong>Message:</strong> ${msgs.size} Messages<br><br><br>`;
    
            msgs.forEach( msg => {
                if ( msg.content ) {
                    html += `<strong>User:</strong> ${msg.author.tag}<br>`;
                    html += `<strong>Message:</strong> ${msg.content}<br>`;
                    html += `-----<br><br>`;
                }
            });
    
            const TranscriptSavedEmbed = new Discord.MessageEmbed()
              .setDescription(supportbot.ChatLogSavedMessage)
              .setColor(supportbot.SuccessColour)
            message.channel.send({embed: TranscriptSavedEmbed})

            const errornochannel = new Discord.MessageEmbed()
                .setTitle("SupportBot Error!")
                .setDescription(`:x: **Error!** Channel not Found, This command cannot be executed proberbly as their is no channel within this server.\nThis is configurable via **supportbot-config.yml**\n\nChannel Required: \`${supportbot.TicketLog}\`\n\nError Code: \`SB-03\``)
                .setColor(supportbot.ErrorColour);
  
            const ChatLogs = new Discord.MessageEmbed()
                .setTitle(supportbot.ChatLog_Title)
                .setThumbnail(supportbot.ChatLog_Thumbnail)
                .addFields(
                    { name: 'Channel', value: `<#${message.channel.id}>` },
                    { name: 'User', value: `<@${message.author.id}>` },
                )
                .setColor(supportbot.EmbedColour)
                .setFooter(supportbot.EmbedFooter)

            let locateChannel = message.guild.channels.cache.find(LocateChannel => LocateChannel.name === supportbot.ChatLogChannel) || message.guild.channels.cache.find(LocateChannel => LocateChannel.id === supportbot.ChatLogChannel)
  
            if(!locateChannel) return message.channel.send({ embed: errornochannel });
    
            locateChannel.send( new Discord.MessageAttachment( Buffer.from( html ), `${name}.html` ) );
            locateChannel.send({ embed: ChatLogs });
    
        })
    }
}