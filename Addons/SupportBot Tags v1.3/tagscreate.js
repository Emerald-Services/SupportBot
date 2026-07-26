const Discord = require("discord.js");
const fs = require("fs");
const yaml = require("js-yaml");
const { Command } = require('../Structures/Addon.js'); // Adjust the path as needed
const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));

module.exports = new Command({
    name: "tagscreate",
    description: "Create a new tag.",
    options: [
        {
            name: 'name',
            type: Discord.ApplicationCommandOptionType.String,
            description: 'The name of the tag',
            required: true,
        },
        {
            name: 'content',
            type: Discord.ApplicationCommandOptionType.String,
            description: 'The content of the tag (use ; or /n for new lines)',
            required: true,
        },
        {
            name: 'image',
            type: Discord.ApplicationCommandOptionType.Attachment,
            description: 'The image URL of the tag',
            required: false,
        },
        {
            name: 'embed',
            type: Discord.ApplicationCommandOptionType.Boolean,
            description: 'Do you want this tag to send as an embed',
            required: false,
        },
        {
            name: 'ephemeral',
            type: Discord.ApplicationCommandOptionType.Boolean,
            description: 'Do you want this tag to send as ephemeral',
            required: false,
        },
    ],
    permissions: ["SendMessages"],

    async run(interaction) {
        const tagName = interaction.options.getString('name').toLowerCase();
        let tagContent = interaction.options.getString('content');
        const tagImage = interaction.options.getAttachment('image');
        const isEmbed = interaction.options.getBoolean('embed');
        const isEphemeral = interaction.options.getBoolean('ephemeral');
        const tagsPath = './Addons/Data/tags.json';

        // Process line breaks in content - support both ; and /n notations
        tagContent = tagContent.replace(/;/g, '\n').replace(/\/n/g, '\n');

        let tags = {};

        if (fs.existsSync(tagsPath)) {
            tags = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));
        }

        tags[tagName] = {
            content: tagContent,
            image: tagImage ? tagImage.url : null,
            embed: isEmbed || false,
            ephemeral: isEphemeral || false,
        };

        fs.writeFileSync(tagsPath, JSON.stringify(tags, null, 4));

        const embed = new Discord.EmbedBuilder()
            .setDescription(`Tag "${tagName}" created successfully.`)
            .setColor(supportbot.Embed.Colours.General);

        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
});