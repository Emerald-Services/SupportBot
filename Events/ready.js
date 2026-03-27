const fs = require("fs");
const Discord = require("discord.js");
const yaml = require("js-yaml");
const Event = require("../Structures/Event.js");

// Load configs
const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));

const ACTIVITY_TYPES = {
  PLAYING: Discord.ActivityType.Playing,
  WATCHING: Discord.ActivityType.Watching,
  LISTENING: Discord.ActivityType.Listening,
  COMPETING: Discord.ActivityType.Competing
};

const setActivity = (client, type, status) => {
  const activityType = ACTIVITY_TYPES[type?.toUpperCase()];
  if (!activityType) return;

  client.user.setPresence({
    activities: [{ name: status || "Online", type: activityType }],
    status: "online"
  });
};

// simple colors
const c = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m"
};

function line() {
  console.log(`${c.gray}────────────────────────────────────────────────────────${c.reset}`);
}

function section(title) {
  console.log(`\n${c.green}${title}${c.reset}`);
  console.log(`${c.gray}${"-".repeat(title.length)}${c.reset}`);
}

function info(label, value) {
  console.log(`${c.gray}${label.padEnd(14)}${c.reset} ${value}`);
}

function status(label, ok, details = "") {
  const icon = ok ? `${c.green}✓${c.reset}` : `${c.yellow}!${c.reset}`;
  console.log(` ${icon} ${label}${details ? ` (${details})` : ""}`);
}

const logStartup = async (client) => {
  console.clear();

  const botName = supportbot?.General?.Name || "SupportBot";
  const botVersion = supportbot?.SupportBot_Version || "Unknown";

  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

  line();
  console.log(`${c.bold}${c.green}SupportBot${c.reset}`);
  console.log(`${c.gray}Emerald Services${c.reset}`);
  line();

  section("System");
  info("Bot Name", botName);
  info("Version", botVersion);
  info("Node.js", process.version);
  info("Discord.js", `v${Discord.version}`);
  info("Logged in as", client.user.tag);
  info("Guilds", `${client.guilds.cache.size}`);

  section("Links");
  info("Docs", "https://emerald-services.gitbook.io/");
  info("Discord", "https://dsc.gg/emerald-dev");
  info("Invite", inviteUrl);

  console.log("");
};

const checkConfigs = async (client) => {
  const guild = client.guilds.cache.first();
  if (!guild) return;

  section("Config Check");

  const roles = [
    supportbot?.Roles?.StaffMember?.Admin,
    supportbot?.Roles?.StaffMember?.Staff,
    supportbot?.Roles?.AutoRole?.Role
  ].filter(Boolean);

  const channels = [
    supportbot?.Ticket?.TicketHome
  ].filter(Boolean);

  const [roleResults, channelResults] = await Promise.all([
    Promise.all(roles.map((role) => client.getRole(role, guild))),
    Promise.all(channels.map((channel) => client.getChannel(channel, guild)))
  ]);

  const missingRoles = roles.filter((_, i) => !roleResults[i]);
  const missingChannels = channels.filter((_, i) => !channelResults[i]);

  if (!missingRoles.length && !missingChannels.length) {
    status("All configurations validated successfully", true);
  } else {
    if (missingRoles.length) {
      status("Missing roles", false, missingRoles.join(", "));
    }

    if (missingChannels.length) {
      status("Missing channels", false, missingChannels.join(", "));
    }
  }

  console.log("");
};

module.exports = new Event("clientReady", async (client) => {
  setActivity(client, supportbot?.Activity?.Type, supportbot?.Activity?.Status);
  await logStartup(client);
  await checkConfigs(client);
});