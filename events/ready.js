// SupportBot Created by Emerald Services
// Ready Event

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

  
module.exports = async (bot) => {
    bot.user.setActivity(supportbot.BotActivity, {
        type: supportbot.ActvityType
    });

    console.log(`\u001b[32m`, `―――――――――――――――――― SupportBot ――――――――――――――――――`)
    console.log(`\u001b[37m`, `${supportbot.Bot_Name} has successfully connected to discord`)
    console.log(`\u001b[32m`, `―――――――――――――――――― SupportBot ――――――――――――――――――`)
};
