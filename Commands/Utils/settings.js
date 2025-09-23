const { Command } = require('../../Structures/Addon.js');
const Discord = require("discord.js");
const fs = require("fs");
const yaml = require("js-yaml");
const db = require("../../Structures/Database.js");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

async function loadSettings() {
  return new Promise((resolve, reject) => {
    db.get("SELECT data FROM settings WHERE id = 1", (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve({});
      try {
        resolve(JSON.parse(row.data));
      } catch (e) {
        resolve({});
      }
    });
  });
}

async function saveSettings(settings) {
  const data = JSON.stringify(settings);
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO settings (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
      [data],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

module.exports = new Command({
  name: cmdconfig.Settings.Command,
  description: cmdconfig.Settings.Description,
  permissions: cmdconfig.Settings.Permission,
  options: [
    {
      name: 'setstatus',
      type: Discord.ApplicationCommandOptionType.Subcommand,
      description: 'Set the bot status',
      options: [
        {
          name: 'status',
          type: Discord.ApplicationCommandOptionType.String,
          description: 'Choose the bot status',
          required: true,
          choices: [
            { name: 'Online 🟢', value: 'online' },
            { name: 'Idle 🌙', value: 'idle' },
            { name: 'Do Not Disturb ⛔', value: 'dnd' },
            { name: 'Invisible 👻', value: 'invisible' }
          ],
        },
      ],
    },
    {
      name: 'setactivity',
      type: Discord.ApplicationCommandOptionType.Subcommand,
      description: 'Set the bot activity',
      options: [
        {
          name: 'type',
          type: Discord.ApplicationCommandOptionType.String,
          description: 'Choose the activity type',
          required: true,
          choices: [
            { name: 'Playing 🎮', value: 'PLAYING' },
            { name: 'Watching 👀', value: 'WATCHING' },
            { name: 'Listening 🎧', value: 'LISTENING' },
            { name: 'Competing 🏆', value: 'COMPETING' }
          ],
        },
        {
          name: 'message',
          type: Discord.ApplicationCommandOptionType.String,
          description: 'The activity message',
          required: true,
        },
      ],
    },
    {
      name: 'streammode',
      type: Discord.ApplicationCommandOptionType.Subcommand,
      description: 'Set the bot streaming status',
      options: [
        {
          name: 'toggle',
          type: Discord.ApplicationCommandOptionType.String,
          description: 'Turn streaming mode on or off',
          required: true,
          choices: [
            { name: 'On', value: 'on' },
            { name: 'Off', value: 'off' }
          ],
        },
        {
          name: 'twitchurl',
          type: Discord.ApplicationCommandOptionType.String,
          description: 'Twitch stream URL (Required if turning on)',
          required: false,
        },
      ],
    },
    {
      name: 'setnickname',
      type: Discord.ApplicationCommandOptionType.Subcommand,
      description: 'Set the bot nickname',
      options: [
        {
          name: 'nickname',
          type: Discord.ApplicationCommandOptionType.String,
          description: 'The new nickname for the bot',
          required: true,
        },
      ],
    },
  ],

  async run(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const settings = await loadSettings();

    if (subcommand === 'setstatus') {
      const status = interaction.options.getString('status');

      try {
        interaction.client.user.setPresence({
          status: status,
          activities: interaction.client.user.presence.activities || [],
        });

        settings.status = status;
        await saveSettings(settings);

        const embed = new Discord.EmbedBuilder()
          .setDescription(`Status set to **${status.charAt(0).toUpperCase() + status.slice(1)}**`)
          .setColor(supportbot.Embed.Colours.General);

        return interaction.reply({ embeds: [embed], flags: Discord.MessageFlags.Ephemeral });
      } catch (error) {
        return interaction.reply({ content: `Failed to set status: ${error.message}`, flags: Discord.MessageFlags.Ephemeral });
      }
    } 
    
    if (subcommand === 'setactivity') {
      const activityType = interaction.options.getString('type');
      const activityMessage = interaction.options.getString('message');

      try {
        interaction.client.user.setPresence({
          activities: [{ name: activityMessage, type: Discord.ActivityType[activityType] }],
          status: interaction.client.user.presence.status || 'online',
        });

        settings.activity = { type: activityType, message: activityMessage };
        await saveSettings(settings);

        const embed = new Discord.EmbedBuilder()
          .setDescription(`Activity set to **${activityType.toLowerCase()} ${activityMessage}**`)
          .setColor(supportbot.Embed.Colours.General);

        return interaction.reply({ embeds: [embed], flags: Discord.MessageFlags.Ephemeral  });
      } catch (error) {
        return interaction.reply({ content: `Failed to set activity: ${error.message}`, flags: Discord.MessageFlags.Ephemeral  });
      }
    } else if (subcommand === 'streammode') {
      const toggle = interaction.options.getString('toggle');
      const twitchUrl = interaction.options.getString('twitchurl');

      if (toggle === 'on') {
        if (!twitchUrl) {
          return interaction.reply({ content: 'Please provide a Twitch URL to stream.', flags: Discord.MessageFlags.Ephemeral  });
        }

        try {
          interaction.client.user.setPresence({
            activities: [{ name: 'Streaming', type: Discord.ActivityType.Streaming, url: twitchUrl }],
            status: 'online',
          });

          settings.streaming = { active: true, url: twitchUrl };
          await saveSettings(settings);

          const embed = new Discord.EmbedBuilder()
            .setDescription(`**Streaming mode enabled!**\nStreaming: [Twitch](${twitchUrl})`)
            .setColor(supportbot.Embed.Colours.General);

          return interaction.reply({ embeds: [embed], flags: Discord.MessageFlags.Ephemeral  });
        } catch (error) {
          return interaction.reply({ content: `Failed to enable streaming mode: ${error.message}`, flags: Discord.MessageFlags.Ephemeral  });
        }
      } else if (toggle === 'off') {
        try {
          interaction.client.user.setPresence({
            activities: interaction.client.user.presence.activities.filter(a => a.type !== Discord.ActivityType.Streaming),
            status: settings.status || 'online',
          });

          settings.streaming = { active: false };
          await saveSettings(settings);

          const embed = new Discord.EmbedBuilder()
            .setDescription(`**Streaming mode disabled!**`)
            .setColor(supportbot.Embed.Colours.General);

          return interaction.reply({ embeds: [embed], flags: Discord.MessageFlags.Ephemeral  });
        } catch (error) {
          return interaction.reply({ content: `Failed to disable streaming mode: ${error.message}`, flags: Discord.MessageFlags.Ephemeral  });
        }
      }
    } else if (subcommand === 'setnickname') {
      const nickname = interaction.options.getString('nickname');

      try {
        const guild = interaction.guild;
        const botMember = guild.members.cache.get(interaction.client.user.id);
        await botMember.setNickname(nickname);

        settings.nickname = nickname;
        await saveSettings(settings);

        const embed = new Discord.EmbedBuilder()
          .setDescription(`Bot nickname set to **${nickname}**`)
          .setColor(supportbot.Embed.Colours.General);

        return interaction.reply({ embeds: [embed], flags: Discord.MessageFlags.Ephemeral  });
      } catch (error) {
        return interaction.reply({ content: `Failed to set nickname: ${error.message}`, flags: Discord.MessageFlags.Ephemeral  });
      }
    } else {
      return interaction.reply({ content: 'Invalid command usage.', flags: Discord.MessageFlags.Ephemeral  });
    }
  },
});
