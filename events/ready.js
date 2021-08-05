// SupportBot 6.0, Created by Emerald Services
// Ready Event

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));
const tickets = yaml.load(fs.readFileSync('./storage/ticketreaction.yml', 'utf8'));

  
module.exports = async (bot) => {
    bot.user.setActivity(supportbot.BotActivity, {
        type: supportbot.ActivityType, 
        url: supportbot.StreamingURL
        
    });
    
    console.log(`\u001b[32m`, `┏━━━┓╋╋╋╋╋╋╋╋╋╋╋╋╋┏┓┏━━┓╋╋╋┏┓`)
    console.log(`\u001b[32m`, `┃┏━┓┃╋╋╋╋╋╋╋╋╋╋╋╋┏┛┗┫┏┓┃╋╋┏┛┗┓`)
    console.log(`\u001b[32m`, `┃┗━━┳┓┏┳━━┳━━┳━━┳┻┓┏┫┗┛┗┳━┻┓┏┛`)
    console.log(`\u001b[32m`, `┗━━┓┃┃┃┃┏┓┃┏┓┃┏┓┃┏┫┃┃┏━┓┃┏┓┃┃`)
    console.log(`\u001b[32m`, `┃┗━┛┃┗┛┃┗┛┃┗┛┃┗┛┃┃┃┗┫┗━┛┃┗┛┃┗┓`)
    console.log(`\u001b[32m`, `┗━━━┻━━┫┏━┫┏━┻━━┻┛┗━┻━━━┻━━┻━┛`)
    console.log(`\u001b[32m`, `┗╋╋╋╋╋╋╋┃┃╋┃┃`)
    console.log(`\u001b[32m`, `╋╋╋╋╋╋╋┗┛╋┗┛`)
    console.log(`	`)
    console.log(`\u001b[31m`, `――――――――――――――――――――――――――――――――――――――――――――`)
    console.log(`	`)
    console.log(`\u001b[33m`, `${supportbot.Bot_Name} v${supportbot.SupportBot_Version}`, `\u001b[36m`, `Connected to Discord`)
    console.log(`\u001b[33m`, `Documentation:`, `\u001b[36m`, `https://docs.emeraldsrv.dev`)
    console.log(`\u001b[33m`, `Discord:`, `\u001b[36m`, `https://emeraldsrv.dev/discord`)
    console.log(`\u001b[33m`, `Hosting:`, `\u001b[36m`, `https://emeraldsrv.dev/hosting`)
    console.log(`	`)
    console.log(`\u001b[37m`, `SupportBot proudly created by Emerald Services`)
    console.log(`	`)
    console.log(`\u001b[31m`, `――――――――――――――――――――――――――――――――――――――――――――`)
    

    
    if (supportbot.ReactionTickets === true) {
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
            
            if (supportbot.ReactionPanel_Description === true) {
                embed.setDescription(supportbot.ReactionDescription)
            }
            
            if (supportbot.ReactionPanel_Thumbnail === true) {
                embed.setThumbnail(supportbot.ReactionThumbnail)
            }

            if (supportbot.ReactionPanel_Image === true) {
                embed.setImage(supportbot.ReactionImage)
            }
            
            bot.channels.cache.find(channel => channel.name === supportbot.ReactionChannel).send({ 
                embed: embed 
            }).then(r => {
                let data = {
                    "ReactionMessage_ID": `${r.id}`
                }
                let yamlStr = yaml.dump(data);
                fs.writeFileSync('./storage/ticketreaction.yml', yamlStr, 'utf8');
                
                r.react(supportbot.ReactionEmoji);
            }).catch(e => {
                console.log(e)
            })
        })
    }


};
