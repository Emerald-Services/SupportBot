// SupportBot | Emerald Services
// Discord Stats addon | Created by Xiled Emerald

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));

// If you need to read something from the main config!
const cmdconfig = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));

// This is for your Addon Configuration
const config = yaml.load(fs.readFileSync('./Addons/Configs/discord-stats.yml', 'utf8'));

const { Command, Event } = require("../Structures/Addon");

module.exports.commands = [

  new Command({
    name: "stats",
    description: "Create the discord statistic channels",
    options: [],
    permissions: ["SEND_MESSAGES"],
    async run(interaction) {
      const guild = interaction.guild;
      const statsCategory = guild.channels.cache.find(
        (category) =>
          category.name === config.StatsCategory ||
          category.id === config.StatsCategory
      );

      if (!statsCategory) {
        const errorEmbed = new Discord.MessageEmbed()
          .setTitle("Invalid Category")
          .setDescription(
            `${supportbot.InvalidChannel}\n\n**Category Required:** \`${config.StatsCategory}\``
          )
          .setColor(supportbot.ErrorColour);

        interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true,
        });
        return;
      }

      const guildName = guild.name;
      const userCount = guild.memberCount;
      const roleCount = guild.roles.cache.size;
      const channelCount = guild.channels.cache.size;

      try {
        const guildNameChannel = await guild.channels.create(guildName, {
          type: "GUILD_VOICE",
        });

        const userCountChannel = await guild.channels.create(
          `${config.UserCount_Name} ${userCount}`,
          {
            type: "GUILD_VOICE",
          }
        );

        const channelCountChannel = await guild.channels.create(
          `${config.ChannelCount_Name} ${channelCount}`,
          {
            type: "GUILD_VOICE",
          }
        );

        const roleCountChannel = await guild.channels.create(
          `${config.RoleCount_Name} ${roleCount}`,
          {
            type: "GUILD_VOICE",
          }
        );

        guildNameChannel.permissionOverwrites.edit(guild.id, {
          VIEW_CHANNEL: true,
          CONNECT: false,
        });

        userCountChannel.permissionOverwrites.edit(guild.id, {
          VIEW_CHANNEL: true,
          CONNECT: false,
        });

        channelCountChannel.permissionOverwrites.edit(guild.id, {
          VIEW_CHANNEL: true,
          CONNECT: false,
        });

        roleCountChannel.permissionOverwrites.edit(guild.id, {
          VIEW_CHANNEL: true,
          CONNECT: false,
        });

        userCountChannel.setParent(statsCategory.id);
        roleCountChannel.setParent(statsCategory.id);
        guildNameChannel.setParent(statsCategory.id);
        channelCountChannel.setParent(statsCategory.id);

        const successEmbed = new Discord.MessageEmbed()
          .setDescription(":white_check_mark: **[DISCORD STATS]** Channels created successfully!")
          .setColor(supportbot.EmbedColour);

        interaction.reply({
          embeds: [successEmbed],
          ephemeral: true,
        });

        setInterval(() => {
          userCountChannel.setName(
            `${config.UserCount_Name} ${userCount}`
          );
          channelCountChannel.setName(
            `${config.ChannelCount_Name} ${channelCount}`
          );
          roleCountChannel.setName(
            `${config.RoleCount_Name} ${roleCount}`
          );
        }, 30000);
      } catch (error) {
        console.error(error);
        const errorEmbed = new Discord.MessageEmbed()
          .setTitle("Error")
          .setDescription("An error occurred while creating the stats channels.")
          .setColor(supportbot.ErrorColour);

        interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true,
        });
      }
    },
  }),

];
