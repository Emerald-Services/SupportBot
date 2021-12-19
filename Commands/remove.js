// SupportBot | Emerald Services
// Ticket Remove Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

module.exports = new Command({
  name: cmdconfig.TicketRemove,
  description: cmdconfig.TicketRemoveDesc,
  options: [
    {
      name: "user",
      description: "User to remove",
      type: "USER",
      required: true,
    },
  ],
  permissions: ["SEND_MESSAGES"],

  async run(interaction) {
    const { getRole, getChannel, getCategory } = interaction.client;
    let Staff = await getRole(supportbot.Staff, interaction.guild);
    let Admin = await getRole(supportbot.Admin, interaction.guild);
    if (!Staff || !Admin)
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
      !interaction.member.roles.cache.has(Staff.id) &&
      !interaction.member.roles.cache.has(Admin.id)
    )
      return interaction.reply({ embeds: [NoPerms] });
    let TicketData = await JSON.parse(
      fs.readFileSync("./Data/TicketData.json", "utf8")
    );
    let ticket = await TicketData.tickets.findIndex(
      (t) => t.id == interaction.channel.id
    );
    if (ticket == -1) {
      const Exists = new Discord.MessageEmbed()
        .setTitle("No Ticket Found!")
        .setDescription(`${supportbot.NoValidTicket}`)
        .setColor(supportbot.WarningColour);
      return interaction.reply({ embeds: [Exists] });
    }

    let uMember = interaction.options.getUser("user");
    const UserNotExist = new Discord.MessageEmbed()
      .setTitle("User Not Found!")
      .setDescription(
        `${supportbot.UserNotFound}\n\nTry Again:\`/${cmdconfig.TicketRemove} <user#0000>\``
      )
      .setColor(supportbot.ErrorColour);

    if (!uMember) return interaction.reply({ embeds: [UserNotExist] });

    interaction.channel.permissionOverwrites.edit(uMember.id, {
      VIEW_CHANNEL: false,
    });

    const Complete = new Discord.MessageEmbed()
      .setTitle("User Removed!")
      .setDescription(supportbot.RemovedUser.replace(/%user%/g, uMember.id))
      .setTimestamp()
      .setColor(supportbot.EmbedColour);
    interaction.reply({ embeds: [Complete] });
    TicketData.tickets[ticket].subUsers = TicketData.tickets[
      ticket
    ].subUsers.filter((u) => u != uMember.id);
    fs.writeFileSync(
      "./Data/TicketData.json",
      JSON.stringify(TicketData, null, 4),
      (err) => {
        if (err) console.error(err);
      }
    );
  },
});
