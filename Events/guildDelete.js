const Event = require("../Structures/Event.js");
const {
  getConfiguredGuildId,
  syncGuildHealth,
  logGuildWarning,
} = require("../Structures/GuildManager.js");

module.exports = new Event("guildDelete", async (client, guild) => {
  const configuredId = getConfiguredGuildId();

  if (configuredId && guild.id === configuredId) {
    logGuildWarning(
      client,
      `Left the configured server "${guild.name}" (${guild.id}). Re-invite the bot or update General.GuildId.`,
    );
  } else if (!configuredId) {
    logGuildWarning(client, `Left server "${guild.name}" (${guild.id}).`);
  } else {
    logGuildWarning(client, `Left server "${guild.name}" (${guild.id}).`);
  }

  syncGuildHealth(client);
});
