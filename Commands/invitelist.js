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
  name: "invitelist",
  description: "Displays a list of all active invites in the server.",
  options: [],
  permissions: ["SEND_MESSAGES"],
  async run(interaction) {
    const guild = interaction.guild;
    const invites = await guild.invites.fetch();

    const inviteListEmbed = new MessageEmbed()
      .setTitle("Server Invites")
      .setColor(supportbot.EmbedColour);

    if (invites.size === 0) {
      inviteListEmbed.setDescription("There are no active invites in the server.");
    } else {
        invites.forEach((invite) => {
            inviteListEmbed.addFields(
              { name: "Invite Code", value: invite.code, inline: true },
              { name: "Creator", value: invite.inviter.tag, inline: true },
              { name: "Usage Count", value: invite.uses.toString(), inline: true },
              { name: "\u200B", value: "\u200B" } // Empty field for spacing
            );
          });
    }

    interaction.reply({ embeds: [inviteListEmbed] });
  },
});