// SupportBot | Emerald Services
// Ticket Add Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.TicketAdd,
  description: cmdconfig.TicketAddDesc,
  options: [
    {
      name: "user",
      description: "User to add",
      type: "USER",
      required: true,
    },
  ],
  permissions: ["SEND_MESSAGES"],

  async run(interaction) {
    const { getRole } = interaction.client;
    let SupportStaff = await getRole(supportbot.Staff, interaction.guild);
    let Admin = await getRole(supportbot.Admin, interaction.guild);
    if (!SupportStaff || !Admin)
      return interaction.reply(
        "Some roles seem to be missing!\nPlease check for errors when starting the bot."
      );

    const NoPerms = new Discord.MessageEmbed()
      .setTitle("Invalid Permissions!")
      .setDescription(
        `${supportbot.IncorrectPerms}\n\nRole Required: \`${supportbot.Staff}\` or \`${supportbot.Admin}\``
      )
      .setColor(supportbot.WarningColour);

    if (
      !interaction.member.roles.cache.has(SupportStaff.id) &&
      !interaction.member.roles.cache.has(Admin.id)
    )
      return interaction.reply({ ephemeral: true, embeds: [NoPerms] });

    let TicketData = await JSON.parse(
      fs.readFileSync("./Data/TicketData.json", "utf8")
    );
    let ticket = await TicketData.tickets.findIndex(
      (t) => t.id === interaction.channel.id
    );
    if (ticket === -1) {
      const Exists = new Discord.MessageEmbed()
        .setTitle("No Ticket Found!")
        .setDescription(supportbot.NoValidTicket)
        .setColor(supportbot.WarningColour);
      return interaction.reply({ ephemeral: true, embeds: [Exists] });
    }

    let uMember = interaction.options.getUser("user");
    const UserNotExist = new Discord.MessageEmbed()
      .setTitle("User Not Found!")
      .setDescription(
        `${supportbot.UserNotFound}\n\nTry Again:\`/${cmdconfig.TicketAdd} <user#0000>\``
      )
      .setColor(supportbot.ErrorColour);

    if (!uMember) return interaction.reply({ embeds: [UserNotExist] });

    await interaction.channel.permissionOverwrites.edit(uMember.id, {
      VIEW_CHANNEL: true,
    });
    const Complete = new Discord.MessageEmbed()
      .setTitle("User Added!")
      .setDescription(supportbot.AddedUser.replace(/%user%/g, uMember.id))
      .setTimestamp()
      .setColor(supportbot.EmbedColour);
    interaction.reply({ embeds: [Complete] });
    TicketData.tickets[ticket].subUsers.push(uMember.id);
    fs.writeFileSync(
      "./Data/TicketData.json",
      JSON.stringify(TicketData, null, 4),
      (err) => {
        if (err) console.error(err);
      }
    );
  },
});
