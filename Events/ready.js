const Event = require("../Structures/Event.js");
const { runBotReady } = require("../Structures/BotStartup.js");

module.exports = new Event("clientReady", async (client) => {
  // restartDiscordBot runs startup manually — clientReady often does not re-fire anyway
  if (client.__explicitStartup) return;
  await runBotReady(client, { clearConsole: true, logCommands: false });
});
