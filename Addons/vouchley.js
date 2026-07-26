const Discord = require("discord.js");
const fs = require("fs");
const yaml = require("js-yaml");
const fetch = require("node-fetch");
const { Command } = require('../Structures/Addon.js');

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const vouchleyaddon = yaml.load(fs.readFileSync("./Addons/Configs/vouchley.yml", "utf8"));

function formatURL(url) {
    if (!url) return 'https://www.vouchley.com';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }
    return url;
}

function formatDate(timestamp) {
    return `<t:${Math.floor(new Date(timestamp).getTime() / 1000)}:D>`;
}

function createReviewEmbed(review, username, currentPage, totalReviews) {
    const embed = new Discord.EmbedBuilder()
        .setTitle(`Review for ${username}`)
        .setColor(vouchleyaddon.Embed.Colour);

    const fields = [
        {
            name: "Rating",
            value: "⭐".repeat(Math.min(Math.max(review.rating, 1), 5)) || "No rating",
            inline: false
        },
        {
            name: "Platform",
            value: review.platform?.toString() || "Not specified",
            inline: true
        },
        {
            name: "Date",
            value: formatDate(review.time_sent),
            inline: true
        }
    ];

    if (review.message && review.message.trim()) {
        fields.push({
            name: "Review",
            value: `\`\`\`${review.message.substring(0, 1024)}\`\`\``,
            inline: false
        });
    }

    embed.addFields(fields);
    embed.setFooter({ text: `Review ${currentPage + 1} of ${totalReviews}` });

    return embed;
}

function createReviewNavigation(currentPage, totalReviews) {
    return new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('prev_review')
                .setLabel('Previous')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(currentPage === 0),
            new Discord.ButtonBuilder()
                .setCustomId('next_review')
                .setLabel('Next')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(currentPage === totalReviews - 1),
            new Discord.ButtonBuilder()
                .setCustomId('back_to_profile')
                .setLabel('Back to Profile')
                .setStyle(Discord.ButtonStyle.Secondary)
        );
}

const activeReviews = new Map();

module.exports = new Command({
    name: vouchleyaddon.Command.Name,
    description: vouchleyaddon.Command.Description,
    options: [
        {
            name: "search_type",
            description: "How do you want to search for the user?",
            type: 3,
            required: true,
            choices: [
                { name: "Vouchley ID", value: "id" },
                { name: "Vouchley Username", value: "username" },
            ]
        },
        {
            name: "query",
            description: "Enter the ID, username, or Discord ID to search",
            type: 3,
            required: true
        }
    ],
    permissions: vouchleyaddon.Command.Permissions,

    async run(interaction) {
        const searchType = interaction.options.getString("search_type");
        const query = interaction.options.getString("query");

        try {
            let apiUrl;
            switch (searchType) {
                case "id":
                    apiUrl = `https://www.vouchley.com/api/v1/user?id=${query}`;
                    break;
                case "username":
                    apiUrl = `https://www.vouchley.com/api/v1/user?username=${query}`;
                    break;
            }

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${vouchleyaddon.Vouchley.API_Key}`,
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();

            if (!response.ok || (data.error && data.error.code !== 200)) {
                return interaction.reply({ 
                    content: `Error: ${data.error?.message || 'Failed to fetch user data'}`, 
                    ephemeral: vouchleyaddon.Embed.Ephemeral 
                });
            }

            const user = data.user;

            const profileEmbed = new Discord.EmbedBuilder()
                .setTitle(`${user.username} - ${String(user.title || "N/A")}`)
                .setColor(vouchleyaddon.Embed.Colour)
                .setThumbnail(user.avatar_url)
                .addFields([
                    { 
                        name: "Discord", 
                        value: `<@${String(user.discord_id)}> (\`${String(user.discord_id)}\`)`, 
                        inline: false 
                    },
                    { 
                        name: "Average Rating", 
                        value: `${String(user.average_rating)} (\`${String(user.reviews.length)} Reviews\`)`, 
                        inline: false 
                    }
                ]);

            const profileButtons = [
                new Discord.ButtonBuilder()
                    .setLabel(`Review ${user.username}`)
                    .setURL(`https://www.vouchley.com/review?user=${user.username}`)
                    .setStyle(Discord.ButtonStyle.Link)
            ];

            if (user.website) {
                profileButtons.push(
                    new Discord.ButtonBuilder()
                        .setLabel('Visit Website')
                        .setURL(formatURL(user.website))
                        .setStyle(Discord.ButtonStyle.Link)
                );
            }

            if (user.reviews && user.reviews.length > 0) {
                profileButtons.push(
                    new Discord.ButtonBuilder()
                        .setCustomId('seereviews')
                        .setLabel('See Reviews')
                        .setEmoji("⭐")
                        .setStyle(Discord.ButtonStyle.Secondary)
                );
            }

            const profileRow = new Discord.ActionRowBuilder()
                .addComponents(profileButtons);

            const message = await interaction.reply({ 
                embeds: [profileEmbed],
                components: [profileRow],
                fetchReply: true,
                ephemeral: vouchleyaddon.Embed.Ephemeral
            });

            if (user.reviews && user.reviews.length > 0) {
                activeReviews.set(message.id, {
                    reviews: user.reviews,
                    currentPage: 0,
                    username: user.username,
                    profileEmbed,
                    profileRow
                });

                const collector = message.createMessageComponentCollector({ 
                    time: 600000
                });

                collector.on('collect', async i => {
                    const reviewData = activeReviews.get(message.id);
                    if (!reviewData) return;

                    switch (i.customId) {
                        case 'seereviews': {
                            const review = reviewData.reviews[reviewData.currentPage];
                            const reviewEmbed = createReviewEmbed(
                                review, 
                                reviewData.username, 
                                reviewData.currentPage, 
                                reviewData.reviews.length
                            );
                            const reviewNav = createReviewNavigation(
                                reviewData.currentPage, 
                                reviewData.reviews.length
                            );
                            await i.update({ 
                                embeds: [reviewEmbed], 
                                components: [reviewNav],
                                ephemeral: vouchleyaddon.Embed.Ephemeral 
                            });
                            break;
                        }
                        case 'prev_review': {
                            if (reviewData.currentPage > 0) {
                                reviewData.currentPage--;
                                const review = reviewData.reviews[reviewData.currentPage];
                                const reviewEmbed = createReviewEmbed(
                                    review, 
                                    reviewData.username, 
                                    reviewData.currentPage, 
                                    reviewData.reviews.length
                                );
                                const reviewNav = createReviewNavigation(
                                    reviewData.currentPage, 
                                    reviewData.reviews.length
                                );
                                await i.update({ 
                                    embeds: [reviewEmbed], 
                                    components: [reviewNav],
                                    ephemeral: vouchleyaddon.Embed.Ephemeral 
                                });
                            }
                            break;
                        }
                        case 'next_review': {
                            if (reviewData.currentPage < reviewData.reviews.length - 1) {
                                reviewData.currentPage++;
                                const review = reviewData.reviews[reviewData.currentPage];
                                const reviewEmbed = createReviewEmbed(
                                    review, 
                                    reviewData.username, 
                                    reviewData.currentPage, 
                                    reviewData.reviews.length
                                );
                                const reviewNav = createReviewNavigation(
                                    reviewData.currentPage, 
                                    reviewData.reviews.length
                                );
                                await i.update({ embeds: [reviewEmbed], components: [reviewNav] });
                            }
                            break;
                        }
                        case 'back_to_profile': {
                            await i.update({ 
                                embeds: [reviewData.profileEmbed],
                                components: [reviewData.profileRow]
                            });
                            break;
                        }
                    }
                });

                collector.on('end', () => {
                    activeReviews.delete(message.id);
                });
            }
            
        } catch (error) {
            console.error(error);
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: "There was an error fetching Vouchley user data.", 
                    ephemeral: vouchleyaddon.Embed.Ephemeral  
                });
            }
        }
    }
});
