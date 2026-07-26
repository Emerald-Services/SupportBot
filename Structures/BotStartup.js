const Discord = require("discord.js");
const configStore = require("./ConfigStore.js");
const {
  getPrimaryGuild,
  syncGuildHealth,
} = require("./GuildManager.js");

const ACTIVITY_TYPES = {
  PLAYING: Discord.ActivityType.Playing,
  WATCHING: Discord.ActivityType.Watching,
  LISTENING: Discord.ActivityType.Listening,
  COMPETING: Discord.ActivityType.Competing,
  STREAMING: Discord.ActivityType.Streaming,
};

function applyPresence(client) {
  if (!client?.user) return;

  const activity = configStore.supportbot?.Activity;
  const typeKey = activity?.Type?.toUpperCase();
  const type = ACTIVITY_TYPES[typeKey] ?? Discord.ActivityType.Playing;
  const name = activity?.Status || "Online";

  const activityPayload = { name, type };

  if (typeKey === "STREAMING" && activity?.StreamingURL) {
    activityPayload.url = activity.StreamingURL;
  }

  client.user.setPresence({
    activities: [activityPayload],
    status: "online",
  });
}

const c = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m",
  white: "\x1b[37m",
};

function line() {
  console.log(
    `${c.gray}────────────────────────────────────────────────────────${c.reset}`,
  );
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

async function logStartup(client, options = {}) {
  const { clearConsole = true } = options;
  const supportbot = configStore.supportbot;

  if (clearConsole) {
    console.clear();
  }

  const botName = supportbot?.General?.Name || "SupportBot";
  const botVersion = supportbot?.SupportBot_Version || "Unknown";
  const { getBotInviteUrl } = require("./BotInvite.js");
  const inviteUrl = getBotInviteUrl(client.user.id);

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
  
  if (configStore.api?.API?.Enabled) {
    const port = configStore.api?.API?.Port || 3000;
    info("Dashboard", `http://localhost:${port}`);
  }

  info("Invite", inviteUrl);

  console.log("");
}

async function checkConfigs(client) {
  const supportbot = configStore.supportbot;
  const health = syncGuildHealth(client);

  if (health.status !== "ok") {
    section("Guild");
    status("Guild setup", false, health.message || health.status);
    console.log("");
  }

  const guild = getPrimaryGuild(client);
  if (!guild) return;

  section("Config Check");

  const roles = [
    supportbot?.Roles?.StaffMember?.Admin,
    supportbot?.Roles?.StaffMember?.Staff,
    supportbot?.Roles?.AutoRole?.Role,
  ].filter(Boolean);

  const channels = [supportbot?.Ticket?.TicketHome].filter(Boolean);

  const [roleResults, channelResults] = await Promise.all([
    Promise.all(roles.map((role) => client.getRole(role, guild))),
    Promise.all(channels.map((channel) => client.getChannel(channel, guild))),
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
}

function logSlashCommandsRegistered(client) {
  const guild = getPrimaryGuild(client);
  if (!guild) return;
  console.log(
    `\n${c.green}✓${c.reset} ${c.white}Slash Commands Registered${c.reset} ${c.gray}for ${guild.name}${c.reset}`,
  );
}

/**
 * Same work as Events/ready.js — safe to call after config reload reconnects.
 */
async function runBotReady(client, options = {}) {
  const { clearConsole = true, logCommands = false } = options;

  syncGuildHealth(client);
  applyPresence(client);
  await logStartup(client, { clearConsole });
  await checkConfigs(client);

  if (logCommands) {
    logSlashCommandsRegistered(client);
  }
}

module.exports = {
  applyPresence,
  logStartup,
  checkConfigs,
  logSlashCommandsRegistered,
  runBotReady,
};
