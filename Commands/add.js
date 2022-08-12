// SupportBot | Emerald Services
// Ticket Add Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");

const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);

const cmdconfig = yaml.load(
  fs.readFileSync("./Configs/commands.yml", "utf8")
);

const msgconfig = yaml.load(
  fs.readFileSync("./Configs/messages.yml", "utf8")
);

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.TicketAdd.Command,
  description: cmdconfig.TicketAdd.Description,
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "User to add",
      type: Discord.ApplicationCommandOptionType.User,
      required: true,
    },
  ],
  permissions: cmdconfig.TicketAdd.Permission,

  async run(interaction) {
    let disableCommand = true;

    const { getRole } = interaction.client;
    let SupportStaff = await getRole(supportbot.Roles.StaffMember.Staff, interaction.guild);
    let Admin = await getRole(supportbot.Roles.StaffMember.Admin, interaction.guild);
    if (!SupportStaff || !Admin)
    
      return interaction.reply(
        "Some roles seem to be missing!\nPlease check for errors when starting the bot."
      );

    const NoPerms = new Discord.EmbedBuilder()
      .setTitle("Invalid Permissions!")
      .setDescription(
        `${msgconfig.Error.IncorrectPerms}\n\nRole Required: \`${supportbot.Roles.StaffMember.Staff}\` or \`${supportbot.Roles.StaffMember.Admin}\``
      )
      .setColor(supportbot.Embed.Colours.Warn);

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
      const Exists = new Discord.EmbedBuilder()
        .setTitle("No Ticket Found!")
        .setDescription(msgconfig.Error.NoValidTicket)
        .setColor(supportbot.Embed.Colours.Warn);
      return interaction.reply({ ephemeral: true, embeds: [Exists] });
    }

    let uMember = interaction.options.getUser("user");
    const UserNotExist = new Discord.EmbedBuilder()
      .setTitle("User Not Found!")
      .setDescription(
        `${msgconfig.Error.UserNotFound}\n\nTry Again:\`/${cmdconfig.TicketAdd} <user#0000>\``
      )
      .setColor(supportbot.Embed.Colours.Error);

    if (!uMember) return interaction.reply({ embeds: [UserNotExist] });

    await interaction.channel.permissionOverwrites.edit(uMember.id, {
      ViewChannel: true,
    });
    const Complete = new Discord.EmbedBuilder()
      .setTitle("User Added!")
      .setDescription(msgconfig.Ticket.AddedUser.replace(/%user%/g, uMember.id))
      .setTimestamp()
      .setColor(supportbot.Embeds.Colours.General);
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
