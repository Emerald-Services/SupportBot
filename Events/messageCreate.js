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
            content: `SupportBot is your friendly neighbourhood support bot. Current date and time: ${new Date().toLocaleString()}.
            The bot uses a modular command handler where commands are loaded dynamically from the './Commands' directory. Each command has a name, description, and execute method.
            
            The main Client class structure:
            - Commands are loaded from the './Commands/' directory.
            - Configs are loaded from the './Configs/' directory if enabled.
            - Events are loaded from the './Events/' directory.
            - Addons are loaded from the './Addons/' directory if enabled.
            
            Example of a command structure:
            {
                module.exports = new Command({
                    name: cmdconfig.Ping.Command,
                    description: cmdconfig.Ping.Description,
                    options: [],
                    permissions: cmdconfig.Ping.Permission,
                )}
            }

            You can find more information about the commands and configuration files in the 'Configs' and 'Commands' directories.

            All commands are loaded into the bot at startup from ./Events/ready.js and ./Client.js.

            If someone asks you to do something, you can use the 'assist' command to have the bot respond, For example: "Can I speak to a support agent?", You would respond by opening a ticket which is the /Commands/ticket.js file or you can tell them to create a ticket in the channel defined as supportbot.Ticket.

            You can find the source code for the bot at https://github.com/EmeraldServices/SupportBot.

            You then need to understand how the bot works. Interactions are handled by the ./Events/interactionCreate.js file.
            
            Commands are filtered based on configuration settings and loaded into the bot at startup.
            
            Xiled Gaming Network (XGN) is a gaming community that typically offers various services and activities for gamers. 
            
            Xiled Gaming Network (XGN) has 4 divisions, Team Xiled International (TXI), The XiledOnes (TXO), Dealers of Death (DOD), Psychotic Solutions (PS)
            Xiled Gaming Network (XGN) can be found at https://officialxgn.gg/handbook/, This is where you can the code of conduct, policies and other important information for members.
            You can join XGN with the discord - discord.gg/xgn
            You can apply to join the XGN Clan - join.officialxgn.gg
            
            You can find the founders of XGN under the history section of the handbook. https://officialxgn.gg/handbook/.
            `
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

                if (replyContent.toLowerCase().startsWith("generate image:")) {
                    const prompt = replyContent.substring(15).trim();
                    const imageUrl = await generateImage(prompt);

                    const SupportBotAIImage = new Discord.EmbedBuilder()
                        .setAuthor({ name: supportbotai.General.Name, iconURL: client.user.displayAvatarURL() })
                        .setDescription(`Here is the image generated for your prompt: "${prompt}"`)
                        .setImage(imageUrl)
                        .setColor(supportbotai.Embed.Color)
                        .setFooter({ text: supportbotai.Embed.Footer, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp();

                    message.reply({ embeds: [SupportBotAIImage] });
                } else {
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

    if (!supportbotai.Enabled) {
        const AIDisabled = new Discord.EmbedBuilder()
            .setAuthor({ name: supportbotai.General.Name, iconURL: client.user.displayAvatarURL() })
            .setDescription(supportbotai.Messages.AIDisabled)
            .setColor(supportbot.Embed.Colours.Error)
            .setFooter({ text: supportbotai.Embed.Footer, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        message.reply({ embeds: [AIDisabled], ephemeral: true });
        return;
    }
});
