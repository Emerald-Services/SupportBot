const fs = require("fs");
const Discord = require("discord.js");
const yaml = require("js-yaml");
const Event = require("../Structures/Event.js");
const gradient = require("gradient-string");
const figlet = require("figlet");

// Load configs
const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const panel = yaml.load(fs.readFileSync("./Configs/ticket-panel.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

const ACTIVITY_TYPES = {
  PLAYING: Discord.ActivityType.Playing,
  WATCHING: Discord.ActivityType.Watching,
  LISTENING: Discord.ActivityType.Listening,
  COMPETING: Discord.ActivityType.Competing
};

const setActivity = (client, type, status) => {
  const activityType = ACTIVITY_TYPES[type?.toUpperCase()];
  if (activityType) {
    client.user.setPresence({
      activities: [{ name: status || "Online", type: activityType }],
      status: type?.toLowerCase() || "online"
    });
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logStartup = async (client) => {
  console.clear();
  
  // Animated loading
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  for (let i = 0; i < frames.length * 2; i++) {
    process.stdout.write(`\r${frames[i % frames.length]} Initializing SupportBot...`);
    await sleep(100);
  }
  console.clear();

  // Main title
  console.log("\n" + gradient.pastel.multiline(figlet.textSync("SupportBot", { font: "ANSI Shadow", horizontalLayout: "fitted" })));

  // Extract bot details safely
  const botName = supportbot?.General?.Name || "SupportBot";
  const botVersion = supportbot.SupportBot_Version;

  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║                      System Information                       ║");
  console.log("╠═══════════════════════════════════════════════════════════════╣");
  console.log(`║  Bot Name    : ${botName.padEnd(45)}  ║`);
  console.log(`║  Version     : ${botVersion.padEnd(45)}  ║`);
  console.log(`║  Node.js     : ${process.version.padEnd(45)}  ║`);
  console.log(`║  Discord.js  : v${Discord.version.padEnd(44)}  ║`);
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  // Links section
  console.log(gradient.summer("┏━━━━━━━━━━━━━━━━━━━ Important Links ━━━━━━━━━━━━━━━━━━━┓"));
  console.log(gradient.summer("┃                                                       ┃"));
  console.log(gradient.summer("┃  ") + "📚 Docs       : " + gradient.cristal("https://emerald-services.gitbook.io/ ┃"));
  console.log(gradient.summer("┃  ") + "🤝 Discord    : " + gradient.cristal("https://dsc.gg/emerald-dev           ┃"));
  console.log(gradient.summer("┃                                                       ┃"));
  console.log(gradient.summer("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n"));

  // Bot Invite
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
  console.log(gradient.teen("╔════════════════════════ Bot Invite ════════════════════════╗"));
  console.log(gradient.teen("║                                                            ║"));
  console.log(gradient.teen("║  ") + gradient.pastel(inviteUrl.padEnd(56)) + gradient.teen("║"));
  console.log(gradient.teen("║                                                            ║"));
  console.log(gradient.teen("╚════════════════════════════════════════════════════════════╝\n"));
};

const checkConfigs = async (client) => {
  const guild = client.guilds.cache.first();
  if (!guild) return;

  console.log(gradient.morning("┏━━━━━━━━━━━━━━━━━━━━ Config Check ━━━━━━━━━━━━━━━━━━━━━┓"));

  const roles = [
    supportbot?.Roles?.StaffMember?.Admin,
    supportbot?.Roles?.StaffMember?.Staff,
    supportbot?.Roles?.AutoRole?.Role
  ].filter(Boolean);

  const channels = [
    supportbot?.Suggestions?.Channel,
    supportbot?.Ticket?.Log?.TicketLog,
    supportbot?.Ticket?.Log?.TranscriptLog,
    supportbot?.Ticket?.TicketHome,
    supportbot?.Welcome?.Channel,
    supportbot?.Leave?.Channel,
    supportbot?.Translate?.Log
  ].filter(Boolean);

  const [missingRoles, missingChannels] = await Promise.all([
    Promise.all(roles.map((role) => client.getRole(role, guild))),
    Promise.all(channels.map((channel) => client.getChannel(channel, guild)))
  ]);

  const missing = {
    roles: roles.filter((_, i) => !missingRoles[i]),
    channels: channels.filter((_, i) => !missingChannels[i])
  };

  if (missing.roles.length || missing.channels.length) {
    console.log(gradient.morning("┃  ⚠️ - Configuration Issues Found:                     ┃"));
    if (missing.roles.length) {
      console.log(gradient.morning("┃  • Missing Roles: ") + gradient.fruit(missing.roles.join(", ")));
    }
    if (missing.channels.length) {
      console.log(gradient.morning("┃  • Missing Channels: ") + gradient.fruit(missing.channels.join(", ")));
    }
  } else {
    console.log(gradient.morning("┃  ✅ - All configurations validated successfully       ┃"));
  }

  console.log(gradient.morning("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n"));
};

module.exports = new Event("clientReady", async (client) => {
  setActivity(client, supportbot?.Activity?.Type, supportbot?.Activity?.Status);
  await logStartup(client);
  await checkConfigs(client);
});
