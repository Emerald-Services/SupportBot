const Discord = require('discord.js');
const fs = require('fs');
const yaml = require('js-yaml');
const { Command } = require('../Structures/Addon.js'); 
const supportbot = yaml.load(fs.readFileSync('./Configs/supportbot.yml', 'utf8'));
const sactionaddon = yaml.load(fs.readFileSync('./Addons/Configs/sactionaddon.yml', 'utf8'));

module.exports = new Command({
    name: 'sanction',
    description: 'Sanction a user (kick, ban, or timeout).',
    options: [
        {
            name: 'action',
            type: 3,
            description: 'The action to perform (kick, ban, timeout)',
            required: true,
            choices: [
                { name: 'Kick', value: 'kick' },
                { name: 'Ban', value: 'ban' },
                { name: 'Timeout', value: 'timeout' }
            ]
        },
        {
            name: 'user',
            type: 6, 
            description: 'The user to sanction',
            required: true
        },
        {
            name: 'reason',
            type: 3, 
            description: 'Reason for the sanction',
            required: false
        },
        {
            name: 'duration',
            type: 3, 
            description: 'Duration of the timeout (e.g., "10m", "2h", "1d")',
            required: false
        }
    ],
    permissions: [],

    async run(interaction) {
        const action = interaction.options.getString('action');
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const duration = interaction.options.getString('duration');
        const staffRoleId = supportbot.Roles.StaffMember.Staff;

        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (!member || !member.roles.cache.has(staffRoleId)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const targetMember = interaction.guild.members.cache.get(user.id);
        if (!targetMember) {
            return interaction.reply({ content: 'The user is not a member of this guild.', ephemeral: true });
        }

        try {
            let actionMessage = '';
            let logEmbed = new Discord.EmbedBuilder().setColor(supportbot.Embed.Colours.General); 

            switch (action) {
                case 'kick':
                    if (!targetMember.kickable) return interaction.reply({ content: 'I cannot kick this user.', ephemeral: true });
                    await targetMember.kick(reason);
                    actionMessage = `Successfully kicked ${user.tag} for: ${reason}`;
                    logEmbed
                        .setTitle('User Kicked')
                        .setDescription(`**User:** ${user.tag}\n**Reason:** ${reason}`)
                        .addFields(
                            { name: 'Action By', value: interaction.user.tag, inline: true },
                            { name: 'Action', value: 'Kick', inline: true },
                            { name: 'Timestamp', value: new Date().toISOString(), inline: true }
                        );
                    break;

                case 'ban':
                    if (!targetMember.bannable) return interaction.reply({ content: 'I cannot ban this user.', ephemeral: true });
                    await targetMember.ban({ reason });
                    actionMessage = `Successfully banned ${user.tag} for: ${reason}`;
                    logEmbed
                        .setTitle('User Banned')
                        .setDescription(`**User:** ${user.tag}\n**Reason:** ${reason}`)
                        .addFields(
                            { name: 'Action By', value: interaction.user.tag, inline: true },
                            { name: 'Action', value: 'Ban', inline: true },
                            { name: 'Timestamp', value: new Date().toISOString(), inline: true }
                        );
                    break;

                case 'timeout':
                    // Ensure a valid duration is provided
                    if (!duration) return interaction.reply({ content: 'You must specify a duration for the timeout.', ephemeral: true });

                    // Convert duration to milliseconds
                    const parsedDuration = ms(duration);
                    if (!parsedDuration) return interaction.reply({ content: 'Invalid duration format. Use "1s", "5m", "2h", or "1d".', ephemeral: true });

                    // Apply the timeout
                    await targetMember.timeout(parsedDuration, reason);
                    actionMessage = `Successfully timed out ${user.tag} for ${duration} with reason: ${reason}`;
                    logEmbed
                        .setTitle('User Timed Out')
                        .setDescription(`**User:** ${user.tag}\n**Duration:** ${duration}\n**Reason:** ${reason}`)
                        .addFields(
                            { name: 'Action By', value: interaction.user.tag, inline: true },
                            { name: 'Action', value: 'Timeout', inline: true },
                            { name: 'Timestamp', value: new Date().toISOString(), inline: true }
                        );
                    break;

                default:
                    return interaction.reply({ content: 'Invalid action specified.', ephemeral: true });
            }

            // Send the action message
            interaction.reply({ content: actionMessage, ephemeral: true });

            // Log the action to the logging channel
            const logChannel = interaction.guild.channels.cache.get(sactionaddon.LogChannel);
            if (logChannel) {
                logChannel.send({ embeds: [logEmbed] });
            } else {
                console.error('Logging channel not found.');
            }
        } catch (error) {
            console.error('Error executing sanction command:', error);
            interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
        }
    },
});

/**
 * Converts a time duration string to milliseconds.
 * @param {string} duration - The duration string (e.g., "10m", "2h", "1d").
 * @returns {number} - The duration in milliseconds.
 */
function ms(duration) {
    const regex = /^(\d+)([smhd])$/;
    const match = regex.exec(duration);

    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000; // seconds
        case 'm': return value * 60 * 1000; // minutes
        case 'h': return value * 60 * 60 * 1000; // hours
        case 'd': return value * 24 * 60 * 60 * 1000; // days
        default: return null;
    }
}