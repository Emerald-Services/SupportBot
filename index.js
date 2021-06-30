//      ___                            _    ___        _   
//    / __> _ _  ___  ___  ___  _ _ _| |_ | . > ___ _| |_ 
//     \__ \| | || . \| . \/ . \| '_> | |  | . \/ . \ | |  
//     <___/`___||  _/|  _/\___/|_|   |_|  |___/\___/ |_|  
//                |_|  |_|                                  
//
//           SupportBot created by Emerald Services
//           Installed with MIT License
//
//           Discord Support: https://emeraldsrv.dev/discord

const Discord = require("discord.js");
const fs = require("fs");
const bot = new Discord.Client();

bot.commands = new Discord.Collection();

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);

String.prototype.toProperCase = function () {
    return this.replace(
        /([^\W_]+[^\s-]*) */g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
};

const init = async () => {
    const evtFiles = await readdir("./events/");
    
        console.info(`\u001b[36m`, `➢ SupportBot Events`);
        console.info(`	`);
    
    evtFiles.forEach((file, i) => {
        const eventName = file.split(".")[0];
        const event = require(`./events/${file}`);
        console.info(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[36m`, `#${i + 1} Event Loaded: ${eventName.toProperCase()} `);
        
        bot.on(eventName, event.bind(null, bot));
        delete require.cache[require.resolve(`./events/${file}`)];
    });

    console.info(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[36m`, `Successfully loaded ${evtFiles.length} events.`);
    console.log(`\u001b[31m`, `――――――――――――――――――――――――――――――――――――――――――――`)
    console.log(`	`)
};

init();

fs.readdir("./commands/", (err, files) => {
    
        console.info(`\u001b[36m`, `➢ SupportBot Commands`);
        console.info(`	`);
    
    if (err) console.info(err, "error");
    
    let jsfiles = files.filter((f) => f.split(".").pop() === "js");

    if (jsfiles.length <= 0) {
        console.log(`[${supportbot.Bot_Name}]: No commands found. Try to Re-download the resource`);
        return;
    }
  
    jsfiles.forEach((f, i) => {
        let props = require(`./commands/${f}`);
        
        console.info(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[36m`, `#${i + 1} Command Loaded: ${props.name.toProperCase()}`);
        bot.commands.set(props.name, props);
    });

    console.info(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[36m`, `Loaded ${jsfiles.length} commands!`);
    console.log(`\u001b[31m`, `――――――――――――――――――――――――――――――――――――――――――――`)
    console.log(`	`)
});

fs.readdir("./addons/", (err, files) => {
    
        console.info(`\u001b[36m`, `➢ SupportBot Addons`);
        console.info(`	`);
    
    if (err) console.info(err, "error");
    
    let jsfiles = files.filter((f) => f.split(".").pop() === "js");

    if (jsfiles.length <= 0) {
        console.log(`[${supportbot.Bot_Name}]: No addons found. You can download addons from https://emeraldsrv.dev`);
        return;
    }
  
    jsfiles.forEach((f, i) => {
        let props = require(`./addons/${f}`);
        
        console.info(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[36m`, `#${i + 1} Addon Loaded: ${props.name.toProperCase()}`);
        bot.commands.set(props.name, props);
    });

    console.info(`\u001b[32m`, `[${supportbot.Bot_Name}]:`, `\u001b[36m`, `Loaded ${jsfiles.length} addons!`);
    console.log(`\u001b[31m`, `――――――――――――――――――――――――――――――――――――――――――――`)
    console.log(`	`)
});

bot.login(supportbot.Token);
