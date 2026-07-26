const Discord = require("discord.js");
const fs = require("fs");
const yaml = require("js-yaml");
const { Command } = require('../Structures/Addon.js'); // Adjust the path as needed
const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));

module.exports = new Command({
  name: "tags",
  description: "Retrieve a saved tag.",
  options: [
    {
      name: 'name',
      type: Discord.ApplicationCommandOptionType.String,
      description: 'The name of the tag',
      required: true,
      autocomplete: true
    },
  ],
  permissions: ["SendMessages"],

  async autocomplete(interaction) {
    const tagsPath = './Addons/Data/tags.json';
    const focusedValue = interaction.options.getFocused().toLowerCase();
    
    if (!fs.existsSync(tagsPath)) {
      return interaction.respond([]);
    }
    
    const tags = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));
    const choices = Object.keys(tags)
      .filter(tag => tag.toLowerCase().includes(focusedValue))
      .slice(0, 25) // Discord has a limit of 25 choices
      .map(tag => ({ name: tag, value: tag }));
      
    return interaction.respond(choices);
  },

  async run(interaction) {
    const tagsPath = './Addons/Data/tags.json';
    const tagName = interaction.options.getString('name').toLowerCase();

    if (!fs.existsSync(tagsPath)) {
      const embed = new Discord.EmbedBuilder()
        .setDescription('No tags have been created yet.')
        .setColor(supportbot.Embed.Colours.General);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const tags = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));

    if (tags[tagName]) {
      const tag = tags[tagName];
      
      if (tag.embed) {
        // For embeds, Discord automatically handles line breaks correctly
        const embed = new Discord.EmbedBuilder()
          .setDescription(tag.content)
          .setColor(supportbot.Embed.Colours.General);

        if (tag.image) {
          embed.setImage(tag.image);
        }

        return interaction.reply({ embeds: [embed], ephemeral: tag.ephemeral || false });
      } else {
        // For plain text, we need to keep the line breaks
        const response = {
          content: tag.content,
          ephemeral: tag.ephemeral || false
        };

        if (tag.image) {
          response.files = [tag.image];
        }

        return interaction.reply(response);
      }
    } else {
      const embed = new Discord.EmbedBuilder()
        .setDescription(`Tag "${tagName}" not found.`)
        .setColor(supportbot.Embed.Colours.General);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
});