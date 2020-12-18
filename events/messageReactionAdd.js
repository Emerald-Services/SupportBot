// SupportBot 6.0, Created by Emerald Services
// Message Reaction Event

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));
const tickets = yaml.load(fs.readFileSync('./storage/ticketreaction.yml', 'utf8'));

const reacted = [];

module.exports = async (bot, message) => {

    // Ticket Creation Panel
    // This is an embed message where users are able to react and a ticket is created in return.

    bot.on('messageReactionAdd', async (reaction, user) => {


        if (supportbot.ReactionTickets === "true") { 

            

            if (reaction.message.id === tickets.ReactionMessage_ID) {

                let user = await reaction.message.guild.members.fetch(user);

                switch (reaction.emoji.id) {
                    case supportbot.ReactionEmoji: {
                        reaction.message.guild.members.fetch(user).then(r => {
                            reaction.users.remove(r.id)
                        });
                    
                        const ticketCMD = supportbot.NewTicket;
                        try {
                            const cmd = bot.commands.get("ticket");
                            if(!cmd) return;
                            console.log("1")
                            cmd.execute(bot, message);
                        } catch (error) {
	                        console.error(error);
                        }
                            
                    }
                }
            }
            
        }

    })

};
