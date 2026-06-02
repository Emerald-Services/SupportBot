const { ChannelType } = require("discord.js");
const configStore = require("./ConfigStore.js");
const { withTimeout } = require("./asyncTimeout.js");

const RESOURCES_CACHE_MS = 90 * 1000;
/** Bump when resource payload shape changes (e.g. added emojis). */
const RESOURCES_CACHE_VERSION = 2;
let resourcesCache = { guildId: null, data: null, at: 0, version: 0 };
let resourcesInflight = null;

function getConfiguredGuildId() {
  const id = configStore.supportbot?.General?.GuildId;
  if (!id || id === "GUILD_ID" || String(id).trim() === "") return null;
  return String(id).trim();
}

function setConfiguredGuildId(guildId) {
  if (!configStore.supportbot.General) {
    configStore.supportbot.General = {};
  }
  configStore.supportbot.General.GuildId = guildId ? String(guildId) : "";
}

function getPrimaryGuild(client) {
  if (!client) return null;

  const configuredId = getConfiguredGuildId();
  if (configuredId) {
    const match = client.guilds.cache.get(configuredId);
    if (match) return match;
  }

  return client.guilds.cache.first() || null;
}

function evaluateGuildHealth(client) {
  const configuredId = getConfiguredGuildId();
  const guilds = [...client.guilds.cache.values()];

  if (!configuredId) {
    return {
      status: "missing_config",
      configuredGuildId: null,
      message:
        "No guild ID is set. Add your Discord server ID under Bot config → General.",
      configuredGuild: null,
      extraGuilds: guilds.map(formatGuildSummary),
    };
  }

  const configuredGuild = client.guilds.cache.get(configuredId) || null;
  const extraGuilds = guilds
    .filter((g) => g.id !== configuredId)
    .map(formatGuildSummary);

  if (!configuredGuild) {
    return {
      status: "not_in_guild",
      configuredGuildId: configuredId,
      message: `The bot is not in the configured server (${configuredId}). Invite it or update the guild ID.`,
      configuredGuild: null,
      extraGuilds: guilds.map(formatGuildSummary),
    };
  }

  if (extraGuilds.length > 0) {
    return {
      status: "extra_guilds",
      configuredGuildId: configuredId,
      message: `The bot is in ${extraGuilds.length} extra server(s). Leave them so only your configured server remains.`,
      configuredGuild: formatGuildSummary(configuredGuild),
      extraGuilds,
    };
  }

  return {
    status: "ok",
    configuredGuildId: configuredId,
    message: null,
    configuredGuild: formatGuildSummary(configuredGuild),
    extraGuilds: [],
  };
}

function formatGuildSummary(guild) {
  return {
    id: guild.id,
    name: guild.name,
    memberCount: guild.memberCount ?? null,
    icon: guild.iconURL?.({ size: 128 }) ?? null,
  };
}

function syncGuildHealth(client) {
  if (!client?.user) {
    client.guildHealth = {
      status: "offline",
      configuredGuildId: getConfiguredGuildId(),
      message: "Bot is not connected to Discord.",
      configuredGuild: null,
      extraGuilds: [],
    };
    return client.guildHealth;
  }

  client.guildHealth = evaluateGuildHealth(client);
  return client.guildHealth;
}

function logGuildWarning(client, message) {
  const name = client?.user?.username || "Bot";
  console.warn(`\x1b[33m[Guild]\x1b[0m ${name}: ${message}`);
}

async function leaveGuild(client, guildId) {
  const guild = client.guilds.cache.get(String(guildId));
  if (!guild) {
    throw new Error("Bot is not in that server.");
  }

  const configuredId = getConfiguredGuildId();
  if (configuredId && guild.id === configuredId) {
    throw new Error("Cannot leave the configured server. Change the guild ID first.");
  }

  await guild.leave();
  syncGuildHealth(client);
  return syncGuildHealth(client);
}

function buildResourcesFromGuild(guild) {
  const roles = [...guild.roles.cache.values()]
    .filter((r) => r.id !== guild.id)
    .sort((a, b) => b.position - a.position)
    .map((r) => ({
      id: r.id,
      name: r.name,
      color: r.hexColor || null,
    }));

  const channels = [...guild.channels.cache.values()]
    .filter(
      (c) =>
        c.type === ChannelType.GuildText ||
        c.type === ChannelType.GuildVoice ||
        c.type === ChannelType.GuildAnnouncement ||
        c.type === ChannelType.GuildStageVoice ||
        c.type === ChannelType.GuildForum,
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
    }));

  const categories = [...guild.channels.cache.values()]
    .filter((c) => c.type === ChannelType.GuildCategory)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({
      id: c.id,
      name: c.name,
    }));

  const emojis = [...guild.emojis.cache.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => {
      const animated = Boolean(e.animated);
      const ext = animated ? "gif" : "png";
      return {
        id: e.id,
        name: e.name,
        animated,
        url:
          e.imageURL({ extension: ext, size: 64 }) ||
          `https://cdn.discordapp.com/emojis/${e.id}.${ext}?size=64`,
      };
    });

  return {
    guildId: guild.id,
    guildName: guild.name,
    roles,
    channels,
    categories,
    emojis,
  };
}

async function fetchGuildResourcesFromDiscord(client, guildId) {
  const id = guildId || getConfiguredGuildId();
  if (!id) return null;

  const guild = client.guilds.cache.get(id);
  if (!guild) return null;

  try {
    await withTimeout(
      Promise.all([guild.channels.fetch(), guild.roles.fetch()]),
      12_000,
      "Discord channel/role fetch timed out",
    );
  } catch (err) {
    console.warn("[Guild] Failed to fetch channels/roles:", err.message);
    if (guild.roles.cache.size === 0 && guild.channels.cache.size === 0) {
      return null;
    }
  }

  try {
    await withTimeout(guild.emojis.fetch(), 12_000, "Discord emoji fetch timed out");
  } catch (err) {
    console.warn("[Guild] Failed to fetch guild emojis:", err.message);
  }

  return buildResourcesFromGuild(guild);
}

async function fetchGuildResources(client, guildId) {
  const id = guildId || getConfiguredGuildId();
  if (!id || !client?.user) return null;

  const now = Date.now();
  if (
    resourcesCache.data &&
    resourcesCache.version === RESOURCES_CACHE_VERSION &&
    resourcesCache.guildId === id &&
    now - resourcesCache.at < RESOURCES_CACHE_MS
  ) {
    return resourcesCache.data;
  }

  if (resourcesInflight) {
    try {
      return await resourcesInflight;
    } catch {
      /* fall through to retry */
    }
  }

  resourcesInflight = (async () => {
    const data = await fetchGuildResourcesFromDiscord(client, id);
    if (data) {
      resourcesCache = {
        guildId: id,
        data,
        at: Date.now(),
        version: RESOURCES_CACHE_VERSION,
      };
    }
    return data;
  })();

  try {
    return await resourcesInflight;
  } finally {
    resourcesInflight = null;
  }
}

function clearGuildResourcesCache() {
  resourcesCache = { guildId: null, data: null, at: 0, version: 0 };
  resourcesInflight = null;
}

module.exports = {
  getConfiguredGuildId,
  setConfiguredGuildId,
  getPrimaryGuild,
  evaluateGuildHealth,
  syncGuildHealth,
  logGuildWarning,
  leaveGuild,
  fetchGuildResources,
  clearGuildResourcesCache,
};
