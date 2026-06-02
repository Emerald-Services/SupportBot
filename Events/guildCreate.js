const Event = require("../Structures/Event.js");
const {
  getConfiguredGuildId,
  syncGuildHealth,
  logGuildWarning,
} = require("../Structures/GuildManager.js");

module.exports = new Event("guildCreate", async (client, guild) => {
  const configuredId = getConfiguredGuildId();

  if (!configuredId) {
    logGuildWarning(
      client,
      `Joined "${guild.name}" (${guild.id}). Set General.GuildId in config to lock the bot to one server.`,
    );
    syncGuildHealth(client);
    return;
  }

  if (guild.id === configuredId) {
    syncGuildHealth(client);
    return;
  }

  logGuildWarning(
    client,
    `Joined unauthorized server "${guild.name}" (${guild.id}). Leave it from the dashboard or remove the invite.`,
  );

  syncGuildHealth(client);
});
