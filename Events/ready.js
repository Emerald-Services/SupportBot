const fs = require("fs");
const Discord = require("discord.js");
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const client = new Discord.Client({intents: 32767});
const yaml = require("js-yaml");
const Event = require("../Structures/Event.js");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const panelconfig = yaml.load(fs.readFileSync("./Configs/ticket-panel.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

let chan1 = client.channels.cache.get(panelconfig.Channel);

module.exports = new Event("ready", async (client, interaction) => {
  const { getRole, getChannel, getCategory } = client;

  function isMySQLConfigured() {
    return supportbot?.Storage?.MySQL?.Host && supportbot?.Storage?.MySQL?.User && supportbot?.Storage?.MySQL?.Password && supportbot?.Storage?.MySQL?.Database;
  }

  let mysqlStorage = null;
  let dbConnected = false;

  if (isMySQLConfigured()) {
    const MySQLStorage = require('../Structures/Storage.js');
    mysqlStorage = new MySQLStorage();

    try {
      await mysqlStorage.connect();
      dbConnected = true;
      console.log("\u001b[32m", "Connected to MySQL database successfully.");
    } catch (error) {
      console.error("\u001b[31m", "Failed to connect to MySQL database:", error.message);
      dbConnected = false;
    }
  } else {
    console.log("\u001b[33m", "MySQL is not configured in the", "\u001b[30m", "supportbot.yml", "\u001b[33m", "file. Skipping MySQL connection.", "\u001b[30m", "Using default storage instead.");
  }

  switch (supportbot.Activity.Type?.toLowerCase()) {
    case "playing":
      client.user.setPresence({
        activities: [{ name: supportbot.Activity.Status, type: Discord.ActivityType.Playing }],
        status: supportbot.Activity.Status,
      });
      break;
    case "watching":
      client.user.setPresence({
        activities: [{ name: supportbot.Activity.Status, type: Discord.ActivityType.Watching }],
        status: supportbot.Activity.Status,
      });
      break;
    case "listening":
      client.user.setPresence({
        activities: [{ name: supportbot.Activity.Status, type: Discord.ActivityType.Listening }],
        status: supportbot.Activity.Status,
      });
      break;
    case "competing":
      client.user.setPresence({
        activities: [{ name: supportbot.Activity.Status, type: Discord.ActivityType.Competing }],
        status: supportbot.Activity.Status,
      });
      break;
    default:
      console.log("\u001b[33m", "Unsupported activity type in config:", supportbot.Activity.Type);
  }

  console.log(`\u001b[33m`, `――――――――――――――――――――――――――――――――――――――――――――`);
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
  console.log(`\u001b[33m`, `――――――――――――――――――――――――――――――――――――――――――――`);
  console.log(`    `);  
  console.log(`\u001b[31m`, `${supportbot.General.Name} | [${supportbot.SupportBot_Version}]`, `\u001b[32m`, `Connected to Discord`,);
  console.log("\u001b[32m", "SupportBot created by Emerald Development");
  console.log(`    `);
  console.log(`\u001b[33m`, `――――――――――――――――― [Links] ――――――――――――――――――`);
  console.log("\u001b[32m", "Discord: https://dsc.gg/emerald-dev");
  console.log("\u001b[32m", "Website: https://emeraldsrv.com");
  console.log("\u001b[32m", "Marketplace: https://resources.emeraldsrv.com");
  console.log("\u001b[32m", "Documentation: https://docs.emeraldsrv.com");
  console.log(`    `);
  console.log(`\u001b[33m`, `――――――――――――――――― [Invite] ――――――――――――――――――`);
  console.log("\u001b[32m", `Invite URL: https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`);
  console.log(`    `);
  console.log(`\u001b[33m`, `――――――――――――――――― [Config Check] ――――――――――――――――――`);
  console.log("\u001b[32m", "Config initialization...");

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

  const missingRoles = await Promise.all(roles.map(role => getRole(role, client.guilds.cache.first())));
  const missingChannels = await Promise.all(channels.map(channel => getChannel(channel, client.guilds.cache.first())));

  if (missingRoles.some(role => !role)) {
    console.log("\u001b[31m", `Missing roles in your server configuration: ${missingRoles.filter(role => !role).join(', ')}`);
  }

  if (missingChannels.some(channel => !channel)) {
    console.log("\u001b[31m", `Missing channels in your server configuration: ${missingChannels.filter(channel => !channel).join(', ')}`);
  }

  console.log("\u001b[32m", "Configs initialized, No problems were detected.");
  console.log(`    `);

  if (dbConnected) {
    console.log(`\u001b[33m`, `――――――――――――――――― [MySQL] ――――――――――――――――――`);
    console.log("\u001b[32m", "MySQL connection established successfully.");
    console.log(`    `);
  }
});
