// Emerald Services | SupportBot
// Claude integration for SupportBot AI 

const fs = require("fs");
const yaml = require("js-yaml");
const axios = require("axios");

const supportbotai = yaml.load(
  fs.readFileSync("./Configs/supportbot-ai.yml", "utf8"),
);

function extractTextFromMessage(message) {
  if (!message) return "";

  if (typeof message === "string") {
    return message.trim();
  }

  if (message.text) {
    return message.text.trim();
  }

  if (Array.isArray(message)) {
    return message
      .map((part) => {
        if (typeof part === "string") return part;
        if (part?.type === "text" && typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

async function chat({ messages, temperature, maxTokens }) {
  const model = supportbotai.General.Model;
  const apiKey = supportbotai.General.Model_API_Key;

  const systemMessages = messages.filter((m) => m.role === "system");
  const systemPrompt = systemMessages.map((m) => m.content).join("\n\n");

  const userAssistantMessages = messages.filter((m) => m.role !== "system");

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model,
      system: systemPrompt || undefined,
      messages: userAssistantMessages,
      temperature: temperature || supportbotai.General.Temperature || 0.4,
      max_tokens: maxTokens || supportbotai.General.Tokens || 800,
    },
    {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
    }
  );

  const data = response.data;
  const content = extractTextFromMessage(data.content);

  if (!content) {
    console.error("Claude raw response:", JSON.stringify(data, null, 2));
    throw new Error(
      `Claude returned empty response. stop_reason=${data?.stop_reason || "unknown"}`,
    );
  }

  return {
    content,
    raw: data,
  };
}

module.exports = {
  chat,
};
