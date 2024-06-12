// SupportBot | Emerald Services
// Ready Event

const fs = require("fs");

const Discord = require("discord.js");
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const client = new Discord.Client({intents: 32767})

const yaml = require("js-yaml");

const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const panelconfig = yaml.load(
  fs.readFileSync("./Configs/ticket-panel.yml", "utf8")
);

const cmdconfig = yaml.load(
  fs.readFileSync("./Configs/commands.yml", "utf8")
);

const msgconfig = yaml.load(
  fs.readFileSync("./Configs/messages.yml", "utf8")
);

const Event = require("../Structures/Event.js");

let chan1 = client.channels.cache.get(panelconfig.Channel);

module.exports = new Event("ready", async (client, interaction) => {
  const { getRole, getChannel, getCategory } = client;

  if (supportbot.Activity.Type === "Playing", "playing") {
    client.user.setPresence({
      activities: [{ name: supportbot.Activity.Status, type: Discord.ActivityType.Playing }],
      status: supportbot.Activity.Type,
    });
  }

  if (supportbot.Activity.Type === "Watching", "watching") {
    client.user.setPresence({
      activities: [{ name: supportbot.Activity.Status, type: Discord.ActivityType.Watching }],
      status: supportbot.Activity.Type,
    });
  }
  
  if (supportbot.Activity.Type === "Listening", "listening") {
    client.user.setPresence({
      activities: [{ name: supportbot.Activity.Status, type: Discord.ActivityType.Listening }],
      status: supportbot.Activity.Type,
    });
  }

  if (supportbot.Activity.Type === "Competing", "competing") {
    client.user.setPresence({
      activities: [{ name: supportbot.Activity.Status, type: Discord.ActivityType.Competing }],
      status: supportbot.Activity.Type,
    });
  }

  console.log(`\u001b[32m`, `――――――――――――――――――――――――――――――――――――――――――――`);
  console.log(`    `);
  console.log(`\u001b[31m`, `┏━━━┓╋╋╋╋╋╋╋╋╋╋╋╋╋┏┓┏━━┓╋╋╋┏┓`);
  console.log(`\u001b[31m`, `┃┏━┓┃╋╋╋╋╋╋╋╋╋╋╋╋┏┛┗┫┏┓┃╋╋┏┛┗┓`);
  console.log(`\u001b[31m`, `┃┗━━┳┓┏┳━━┳━━┳━━┳┻┓┏┫┗┛┗┳━┻┓┏┛`);
  console.log(`\u001b[31m`, `┗━━┓┃┃┃┃┏┓┃┏┓┃┏┓┃┏┫┃┃┏━┓┃┏┓┃┃`);
  console.log(`\u001b[31m`, `┃┗━┛┃┗┛┃┗┛┃┗┛┃┗┛┃┃┃┗┫┗━┛┃┗┛┃┗┓`);
  console.log(`\u001b[31m`, `┗━━━┻━━┫┏━┫┏━┻━━┻┛┗━┻━━━┻━━┻━┛`);
  console.log(`\u001b[31m`, `┗╋╋╋╋╋╋╋┃┃╋┃┃`);
  console.log(`\u001b[31m`, `╋╋╋╋╋╋╋┗┛╋┗┛`);
  console.log(`    `);
  console.log(`\u001b[32m`, `――――――――――――――――――――――――――――――――――――――――――――`);
  console.log(`    `);
  console.log(
    `\u001b[31m`,
    `${supportbot.General.Name} | [${supportbot.SupportBot_Version}]`,
    `\u001b[32m`,
    `Connected to Discord`,
  );
  
  console.log(`\u001b[31m`, `SupportBot proudly created by Emerald Development`);

  console.log(`    `);

  console.log(
    `\u001b[31m`,
    `Discord`,
    `\u001b[32m`,
    `https://dsc.gg/emerald-dev`,
  );

  console.log(
    `\u001b[31m`,
    `Website`,
    `\u001b[32m`,
    `https://emeraldsrv.com`,
  );

  console.log(
    `\u001b[31m`,
    `Marketplace`,
    `\u001b[32m`,
    `https://market.emeraldsrv.com`,
  );

  console.log(
    `\u001b[31m`,
    `Documentation`,
    `\u001b[32m`,
    `https://emeraldsrv.com/third-party`,
  );

  console.log(`    `);

  console.log(
    `\u001b[31m`,
    `Invite URL:`,
    `\u001b[36m`,
    `https://discord.com/api/oauth2/authorize?client_id=` +
      client.user.id +
      `&permissions=8&scope=bot%20applications.commands`
  );

  console.log(`    `);
  console.log(`\u001b[32m`, `――――――――――――――――――――――――――――――――――――――――――――`);

  const roles = [
    supportbot.Roles.StaffMember.Admin,
    supportbot.Roles.StaffMember.Staff,
    supportbot.Roles.ModRoles.Blacklisted,
    supportbot.Roles.ModRoles.Muted
  ];

    supportbot.Departments.forEach((department) => roles.push(department.role));

  if (supportbot.Roles.AutoRole.Role) roles.push(supportbot.Roles.AutoRole.Role);
  
   const channels = [
     supportbot.Suggestions.Channel,
     supportbot.Ticket.Log.TicketLog,
     supportbot.Ticket.Log.TranscriptLog,
     panelconfig.Channel,
     supportbot.Welcome.Channel,
     supportbot.Leave.Channel,
     supportbot.Translate.Log
   ];
  //const categories = [supportbot.TicketCategory];

  if (!channels) {
      console.log("\u001b[31m", `[MISSING CHANNEL]`, `\u001b[37;1m`, `${channels}`, "\u001b[31m", `channel not found. Please check your config file.`);
      return;
  }
//  else {
//      console.log(`\u001b[32m`, `[CHANNEL LOCATED]`, `\u001b[37;1m`, `${channels}`, `\u001b[32;1m`, `channel has been found.`);
//  }

  const missingC = [];
  const missingR = [];
  const missingCat = [];
  
  for (let r of roles) {
    const find = await getRole(r, client.guilds.cache.first());
    if (!find) missingR.push(r);
  }
 // for (let cat of categories) {
 //   const find = await getCategory(cat, client.guilds.cache.first());
 //   if (!find) missingCat.push(cat);
 // }

  if (missingR.length > 0) {
    console.log(
      "\u001b[31m",
      `[MISSING CONFIGURATION]`,
      "\u001b[33m",
      `The following Roles could not be found in your server.\n`, `\u001b[31m`, `[${missingR.join(
        ", "
      )}]`, `\n  `,
    );
  }

  if (missingC.length > 0) {
    console.log(
      "\u001b[31m",
      `[MISSING CONFIGURATION]`,
      "\u001b[33m",
      `The following Channels could not be found in your server.\n`, `\u001b[31m`, `[${missingC.join(
        ", "
      )}]`, `\n  `
    );
  }
  if (missingCat.length > 0) {
    console.log(
      "\u001b[31m",
      `[MISSING CONFIGURATION]`,
      "\u001b[33m",
      `The following Categories could not be found in your server.\n`, `\u001b[31m`, `[${missingCat.join(
        ", "
      )}]`, `\n  `,
    );
  }
});