// SupportBot | Emerald Services
// Ready Event

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./Data/supportbot.yml', 'utf8'));

const Event = require("../Structures/Event.js");

module.exports = new Event("ready", client => {
    console.log(`\u001b[32m`, `┏━━━┓╋╋╋╋╋╋╋╋╋╋╋╋╋┏┓┏━━┓╋╋╋┏┓`)
    console.log(`\u001b[32m`, `┃┏━┓┃╋╋╋╋╋╋╋╋╋╋╋╋┏┛┗┫┏┓┃╋╋┏┛┗┓`)
    console.log(`\u001b[32m`, `┃┗━━┳┓┏┳━━┳━━┳━━┳┻┓┏┫┗┛┗┳━┻┓┏┛`)
    console.log(`\u001b[32m`, `┗━━┓┃┃┃┃┏┓┃┏┓┃┏┓┃┏┫┃┃┏━┓┃┏┓┃┃`)
    console.log(`\u001b[32m`, `┃┗━┛┃┗┛┃┗┛┃┗┛┃┗┛┃┃┃┗┫┗━┛┃┗┛┃┗┓`)
    console.log(`\u001b[32m`, `┗━━━┻━━┫┏━┫┏━┻━━┻┛┗━┻━━━┻━━┻━┛`)
    console.log(`\u001b[32m`, `┗╋╋╋╋╋╋╋┃┃╋┃┃`)
    console.log(`\u001b[32m`, `╋╋╋╋╋╋╋┗┛╋┗┛`)
    console.log(`    `)
    console.log(`\u001b[31m`, `――――――――――――――――――――――――――――――――――――――――――――`)
    console.log(`    `)
    console.log(`\u001b[33m`, `${supportbot.Bot_Name} v${supportbot.SupportBot_Version}`, `\u001b[36m`, `Connected to Discord`)
    console.log(`\u001b[33m`, `Documentation:`, `\u001b[36m`, `https://supportbot.emeraldsrv.dev`)
    console.log(`\u001b[33m`, `Discord:`, `\u001b[36m`, `https://emeraldsrv.dev/discord`)
    console.log(`\u001b[33m`, `Hosting:`, `\u001b[36m`, `https://emeraldsrv.dev/hosting`)
    console.log(`    `)
    console.log(`\u001b[37m`, `SupportBot proudly created by Emerald Services`)
    console.log(`    `)
    console.log(`\u001b[31m`, `――――――――――――――――――――――――――――――――――――――――――――`)
});