const fs = require("fs");
const Discord = require("discord.js");
const yaml = require("js-yaml");
const generateImage = require('../Structures/generateImage.js');

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: "image",
  description: "Create an image through SupportBot AI",
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "prompt",
      description: "The prompt to generate an image from",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "negativeprompt",
      description: "The negative prompt to exclude from the image",
      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "cfgscale",
      description: "The cfg scale for the image generation",
      type: Discord.ApplicationCommandOptionType.Number,
      required: false,
    }
  ],
  permissions: "SendMessages",

  async run(interaction) {
    const prompt = interaction.options.getString("prompt");
    const negativePrompt = interaction.options.getString("negativeprompt") || "";
    const cfgScale = interaction.options.getNumber("cfgscale") || 7.5; // Default value

    try {
      const imageUrl = await generateImage(prompt, negativePrompt, cfgScale);

      const ImageEmbed = new Discord.EmbedBuilder()
        .setTitle("Generated Image")
        .setDescription(`Here is the image generated for your prompt: "${prompt}"`)
        .setImage(imageUrl)
        .setColor(supportbot.Embed.Colours.General)
        .setFooter({
          text: supportbot.Embed.Footer,
          iconURL: interaction.user.displayAvatarURL(),
        });

      if (!interaction.replied) {
        await interaction.reply({
          ephemeral: true,
          embeds: [ImageEmbed],
        });
      } else {
        await interaction.followUp({
          ephemeral: true,
          embeds: [ImageEmbed],
        });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      if (!interaction.replied) {
        await interaction.reply({
          ephemeral: true,
          content: `An error occurred while generating the image: ${error.message}. Please try again later.`,
        });
      } else {
        await interaction.followUp({
          ephemeral: true,
          content: `An error occurred while generating the image: ${error.message}. Please try again later.`,
        });
      }
    }
  },
});
