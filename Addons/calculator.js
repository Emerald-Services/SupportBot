const Discord = require("discord.js");
const fs = require("fs");
const yaml = require("js-yaml");
const { Command } = require('../Structures/Addon.js'); // Adjust the path as needed
const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));

module.exports = new Command({
    name: "calculator",
    description: "Use a calculator to solve your math problems.",
    options: [],
    permissions: ["SendMessages"],
  
    async run(interaction) {
        let expression = "";
        let history = "";

        const createButton = (label, customId) => {
            return new Discord.ButtonBuilder()
                .setLabel(label)
                .setCustomId(customId)
                .setStyle(Discord.ButtonStyle.Secondary);
        };

        const createRow = (buttons) => {
            return new Discord.ActionRowBuilder().addComponents(buttons);
        };

        const rows = [
            createRow([createButton('7', '7'), createButton('8', '8'), createButton('9', '9'), createButton('/', '/')]),
            createRow([createButton('4', '4'), createButton('5', '5'), createButton('6', '6'), createButton('*', '*')]),
            createRow([createButton('1', '1'), createButton('2', '2'), createButton('3', '3'), createButton('-', '-')]),
            createRow([createButton('0', '0'), createButton('.', '.'), createButton('=', '='), createButton('+', '+')]),
            createRow([createButton('Clear', 'clear')])
        ];

        const embed = new Discord.EmbedBuilder()
            .setTitle('Calculator')
            .setDescription('Calculator')
            .setColor(supportbot.Embed.Colours.General);

        const message = await interaction.reply({
            embeds: [embed],
            components: rows,
            fetchReply: true
        });

        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'clear') {
                expression = "";
                history = "";
            } else if (i.customId === '=') {
                try {
                    const result = eval(expression).toString();
                    history += `${expression} = ${result}\n`;
                    expression = result;
                } catch {
                    expression = "Error";
                }
            } else {
                if (history.endsWith(`${expression} = ${expression}\n`)) {
                    history += `\n`;
                    expression = i.customId;
                } else {
                    expression += i.customId;
                }
            }

            await i.update({
                embeds: [new Discord.EmbedBuilder().setTitle('Calculator').setDescription(`\`\`\`${history}${expression}\`\`\``).setColor(supportbot.Embed.Colours.General)],
                components: rows
            });
        });

        collector.on('end', collected => {
            message.edit({
                components: []
            });
        });
    },
});
