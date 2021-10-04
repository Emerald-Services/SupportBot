// SupportBot | Emerald Services
// Interaction Create Event

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./Data/supportbot.yml', 'utf8'));

const Event = require("../Structures/Event.js");

module.exports = new Event("interactionCreate", (client, interaction) => {
    if (interaction.user.bot || !interaction.isCommand() || !interaction.guild)
        return;

    const args = [
        interaction.commandName,
        ...client.commands
            .find(cmd => cmd.name.toLowerCase() == interaction.commandName)
            .slashCommandOptions.map(v => `${interaction.options.get(v.name).value}`)
    ];

    const command = client.commands.find(cmd => cmd.name.toLowerCase() == interaction.commandName);

    const NotValid = new Discord.MessageEmbed()
        .setDescription(`:x: \`Invalid Command\` `)
        .setColor(supportbot.ErrorColour)

    if (!command) return interaction.reply({
        embeds: [NotValid]
    });

    const permission = interaction.member.permissions.has(command.permission);

    const ValidPerms = new Discord.MessageEmbed()
        .setDescription(":x: \`Invalid Permissions\` Do you have the correct permissions to execute this command?")
        .setColor(supportbot.ErrorColour)

    if (!permission)
        return interaction.reply({
            embeds: [ValidPerms]
        });

    command.run(interaction, args, client);
});