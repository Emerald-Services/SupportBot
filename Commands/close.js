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
  name: cmdconfig.CloseTicket.Command,
  description: cmdconfig.CloseTicket.Description,
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "reason",
      description: "Ticket Close Reason",
      type: Discord.ApplicationCommandOptionType.String,
    },
  ],
  permissions: cmdconfig.CloseTicket.Permission,

  async run(interaction) {
    const { getRole, getChannel } = interaction.client;

    if (supportbot.Ticket.Close.StaffOnly) {
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
        return interaction.reply({ embeds: [NoPerms] });
    }

    if (interaction.channel.type !== Discord.ChannelType.PrivateThread) {
      const NotTicketChannel = new Discord.EmbedBuilder()
        .setTitle("Invalid Channel!")
        .setDescription("This command can only be used in a ticket thread.")
        .setColor(supportbot.Embed.Colours.Warn);

      return interaction.reply({ embeds: [NotTicketChannel], ephemeral: true });
    }

    await interaction.deferReply();

    let tickets = JSON.parse(fs.readFileSync("./Data/TicketData.json", "utf8"));
    let TicketData = tickets.tickets.findIndex((t) => t.id === interaction.channel.id);
    let ticket = tickets.tickets[TicketData];

    if (TicketData === -1) {
      const Exists = new Discord.EmbedBuilder()
        .setTitle("No Ticket Found!")
        .setDescription(msgconfig.Error.NoValidTicket)
        .setColor(supportbot.Embed.Colours.Warn);
      return interaction.followUp({ embeds: [Exists] });
    }

    let reason = interaction.options?.getString("reason") || "No Reason Provided.";

    const CloseButton = new Discord.ButtonBuilder()
      .setCustomId("confirmCloseTicket")
      .setLabel(supportbot.Ticket.Close.Confirmation_Button)
      .setStyle(Discord.ButtonStyle.Danger);

    const row = new Discord.ActionRowBuilder().addComponents(CloseButton);

    const CloseTicketRequest = new Discord.EmbedBuilder()
      .setTitle(`**${supportbot.Ticket.Close.Title}**`)
      .setDescription(
        `${msgconfig.Ticket.ConfirmClose}`
      )
      .setColor(supportbot.Embed.Colours.General);

    await interaction.followUp({
      embeds: [CloseTicketRequest],
      components: [row],
    });

    const filter = (btnInteraction) => btnInteraction.customId === "confirmCloseTicket" && btnInteraction.user.id === interaction.user.id;

    interaction.channel.awaitMessageComponent({ filter, time: 20000 })
      .then(async (btnInteraction) => {
        await handleCloseTicket(interaction, reason, ticket, TicketData);
        await btnInteraction.reply({ content: "Ticket successfully closed.", ephemeral: true });
      })
      .catch((err) => {
        interaction.followUp(`${msgconfig.Ticket.CloseTimeout}`);
        console.error(err);
      });
  },
});

async function handleCloseTicket(interaction, reason, ticket, TicketData) {
  const { getChannel } = interaction.client;

  let tickets = JSON.parse(fs.readFileSync("./Data/TicketData.json", "utf8"));
  let tUser = interaction.client.users.cache.get(ticket.user);
  let transcriptChannel = await getChannel(supportbot.Ticket.Log.TranscriptLog, interaction.guild);
  let logChannel = await getChannel(supportbot.Ticket.Log.TicketLog, interaction.guild);

  if (!transcriptChannel || !logChannel)
    return interaction.followUp("Some Channels seem to be missing!");

  try {
    tickets.tickets[TicketData].open = false;
    fs.writeFileSync(
      "./Data/TicketData.json",
      JSON.stringify(tickets, null, 4),
      (err) => {
        if (err) console.error(err);
      }
    );

    const transcriptEmbed = new Discord.EmbedBuilder()
      .setTitle(supportbot.Ticket.Log.TranscriptTitle)
      .setColor(supportbot.Embed.Colours.General)
      .setFooter({
        text: supportbot.Embed.Footer,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .addFields(
        { name: "Ticket", value: `${interaction.channel.name} (${interaction.channel.id})` },
        { name: "User", value: `${tUser?.username || "N/A"}#${tUser?.discriminator || "N/A"} (${tUser?.id || ticket.user})` },
        { name: "Closed By", value: interaction.user.tag },
        { name: "Reason", value: reason }
      );

    const logEmbed = new Discord.EmbedBuilder()
      .setTitle(supportbot.Ticket.Log.TicketLog_Title)
      .setColor(supportbot.Embed.Colours.General)
      .setFooter({
        text: supportbot.Embed.Footer,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .addFields(
        { name: "Ticket", value: `${interaction.channel.name} (${interaction.channel.id})` },
        { name: "User", value: `${tUser?.username || "N/A"}#${tUser?.discriminator || "N/A"} (${tUser?.id || ticket.user})` },
        { name: "Closed By", value: interaction.user.tag },
        { name: "Reason", value: reason }
      );

    let msgs = await interaction.channel.messages.fetch({ limit: 100 });
    let html = `
      <html>
        <head>
          <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
          <style>
            body {
              background-color: #1a1a1a;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: white;
              margin: 0;
              padding: 0;
              height: 100%;
              display: flex;
              flex-direction: column;
            }
            .container {
              backdrop-filter: blur(10px);
              background-color: rgba(0, 128, 0, 0.3);
              border-radius: 15px;
              padding: 20px;
              margin: 20px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              max-width: 1000px;
              width: 100%;
              margin: auto;
            }
            .message {
              display: flex;
              align-items: center;
              margin-bottom: 10px;
              padding: 10px;
              background-color: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
            }
            .avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              margin-right: 10px;
            }
            .content {
              flex: 1;
            }
            .username {
              font-weight: bold;
            }
            .timestamp {
              font-size: 0.8em;
              color: #bbb;
            }
            .download-button {
              background-color: #4CAF50;
              color: white;
              padding: 10px 20px;
              text-align: center;
              text-decoration: none;
              display: inline-block;
              font-size: 16px;
              margin-top: 20px;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="text-2xl font-bold mb-4">Ticket Transcript</h1>
            <p><strong>Server Name:</strong> ${interaction.guild.name}</p>
            <p><strong>Ticket:</strong> ${interaction.channel.name}</p>
            <p><strong>Messages:</strong> ${msgs.size} Messages</p>
            <div class="mt-4">
    `;

    msgs = msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    msgs.forEach((msg) => {
      if (msg.content) {
        html += `
          <div class="message">
            <img class="avatar" src="${msg.author.displayAvatarURL()}" alt="Avatar">
            <div class="content">
              <p class="username">${msg.author.tag}</p>
              <p class="timestamp">${msg.createdAt.toLocaleString()}</p>
              <p>${convertMarkdownToHTML(msg.content)}</p>
            </div>
          </div>
        `;
      }
    });

    const fileName = `${interaction.channel.name}.html`;

    html += `
            </div>
            <a href="${fileName}" download class="download-button">Download Transcript</a>
          </div>
        </body>
      </html>
    `;

    if (!supportbot.Ticket.Log.DisableTicketLogChannel) {
      await logChannel.send({ embeds: [logEmbed] }).catch((err) => {
        console.error(err);
      });
    }

    let file = new Discord.AttachmentBuilder(
      Buffer.from(html),
      { name: fileName }
    );

    await transcriptChannel
      .send({ embeds: [transcriptEmbed], files: [file] })
      .catch((err) => {
        console.error(err);
      });

    if (supportbot.Ticket.DMTranscripts) {
      await tUser
        ?.send({ embeds: [transcriptEmbed], files: [file] })
        .catch((err) => {
          console.error(err);
        });

      if (ticket.subUsers) {
        ticket.subUsers.forEach(async (subUser) => {
          await interaction.client.users.cache
            .get(subUser)
            ?.send({ embeds: [transcriptEmbed], files: [file] });
        });
      }
    }

    await interaction.channel.delete().catch((error) => {
      console.error(error);
      if (error.code !== Discord.Constants.APIErrors.UNKNOWN_CHANNEL) {
        console.error("Failed to delete the interaction:", error);
      }
    });
  } catch (error) {
    console.error(error);
  }
}

function convertMarkdownToHTML(text) {
  // Convert **bold** to <strong>bold</strong>
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert *italic* to <em>italic</em>
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Convert __underline__ to <u>underline</u>
  text = text.replace(/__(.*?)__/g, '<u>$1</u>');

  // Convert ~~strikethrough~~ to <s>strikethrough</s>
  text = text.replace(/~~(.*?)~~/g, '<s>$1</s>');

  // Convert inline code `code` to <code>code</code>
  text = text.replace(/`(.*?)`/g, '<code>$1</code>');

  // Convert blockquotes > quote to <blockquote>quote</blockquote>
  text = text.replace(/^> (.*?$)/gm, '<blockquote>$1</blockquote>');

  // Convert multiline code blocks ```code``` to <pre><code>code</code></pre>
  text = text.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');

  // Convert line breaks to <br>
  text = text.replace(/\n/g, '<br>');

  return text;
}
