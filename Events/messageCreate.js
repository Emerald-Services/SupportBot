const fs = require("fs");
const Discord = require("discord.js");
const yaml = require("js-yaml");
const axios = require("axios");
const { OpenAI } = require('openai');

// Load configuration files with validation
function loadConfig(path) {
    try {
        return yaml.load(fs.readFileSync(path, "utf8"));
    } catch (error) {
        console.error(`Error loading config file at ${path}:`, error);
        throw error;
    }
}

const supportbotai = yaml.load(fs.readFileSync("./Configs/supportbot-ai.yml"));
const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));
// Validate configuration values
function validateConfig(config, keys) {
    keys.forEach(key => {
        if (!config[key]) {
            throw new Error(`Missing configuration key: ${key}`);
        }
    });
}

const CHANNELS = [supportbotai.Channels.AIChannel];

// Initialize Discord client
const client = new Discord.Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages']
});

// Load custom Event structure
const Event = require("../Structures/Event.js");

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: supportbotai.General.OpenAI_Key,
});

const PASTEBIN_API_KEY = supportbotai.General.PastebinAPI_Key;
const PASTEBIN_API_URL = supportbotai.General.PastebinAPI_URL;

// Function to create a paste on Pastebin
async function createPaste(content) {
    try {
        const response = await axios.post(PASTEBIN_API_URL, new URLSearchParams({
            api_dev_key: PASTEBIN_API_KEY,
            api_option: 'paste',
            api_paste_code: content,
            api_paste_private: 1, // 0 = public, 1 = unlisted, 2 = private
            api_paste_expire_date: '1D', // Expire in 1 day
            api_paste_format: 'text'
        }));
        return response.data;
    } catch (error) {
        console.error('Pastebin Error:', error);
        throw error;
    }
}

// Event handler for message creation
module.exports = new Event("messageCreate", async (client, message) => {
    if (message.author.bot || !message.guild) return;
    if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;

if (supportbotai.Enabled) {

    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);

    let conversation = [{
        role: "system",
        content: "SupportBot is your friendly neighbourhood support bot."
    }];

    let prevMessages = await message.channel.messages.fetch({ limit: 10 });
    prevMessages = prevMessages.reverse().filter(msg => !msg.author.bot || msg.author.id === client.user.id);

    prevMessages.forEach((msg) => {
        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

        conversation.push({
            role: msg.author.id === client.user.id ? "assistant" : "user",
            name: username,
            content: msg.content,
        });
    });

    try {
        const response = await openai.chat.completions.create({
            model: supportbotai.General.Model,
            messages: conversation,
            max_tokens: supportbotai.General.Tokens,
        });

        clearInterval(sendTypingInterval);

        if (response.choices && response.choices.length > 0) {
            const replyContent = response.choices[0].message.content;

            const SupportBotAI = new Discord.EmbedBuilder()
                .setAuthor({ name: supportbotai.General.Name, iconURL: client.user.displayAvatarURL() })
                .setDescription(replyContent)
                .setColor(supportbotai.Embed.Color)
                .setFooter({ text: supportbotai.Embed.Footer, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            if (replyContent.length > 2000) {
                const pasteLink = await createPaste(replyContent);

                const SupportBotAIPastebin = new Discord.EmbedBuilder()
                    .setAuthor({ name: supportbotai.General.Name, iconURL: client.user.displayAvatarURL() })
                    .setDescription(supportbotai.Messages.MessageTooLong.replace("{pastebin}", pasteLink))
                    .setColor(supportbotai.Embed.Color)
                    .setFooter({ text: supportbotai.Embed.Footer, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();

                message.reply({ embeds: [SupportBotAIPastebin] });
            } else {
                message.reply({ embeds: [SupportBotAI] });
            }
        } else {
            const SupportBotAIErrorResponse = new Discord.EmbedBuilder()
                .setAuthor({ name: supportbotai.General.Name, iconURL: client.user.displayAvatarURL() })
                .setDescription(supportbotai.Messages.ErrorResponse)
                .setColor(supportbotai.Embed.Color)
                .setFooter({ text: supportbotai.Embed.Footer, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            message.reply({ embeds: [SupportBotAIErrorResponse], ephemeral: true });
        }
    } catch (error) {
        clearInterval(sendTypingInterval);

        const SupportBotAIErrorResponse = new Discord.EmbedBuilder()
            .setAuthor({ name: supportbotai.General.Name, iconURL: client.user.displayAvatarURL() })
            .setDescription(supportbotai.Messages.OpenAIError)
            .setColor(supportbot.Embed.Colours.Error)
            .setFooter({ text: supportbotai.Embed.Footer, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        console.error('OpenAI Error:', error);
        message.reply({ embeds: [SupportBotAIErrorResponse], ephemeral: true });
    }

}

if (supportbotai.Enabled === false) {
    const AIDisabled = new Discord.EmbedBuilder()
        .setAuthor({ name: supportbotai.General.Name, iconURL: client.user.displayAvatarURL() })
        .setDescription(supportbotai.Messages.AIDisabled)
        .setColor(supportbot.Embed.Colours.Error)
        .setFooter({ text: supportbotai.Embed.Footer, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

    message.reply({ embeds: [AIDisabled], ephemeral: true })
    return;
}

});