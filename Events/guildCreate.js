const Event = require("../Structures/Event.js");
module.exports = new Event("guildCreate", async (client, guild) => {
  console.log(
    `\u001b[31m`,
    `${client.user.username} is not in the correct server set in your config. Please leave all other servers and restart the bot.`
  );
  console.log(`\u001b[31m`, `${client.user.username} will now exit.`);
  return process.exit(1);
});
