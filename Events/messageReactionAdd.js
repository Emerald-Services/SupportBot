const fs = require("fs");
const yaml = require("js-yaml");

const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8"),
);
const supportbotai = yaml.load(
  fs.readFileSync("./Configs/supportbot-ai.yml", "utf8"),
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Event = require("../Structures/Event.js");

module.exports = new Event(
  "messageReactionAdd",
  async (client, reaction, user) => {
    try {
      if (user.bot) return;

      if (reaction.partial) {
        await reaction.fetch().catch(() => null);
      }

      const message = reaction.message;
      if (!message || !message.guild) return;

      const reactionEmoji = reaction.emoji?.name || reaction.emoji?.id || null;
      const expectedReaction =
        supportbotai.Messages?.SuggestTicketReaction || "🎫";

      if (reactionEmoji !== expectedReaction) return;
      if (supportbotai.Features?.SuggestTickets !== true) return;
      if (message.author?.id !== client.user.id) return;

      const expectedText =
        supportbotai.Messages?.SuggestTicketText ||
        "Need more help? React with 🎫 to open a ticket.";

      if ((message.content || "").trim() !== expectedText.trim()) return;

      await message.delete().catch(() => {});

      const cmd = client.commands.get(cmdconfig.OpenTicket.Command);
      if (!cmd) {
        console.error("Open ticket command not found.");
        return;
      }

      const member = await message.guild.members
        .fetch(user.id)
        .catch(() => null);

      if (!member) return;

      const fakeInteraction = {
        user,
        member,
        guild: message.guild,
        channel: message.channel,
        client,
        replied: true,
        deferred: false,
        reason: `Opened from AI suggestion in #${message.channel.name}`,
        options: {
          getString: () => null,
        },
        reply: async () => null,
      };

      await cmd.run(fakeInteraction);
    } catch (error) {
      console.error("Error handling AI ticket reaction:", error);
    }
  },
);
