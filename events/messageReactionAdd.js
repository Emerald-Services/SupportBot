// SupportBot 6.0, Created by Emerald Services
// Message Reaction Event

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));
const tickets = yaml.load(fs.readFileSync('./storage/ticketreaction.yml', 'utf8'));
const verif = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = async (client, reaction, user) => {

    let message = {
        guild: reaction.message.channel.guild,
        author: user,
        content: "Not available",
        channel: reaction.message.channel
    }

    if (supportbot.ReactionTickets === "true") {
        if (reaction.message.id === tickets.ReactionMessage_ID) {
            switch (reaction.emoji.id) {
                case supportbot.ReactionEmoji: {
                    await reaction.users.remove(user.id)

                    try {
                        const cmd = client.commands.get("ticket");
                        if(!cmd) return;

                        cmd.execute(message, "undefined");
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
        }
    }

    if (supportbot.Verification === "true") {
        if (reaction.message.id === verif.verification_msg) {
            switch (reaction.emoji.id) {
                case supportbot.VerificationEmoji: {
                    await reaction.users.remove(user.id)

                    let r = reaction.message.channel.guild.roles.cache.find(r => r.name === "verified")

                    await reaction.message.channel.guild.members.cache.get(user.id).roles.add(r)

                }
            }
        }
    }
};
