// Emerald Services | SupportBot
// Groq integration for SupportBot AI 

const fs = require("fs");
const yaml = require("js-yaml");
const OpenAI = require("openai");

const supportbotai = yaml.load(
  fs.readFileSync("./Configs/supportbot-ai.yml", "utf8"),
);

const client = new OpenAI({
  apiKey: supportbotai.General.Model_API_Key,
  baseURL: "https://api.groq.com/openai/v1",
});

function extractTextFromMessage(message) {
  if (!message) return "";

  if (typeof message.content === "string") {
    return message.content.trim();
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part?.type === "text" && typeof part.text === "string") {
          return part.text;
        }
        if (typeof part?.text?.value === "string") {
          return part.text.value;
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

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: temperature || supportbotai.General.Temperature || 0.4,
    max_tokens: maxTokens || supportbotai.General.Tokens || 800,
  });

  const choice = response?.choices?.[0];
  const message = choice?.message;
  const content = extractTextFromMessage(message);

  if (!content) {
    console.error("Groq raw response:", JSON.stringify(response, null, 2));
    throw new Error(
      `Groq returned empty response. finish_reason=${choice?.finish_reason || "unknown"}`,
    );
  }

  return {
    content,
    raw: response,
  };
}

module.exports = {
  chat,
};
