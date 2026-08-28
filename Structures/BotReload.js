const fs = require("fs");
const path = require("path");
const configStore = require("./ConfigStore.js");
const { getPrimaryGuild } = require("./GuildManager.js");
const {
  applyPresence,
  runBotReady,
  logSlashCommandsRegistered,
} = require("./BotStartup.js");

function walk(dir, ext = ".js", fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full, ext, fileList);
    } else if (file.endsWith(ext)) {
      fileList.push(full.replace(/\\/g, "/"));
    }
  }
  return fileList;
}

async function refreshSlashCommands(client) {
  if (!client?.application) return { count: 0 };

  const cmdconfig = configStore.commands;
  const commandFiles = walk("./Commands");
  client.commands.clear();

  for (const file of commandFiles) {
    const resolved = path.resolve(file);
    if (require.cache[resolved]) {
      delete require.cache[resolved];
    }
  }

  let count = 0;
  for (const file of commandFiles) {
    const command = require(path.resolve(file));
    const matchingConfig = Object.values(cmdconfig).find(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        entry.Command &&
        String(entry.Command).toLowerCase() ===
          String(command.name).toLowerCase(),
    );

    if (matchingConfig && matchingConfig.Enabled === false) {
      continue;
    }

    client.commands.set(command.name, command);
    count++;
  }

  const payload = client.commands.map((cmd) => cmd.data ?? cmd);
  for (const guild of client.guilds.cache.values()) {
    await guild.commands.set(payload);
  }

  return { count };
}

async function reloadBot(client, options = {}) {
  const { fileKey, refreshCommands = true } = options;

  let reloaded;
  if (fileKey) {
    configStore.reloadFile(fileKey);
    reloaded = [fileKey];
  } else {
    reloaded = configStore.reloadBotConfigs();
  }

  applyPresence(client);

  let commands = null;
  if (refreshCommands && (!fileKey || fileKey === "commands")) {
    commands = await refreshSlashCommands(client);
  }

  return {
    reloaded,
    commands,
  };
}

/**
 * Reload configs from disk, reconnect the Discord session, and refresh presence/commands.
 * API and dashboard keep running on the same process.
 */
async function restartDiscordBot(client) {
  if (!client) {
    const err = new Error("Bot client not available");
    err.code = "NO_CLIENT";
    throw err;
  }

  const reloaded = configStore.reloadBotConfigs();
  const token = configStore.supportbot?.General?.Token;

  if (!token || String(token).trim() === "" || token === "BOT_TOKEN") {
    const err = new Error("Invalid or missing bot token in supportbot.yml");
    err.code = "INVALID_TOKEN";
    throw err;
  }

  console.log("[BotReload] Restarting Discord bot after config change…");
  client.__restarting = true;

  if (client.user) {
    try {
      await client.destroy();
    } catch (destroyErr) {
      console.warn("[BotReload] destroy:", destroyErr.message);
    }
  }

  client.__explicitStartup = true;
  try {
    try {
      await client.login(token);
    } catch (loginErr) {
      console.error("[BotReload] login failed:", loginErr.message);
      const err = new Error(`Could not start bot: ${loginErr.message}`);
      err.code = "LOGIN_FAILED";
      throw err;
    }

    // clientReady does not fire again after destroy()+login() — run startup explicitly
    await runBotReady(client, { clearConsole: true, logCommands: false });
    const commands = await refreshSlashCommands(client);
    logSlashCommandsRegistered(client);

    console.log("[BotReload] Bot restarted successfully");
    return { restarted: true, reloaded, commands };
  } finally {
    client.__explicitStartup = false;
    client.__restarting = false;
  }
}

module.exports = {
  applyPresence,
  refreshSlashCommands,
  reloadBot,
  restartDiscordBot,
};
