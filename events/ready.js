// SupportBot 6.0, Created by Emerald Services
// Ready Event

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));
const tickets = yaml.load(fs.readFileSync('./storage/ticketreaction.yml', 'utf8'));

  
module.exports = async (bot) => {
    bot.user.setActivity(supportbot.BotActivity, {
        type: supportbot.ActvityType
    });

    console.log(`\u001b[32m`, `―――――――――――――――――― SupportBot ――――――――――――――――――`)
    console.log(`\u001b[37m`, `${supportbot.Bot_Name} has successfully connected to discord`)
    console.log(`\u001b[32m`, `―――――――――――――――――― SupportBot ――――――――――――――――――`)

    if (supportbot.ReactionTickets === "true") {
        let chan1 = bot.channels.cache.find(channel => channel.name === supportbot.ReactionChannel)

        if (!chan1) {
            console.log('\u001b[33m', "[WARN] Ticket reaction panel is not setup, You can do so via the configuration file!")
            return false;
        }

        chan1.messages.fetch(tickets.ReactionMessage_ID).catch(r => {
            let embed = new Discord.MessageEmbed()
                .setTitle(supportbot.ReactionMessage.replace(/%reaction_emoji%/g, supportbot.ReactionEmoji))
                .setColor(supportbot.SuccessColour)
                .setFooter(supportbot.EmbedFooter);

            bot.channels.cache.find(channel => channel.name === supportbot.ReactionChannel).send({ 
                embed: embed 
            }).then(r => {
                let data = {
                    "ReactionMessage_ID": `${r.id}`
                }
                let yamlStr = yaml.dump(data);
                fs.writeFileSync('./storage/ticketreaction.yml', yamlStr, 'utf8');
                r.react(supportbot.ReactionEmoji)
            }).catch(e => {
                console.log(e)
            })
        })
    }

};