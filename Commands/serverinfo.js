const fs = require("fs");

const Discord = require("discord.js");
const { MessageEmbed } = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");



module.exports = new Command({
    name: "serverinfo",
    description: "Displays information about the server.",
    options: [],
    permissions: ["SEND_MESSAGES"],
    async run(interaction) {
      const guild = interaction.guild;
      const serverOwner = await guild.fetchOwner();
  
      const serverInfoEmbed = new MessageEmbed()
        .setTitle("Server Information")
        .setColor(supportbot.EmbedColour)
        .setThumbnail(guild.iconURL() || "");
  
      serverInfoEmbed.addFields(
        { name: "Server Name", value: guild.name || "Not available", inline: true },
        { name: "Server ID", value: guild.id || "Not available", inline: true  },
        { name: "Owner", value: serverOwner.user?.tag || "Not available", inline: true  },
        { name: "Creation Date", value: guild.createdAt.toDateString() || "Not available", inline: true  },
        { name: "Verification Level", value: guild.verificationLevel || "Not available, inline: true " },
        { name: "Region", value: guild.region || "Not available", inline: true  },
        { name: "Boost Level", value: guild.premiumTier || "Not available", inline: true  },
        { name: "Channel Count", value: guild.channels.cache.size.toString() || "Not available", inline: true  },
        { name: "Text Channel Count", value: guild.channels.cache.filter(channel => channel.type === "GUILD_TEXT").size.toString() || "Not available", inline: true  },
        { name: "Voice Channel Count", value: guild.channels.cache.filter(channel => channel.type === "GUILD_VOICE").size.toString() || "Not available", inline: true  },
        { name: "Emoji Count", value: guild.emojis.cache.size.toString() || "Not available", inline: true  },
        { name: "Server Boost Count", value: guild.premiumSubscriptionCount.toString() || "Not available", inline: true  },
        { name: "Server Features", value: guild.features.join(", ") || "Not available", inline: true  }
      );
  
      const memberCount = guild.memberCount;
      if (typeof memberCount === "number") {
        serverInfoEmbed.addField("Total Members", memberCount.toString(), true);
      } else {
        serverInfoEmbed.addField("Total Members", "Not available", true);
      }

    const roles = guild.roles.cache;
    const roleCount = roles.size - 1; // Subtract 1 to exclude @everyone role
    const roleList = roles.map(role => role.name).join(", ");
    if (roleCount > 0) {
       serverInfoEmbed.addField("Role Count", roleCount.toString(), true);
       serverInfoEmbed.addField("Roles", roleList, true);

    } else {
      serverInfoEmbed.addField("Roles", "No roles found", true);
    }
      interaction.reply({ embeds: [serverInfoEmbed] });
    },
  });