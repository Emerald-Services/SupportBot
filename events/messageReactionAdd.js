// SupportBot 6.0, Created by Emerald Services
// Message Reaction Event

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));
const tickets = yaml.load(fs.readFileSync('./storage/ticketreaction.yml', 'utf8'));

module.exports = async (client, reaction, user) => {

    let message = {
        guild: reaction.message.channel.guild,
        author: user,
        content: "N/A",
        channel: reaction.message.channel
    }

    if (supportbot.ReactionTickets === true) {
        if (reaction.message.id === tickets.ReactionMessage_ID) {
            if (reaction.emoji.name == supportbot.ReactionEmoji || reaction.emoji.id == supportbot.ReactionEmoji) {
                await reaction.users.remove(user.id)

            	try {
            	    const cmd = client.commands.get(supportbot.NewTicket);
            	    if(!cmd) return;
            	    
            	    cmd.execute(message, message.content);
            	} catch (error) {
            	    console.error(error);
            	}
            }
        }
    }
};
