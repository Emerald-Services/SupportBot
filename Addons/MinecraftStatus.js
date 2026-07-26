const Discord = require("discord.js");
const { Command } = require("../Structures/Addon.js");
const fs = require("fs");
const yaml = require("js-yaml");
const axios = require("axios");

// Load configs
const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const minecraftConfig = yaml.load(fs.readFileSync("./Addons/Configs/minecraft.yml", "utf8"));

module.exports = new Command({
  name: "serverip",
  description: "Display the Minecraft server IP and status",
  options: [
    {
      name: "type",
      description: "The edition of Minecraft (Java or Bedrock)",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Java", value: "java" },
        { name: "Bedrock", value: "bedrock" },
      ],
    },
  ],
  permissions: ["SendMessages"],

  async run(interaction) {
    const type = interaction.options.getString("type");
    const config = type === "java" ? minecraftConfig.Java : minecraftConfig.Bedrock;
    
    await interaction.deferReply();

    try {
      const response = await axios.get(`https://api.mcstatus.io/v2/status/${type}/${config.IP}:${config.Port}`);
      const data = response.data;

      if (!data.online) {
        throw new Error("Server is offline");
      }

      const embed = new Discord.EmbedBuilder()
        .setTitle(`${config.DisplayName} Status`)
        .setTimestamp();

      embed.setColor(minecraftConfig.Embed.Color || supportbot.Embed.Colours.General)
        .setDescription(`The server is currently **Online**!`)
        .addFields(
          { name: "IP Address", value: `\`${config.IP}\``, inline: true },
          { name: "Port", value: `\`${config.Port}\``, inline: true },
          { name: "Players", value: `\`${data.players.online}/${data.players.max}\``, inline: true },
          { name: "Version", value: `\`${type === "java" ? data.version.name_clean : data.version.name || "Unknown"}\``, inline: true }
        );

      if (data.motd && data.motd.clean) {
        embed.addFields({ name: "MOTD", value: `\`\`\`${data.motd.clean}\`\`\`` });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching Minecraft status:", error);
      
      const config = interaction.options.getString("type") === "java" ? minecraftConfig.Java : minecraftConfig.Bedrock;

      const embed = new Discord.EmbedBuilder()
        .setTitle(`${config.DisplayName} Status`)
        .setTimestamp()
        .setColor(minecraftConfig.Embed.OfflineColor || "#FF0000")
        .setDescription(`The server is currently **Offline**.`)
        .addFields(
          { name: "IP Address", value: `\`${config.IP}\``, inline: true },
          { name: "Port", value: `\`${config.Port}\``, inline: true }
        );

      await interaction.editReply({ embeds: [embed] });
    }
  },
});
