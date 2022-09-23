// SupportBot | Emerald Services
// User Info Command

const fs = require("fs");
const moment = require("moment");

const {
  MessageEmbed
} = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(
    fs.readFileSync("./Configs/commands.yml", "utf8")
);

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.UserInfoCommand, // Name of command
  description: cmdconfig.UserInfoCommandDesc, // Description of command
  options: [
    {
      type: "USER",
      name: "user",
      description: "The user you want to get info about.",
      required: true,
    }, // The user input
  ],
  permissions: ["SEND_MESSAGES"], // The permission the user/role at least requires

  async run(interaction) {
    const { getRole } = interaction.client;
    let SupportStaff = await getRole(supportbot.Staff, interaction.guild);
    let Admin = await getRole(supportbot.Admin, interaction.guild);
    if (!SupportStaff || !Admin) {
      return interaction.reply("Some roles seem to be missing!\nPlease check the error logs.");
    }
        
    const NoPerms = new MessageEmbed()
      .setTitle("Invalid Permissions!")
      .setDescription(`${supportbot.IncorrectPerms}\n\nRole Required: \`${supportbot.Staff}\` or \`${supportbot.Admin}\``)
      .setColor(supportbot.WarningColour);

    if (!interaction.member.roles.cache.has(SupportStaff.id) && !interaction.member.roles.cache.has(Admin.id)) {
      return interaction.reply({ embeds: [NoPerms] });
    }

    let user = await interaction.options.getUser("user") || interaction.author; // Grab the mentioned user
    let member = await interaction.guild.members.cache.get(user.id) // Check for user and his ID

    const UserNotExist = new MessageEmbed()
      .setTitle("User Not Found!")
      .setDescription(`${supportbot.UserNotFound}\n\nTry Again:\`/${cmdconfig.UserInfoCommand} <@!User_ID> or @User\``)
      .setColor(supportbot.ErrorColour);
        
    if (!user) {
      return interaction.reply({ embeds: [UserNotExist] });
    }

    // Flags a user/bot can have
    const flags = {
      DISCORD_EMPLOYEE: 'Discord Employee',
      DISCORD_PARTNER: 'Discord Partner',
      BUGHUNTER_LEVEL_1: 'Bug Hunter (Level 1)',
      BUGHUNTER_LEVEL_2: 'Bug Hunter (Level 2)',
      HYPESQUAD_EVENTS: 'HypeSquad Events',
      HOUSE_BRAVERY: 'House of Bravery',
      HOUSE_BRILLIANCE: 'House of Brilliance',
      HOUSE_BALANCE: 'House of Balance',
      EARLY_SUPPORTER: 'Early Supporter',
      TEAM_USER: 'Team User',
      SYSTEM: 'System',
      VERIFIED_BOT: 'Verified Bot',
      VERIFIED_DEVELOPER: 'Verified Bot Developer'
    };

    // Status message with icon
    let status = {
      online: "🟢Online",
      idle: "🟡Idle",
      dnd: "🔴Do Not Disturb",
      offline: "⚫Offline"
    };

    const userFlags = user.flags.toArray();

    // Embed containing the userinfo
    let userembed = new MessageEmbed()
      .setTitle(`User Info for User: ${user.tag}`)
      .setThumbnail(member.displayAvatarURL({ dynamic: true, size: 512 }))
      .setColor(member.roles.highest.hexColor)
      .addFields([
        { name: "Name:", value: `${user.tag}\n<@${member.id}>`, inline: true },
        { name: "ID:", value: `${member.id}`, inline: true },
        { name: "Is Bot:", value: user.bot ? "Yes" : "No", inline: true },
        { name: "House/Badge:", value: `${userFlags.length ? userFlags.map(flag => flags[flag]).join("\n") : "None"}`, inline: true },
        { name: "Current Status:", value: `${status[member.presence ? member.presence.status : "offline"]}`, inline: true },
        { name: "Avatar URL:", value: `[Click Here](${member.displayAvatarURL()})`, inline: true },
        { name: "\u200b", value: "\u200b", inline: false}
      ])
      .addFields([
        { name: "Creation Date:", value: `${moment(user.createdAt).format("MMMM Do YYYY, h:mm:ss a")}\n> ${moment(user.createdAt).startOf("day").fromNow()}`, inline: true },
        { name: "Joined Date:", value: `${moment(member.joinedAt).format("MMMM Do YYYY, h:mm:ss a")}\n> ${moment(member.joinedAt).startOf("day").fromNow()}`, inline: true },
        { name: "Roles Total:", value: `${member.roles.cache.size -1}`, inline: false },
        { name: "Highest Role:", value: `${member.roles.highest.id === interaction.guild.id ? "None" : member.roles.highest.toString()}`, inline: true },
        { name: "Roles:", value: `${member.roles.cache.map(r => r).join(" ").replace("@everyone", " ") || "None"}`, inline: false },
      ])
      .setFooter({ text: supportbot.EmbedFooter })
      .setTimestamp();

    // Send embed [userembed]
    await interaction.reply({ embeds: [userembed] }).catch((err) => console.error("An error has occured: ", err));
  }
});

/**
 * @INFO
 * UserInfo command by Sypher#3415 | 321332200668790786
 * @INFO
 * Solely created for SupportBot | https://github.com/Emerald-Services/SupportBot/
 **/
