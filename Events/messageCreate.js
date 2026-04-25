const fs = require("fs");
const Discord = require("discord.js");
const yaml = require("js-yaml");
const axios = require("axios");

const supportbotai = yaml.load(
  fs.readFileSync("./Configs/supportbot-ai.yml", "utf8"),
);
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8"),
);

const Event = require("../Structures/Event.js");
const AIDatabase = require("../Structures/AIDatabase.js");
const db = require("../Structures/Database.js");

const openai = require("./Models/openai.js");
const groq = require("./Models/groq.js");
const claude = require("./Models/claude.js");

const PASTEBIN_API_KEY = supportbotai.General.PastebinAPI_Key;
const PASTEBIN_API_URL = supportbotai.General.PastebinAPI_URL;

const CHANNELS = [supportbotai.Channels.AIChannel].filter(Boolean);

async function createPaste(content) {
  try {
    if (!PASTEBIN_API_KEY || !PASTEBIN_API_URL) return null;

    const response = await axios.post(
      PASTEBIN_API_URL,
      new URLSearchParams({
        api_dev_key: PASTEBIN_API_KEY,
        api_option: "paste",
        api_paste_code: content,
        api_paste_private: 1,
        api_paste_expire_date: "1D",
        api_paste_format: "text",
      }),
    );

    return response.data;
  } catch (error) {
    console.error("Pastebin Error:", error);
    return null;
  }
}

function getProvider() {
  const provider = String(
    supportbotai.General.Provider || "openai",
  ).toLowerCase();

  switch (provider) {
    case "openai":
      return openai;

    case "groq":
      return groq;

    case "claude":
      return claude;

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

function formatTicketQuestionAnswers(questionAnswers) {
  if (!Array.isArray(questionAnswers) || questionAnswers.length === 0) {
    return "No ticket question answers were saved.";
  }

  return questionAnswers
    .map((item, index) => {
      const question = item?.question || `Question ${index + 1}`;
      const answer = item?.answer || "No answer provided";
      return `${index + 1}. ${question}\nAnswer: ${answer}`;
    })
    .join("\n\n");
}

function buildTicketContext(ticket, message) {
  if (!ticket) return "";

  return `
Ticket Information:
Ticket ID: ${ticket.ticket_id || ticket.id || "Unknown"}
Subject: ${ticket.subject || ticket.reason || "No subject provided"}
Department: ${ticket.department || "Not set"}
Priority: ${ticket.priority || "Not set"}
Created By: ${ticket.user_id || ticket.user || "Unknown"}
Current User: ${message?.author?.tag || "Unknown"} (${message?.author?.id || "Unknown"})

Ticket Question Answers:
${formatTicketQuestionAnswers(ticket.questionAnswers)}

Use this information when helping the user with their ticket.
Do not invent missing ticket details.
`;
}

function buildSystemPrompt(message) {
  const sections = [];

  if (Array.isArray(supportbotai.CustomInstructions)) {
    sections.push(...supportbotai.CustomInstructions);
  }

  sections.push(
    `I am currently powered by the ${supportbotai.General.Provider || "Unknown"} provider, running the ${supportbotai.General.Model || "Unknown"} model.`,
  );
  sections.push(
    `The current guild is: ${message.guild?.name || "Unknown Guild"}`,
  );
  sections.push(
    `The current channel is: #${message.channel?.name || "unknown-channel"}`,
  );

  return sections.join("\n- ").replace(/^/, "- ");
}

function buildConversationFromMemory(currentMessage) {
  const memoryConfig = supportbotai.Memory || {};
  const memoryEnabled = memoryConfig.Enabled !== false;
  const maxRecentMessages = memoryConfig.MaxRecentMessages || 15;
  const memoryScope = String(memoryConfig.Scope || "guild").toLowerCase();

  const conversation = [
    {
      role: "system",
      content: buildSystemPrompt(currentMessage),
    },
  ];

  if (!memoryEnabled) return conversation;

  const recentMessages =
    typeof AIDatabase.getRecentMessagesByScope === "function"
      ? AIDatabase.getRecentMessagesByScope({
        guildId: currentMessage.guild?.id || null,
        channelId: currentMessage.channel?.id || null,
        limit: maxRecentMessages,
        scope: memoryScope,
      })
      : AIDatabase.getRecentMessages(
        currentMessage.channel?.id,
        maxRecentMessages,
      );

  const latestSummary =
    memoryConfig.StoreSummaries !== false
      ? typeof AIDatabase.getLatestSummaryByScope === "function"
        ? AIDatabase.getLatestSummaryByScope({
          guildId: currentMessage.guild?.id || null,
          channelId: currentMessage.channel?.id || null,
          scope: memoryScope,
        })
        : AIDatabase.getLatestSummary(currentMessage.channel?.id)
      : null;

  const facts =
    memoryConfig.StoreFacts !== false
      ? typeof AIDatabase.getFactsByScope === "function"
        ? AIDatabase.getFactsByScope({
          guildId: currentMessage.guild?.id || null,
          channelId: currentMessage.channel?.id || null,
          scope: memoryScope,
        })
        : AIDatabase.getFacts(currentMessage.channel?.id)
      : [];

  const userFacts =
    memoryConfig.StoreFacts !== false &&
      typeof AIDatabase.getUserFactsByScope === "function"
      ? AIDatabase.getUserFactsByScope({
        guildId: currentMessage.guild?.id || null,
        userId: currentMessage.author?.id || null,
        scope: memoryScope,
      })
      : memoryConfig.StoreFacts !== false &&
        typeof AIDatabase.getUserFacts === "function"
        ? AIDatabase.getUserFacts(
          currentMessage.guild?.id,
          currentMessage.author?.id,
        )
        : [];

  const knowledgeBase = typeof AIDatabase.getKnowledge === "function"
    ? AIDatabase.getKnowledge(25)
    : [];

  if (latestSummary?.summary) {
    conversation.push({
      role: "system",
      content: `Shared memory summary (${memoryScope} scope):\n${latestSummary.summary}`,
    });
  }

  if (facts.length > 0) {
    const factText = facts
      .map(
        (fact) => `- [${fact.fact_type}] ${fact.fact_key}: ${fact.fact_value}`,
      )
      .join("\n");

    conversation.push({
      role: "system",
      content: `Known shared facts (${memoryScope} scope):\n${factText}`,
    });
  }

  if (userFacts.length > 0) {
    const userFactText = userFacts
      .map(
        (fact) => `- [${fact.fact_type}] ${fact.fact_key}: ${fact.fact_value}`,
      )
      .join("\n");

    conversation.push({
      role: "system",
      content: `Known facts about this user across chats:\n${userFactText}`,
    });
  }

  if (knowledgeBase.length > 0) {
    const knowledgeText = knowledgeBase
      .map((k) => `- ${k.content}`)
      .join("\n");

    conversation.push({
      role: "system",
      content: `Server Knowledge Base (use this to answer questions):\n${knowledgeText}`,
    });
  }

  for (const msg of recentMessages) {
    conversation.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    });
  }

  return conversation;
}

function getTicketContextForMessage(message) {
  if (!message?.channel) return null;

  if (typeof db.getTicketByAIChannel === "function") {
    const aiTicket = db.getTicketByAIChannel(message.channel.id);
    if (aiTicket) return aiTicket;
  }

  if (typeof db.getTicket === "function") {
    const directTicket = db.getTicket(message.channel.id);
    if (directTicket) return directTicket;
  }

  if (message.channel.isThread() && typeof db.getTicket === "function") {
    const parentTicket = db.getTicket(message.channel.parentId);
    if (parentTicket) return parentTicket;
  }

  return null;
}

function getAIMessageType() {
  return String(supportbotai.Style?.MessageType || "embed").toLowerCase();
}

function shouldSuggestTicket(message, ticket) {
  if (supportbotai.Features?.SuggestTickets !== true) return false;
  if (ticket) return false;
  if (message.channel.isThread()) return false;
  return CHANNELS.includes(message.channel.id);
}

function getSuggestTicketText() {
  return (
    supportbotai.Messages?.SuggestTicketText ||
    "-# Need more help? React with 🎫 to open a ticket."
  );
}

async function sendAIResponse({
  client,
  message,
  replyContent,
  suggestTicket = false,
}) {
  const messageType = getAIMessageType();
  const ticketHint = suggestTicket ? `\n\n${getSuggestTicketText()}` : "";

  if (messageType === "text") {
    return message.reply({
      content: `${replyContent}${ticketHint}`,
    });
  }

  if (messageType === "components_v2") {
    const {
      ContainerBuilder,
      TextDisplayBuilder,
      SeparatorBuilder,
      MessageFlags,
    } = Discord;

    const container = new ContainerBuilder();

    if (supportbot.Embed?.Colours?.General) {
      container.setAccentColor(
        parseInt(String(supportbot.Embed.Colours.General).replace("#", ""), 16),
      );
    }

    const title = new TextDisplayBuilder().setContent(
      `**${supportbotai.General?.Name || "SupportBot AI"}**`,
    );

    const body = new TextDisplayBuilder().setContent(replyContent);

    container.addTextDisplayComponents(title);
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    container.addTextDisplayComponents(body);

    if (suggestTicket) {
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(getSuggestTicketText()),
      );
    }

    return message.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  }

  const embed = new Discord.EmbedBuilder()
    .setAuthor({
      name: supportbotai.General.Name,
      iconURL: client.user.displayAvatarURL(),
    })
    .setDescription(`${replyContent}${ticketHint}`)
    .setColor(supportbotai.Embed.Color)
    .setFooter({
      text: supportbotai.Embed.Footer,
      iconURL: message.author.displayAvatarURL(),
    })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

function rememberUserFacts(message) {
  if (!message?.guild || !message?.author || !message?.content) return;

  const content = message.content.trim();

  const nameMatch = content.match(/^my name is\s+(.+)$/i);
  if (nameMatch && typeof AIDatabase.saveUserFact === "function") {
    AIDatabase.saveUserFact({
      guildId: message.guild.id,
      userId: message.author.id,
      factType: "profile",
      factKey: "name",
      factValue: nameMatch[1].trim(),
    });
  }

  const nicknameMatch = content.match(/^i(?:'| a)?m\s+(.+)$/i);
  if (
    nicknameMatch &&
    nicknameMatch[1] &&
    nicknameMatch[1].length <= 32 &&
    typeof AIDatabase.saveUserFact === "function"
  ) {
    AIDatabase.saveUserFact({
      guildId: message.guild.id,
      userId: message.author.id,
      factType: "profile",
      factKey: "display_name",
      factValue: nicknameMatch[1].trim(),
    });
  }

  const usesMatch = content.match(/^i use\s+(.+)$/i);
  if (usesMatch && typeof AIDatabase.saveUserFact === "function") {
    AIDatabase.saveUserFact({
      guildId: message.guild.id,
      userId: message.author.id,
      factType: "preference",
      factKey: "uses",
      factValue: usesMatch[1].trim(),
    });
  }
}

module.exports = new Event("messageCreate", async (client, message) => {
  if (message.author.bot || !message.guild) return;

  let shouldRespond =
    CHANNELS.includes(message.channelId) ||
    message.mentions.users.has(client.user.id);

  if (!shouldRespond && message.channel.isThread()) {
    let ticket = null;

    if (typeof db.getTicketByAIChannel === "function") {
      ticket = db.getTicketByAIChannel(message.channel.id);
    }

    if (!ticket && typeof db.getTicket === "function") {
      ticket = db.getTicket(message.channel.id);
    }

    if (
      !ticket &&
      message.channel.parentId &&
      typeof db.getTicket === "function"
    ) {
      ticket = db.getTicket(message.channel.parentId);
    }

    if (
      ticket &&
      ticket.aiModeEnabled &&
      ticket.aiChannelId === message.channel.id
    ) {
      shouldRespond = true;
    }
  }

  if (!shouldRespond) return;

  if (!supportbotai.Enabled) {
    const embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: supportbotai.General.Name,
        iconURL: client.user.displayAvatarURL(),
      })
      .setDescription(
        supportbotai.Messages?.AIDisabled || "AI is currently disabled.",
      )
      .setColor(supportbot.Embed.Colours.Error)
      .setFooter({
        text: supportbotai.Embed.Footer,
        iconURL: message.author.displayAvatarURL(),
      });

    return message.reply({ embeds: [embed] });
  }

  const typingInterval = setInterval(() => {
    message.channel.sendTyping().catch(() => { });
  }, 5000);

  try {
    const memoryConfig = supportbotai.Memory || {};
    const memoryEnabled = memoryConfig.Enabled !== false;

    if (memoryEnabled) {
      AIDatabase.addMessage({
        guildId: message.guild.id,
        channelId: message.channel.id,
        userId: message.author.id,
        role: "user",
        content: message.content,
      });

      rememberUserFacts(message);
    }

    const ticket = getTicketContextForMessage(message);

    const conversation = buildConversationFromMemory(message);

    if (ticket) {
      conversation.push({
        role: "system",
        content: buildTicketContext(ticket, message),
      });
    }

    const provider = getProvider();

    const response = await provider.chat({
      messages: conversation,
      temperature: supportbotai.General.Temperature || 0.4,
      maxTokens: supportbotai.General.Tokens || 800,
    });

    clearInterval(typingInterval);

    if (!response?.content) {
      const embed = new Discord.EmbedBuilder()
        .setDescription(
          supportbotai.Messages?.ErrorResponse ||
          "I couldn't generate a response.",
        )
        .setColor(supportbotai.Embed.Color);

      return message.reply({ embeds: [embed] });
    }

    const replyContent = response.content;

    if (memoryEnabled) {
      AIDatabase.addMessage({
        guildId: message.guild.id,
        channelId: message.channel.id,
        userId: client.user.id,
        role: "assistant",
        content: replyContent,
      });
    }

    if (replyContent.length > 4000) {
      const pasteLink = await createPaste(replyContent);

      if (pasteLink) {
        const embed = new Discord.EmbedBuilder()
          .setDescription(
            (
              supportbotai.Messages?.MessageTooLong ||
              "My response was too long, so I uploaded it here: {pastebin}"
            ).replace("{pastebin}", pasteLink),
          )
          .setColor(supportbotai.Embed.Color);

        return message.reply({ embeds: [embed] });
      }

      return message.reply({
        content: replyContent.slice(0, 1900),
      });
    }

    const suggestTicket = shouldSuggestTicket(message, ticket);

    const sentMessage = await sendAIResponse({
      client,
      message,
      replyContent,
      suggestTicket: false,
    });

    if (
      shouldSuggestTicket(message, ticket) &&
      supportbotai.Features?.SuggestTickets === true
    ) {
      const hintMessage = await message.channel.send(
        supportbotai.Messages?.SuggestTicketText ||
        "Need more help? React with 🎫 to open a ticket.",
      );

      await hintMessage
        .react(supportbotai.Messages?.SuggestTicketReaction || "🎫")
        .catch(() => { });

      setTimeout(
        () => {
          hintMessage.delete().catch(() => { });
        },
        5 * 60 * 1000,
      );
    }
  } catch (error) {
    clearInterval(typingInterval);

    console.error("AI Error:", error);

    const embed = new Discord.EmbedBuilder()
      .setDescription(
        supportbotai.Messages?.AIError ||
        supportbotai.Messages?.ErrorResponse ||
        "There was an error contacting the AI provider.",
      )
      .setColor(supportbot.Embed.Colours.Error);

    message.reply({ embeds: [embed] }).catch(() => { });
  }
});