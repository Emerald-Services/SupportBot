// SupportBot | Emerald Services
// Ready Event

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./Data/supportbot.yml', 'utf8'));
const cmdconfig = yaml.load(fs.readFileSync('./Data/commands.yml', 'utf8'));
const panelconfig = yaml.load(fs.readFileSync('./Data/ticket-panel.yml', 'utf8'));

const Event = require("../Structures/Event.js");

module.exports = new Event("messageReactionAdd", async (client) => {

    let message = {
        guild: reaction.message.channel.guild,
        author: user,
        content: "N/A",
        channel: reaction.message.channel
    }

    if (panelconfig.TicketPanel) {
        if (reaction.message.id === panelconfig.TicketPanelID) {
            if (reaction.emoji.name == panelconfig.ButtonEmoji || reaction.emoji.id == panelconfig.ButtonEmoji) {
                await reaction.users.remove(user.id)

            	try {
            	    const cmd = client.commands.get(cmdconfig.OpenTicket);
            	    if(!cmd) return;
            	    
            	    cmd.run(message, message.content);
            	} catch (error) {
            	    console.error(error);
            	}
            }
        }
    }

});