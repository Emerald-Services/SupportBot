// SupportBot | Emerald Services
// Ready Event

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");

const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const panelconfig = yaml.load(
  fs.readFileSync("./Configs/ticket-panel.yml", "utf8")
);

const cmdconfig = yaml.load(
  fs.readFileSync("./Configs/commands.yml", "utf8")
);

const msgconfig = yaml.load(
  fs.readFileSync("./Configs/messages.yml", "utf8")
);

const Event = require("../Structures/Event.js");

module.exports = new Event("ready", async (client, interaction) => {
  const { getRole, getChannel, getCategory } = client;
  client.user.setActivity(supportbot.Activity.Status, {
    type: supportbot.Activity.Type,
    url: supportbot.Activity.StreamingURL,
  });

  console.log(`\u001b[32m`, `――――――――――――――――――――――――――――――――――――――――――――`);
  console.log(`    `);
  console.log(`\u001b[31m`, `┏━━━┓╋╋╋╋╋╋╋╋╋╋╋╋╋┏┓┏━━┓╋╋╋┏┓`);
  console.log(`\u001b[31m`, `┃┏━┓┃╋╋╋╋╋╋╋╋╋╋╋╋┏┛┗┫┏┓┃╋╋┏┛┗┓`);
  console.log(`\u001b[31m`, `┃┗━━┳┓┏┳━━┳━━┳━━┳┻┓┏┫┗┛┗┳━┻┓┏┛`);
  console.log(`\u001b[31m`, `┗━━┓┃┃┃┃┏┓┃┏┓┃┏┓┃┏┫┃┃┏━┓┃┏┓┃┃`);
  console.log(`\u001b[31m`, `┃┗━┛┃┗┛┃┗┛┃┗┛┃┗┛┃┃┃┗┫┗━┛┃┗┛┃┗┓`);
  console.log(`\u001b[31m`, `┗━━━┻━━┫┏━┫┏━┻━━┻┛┗━┻━━━┻━━┻━┛`);
  console.log(`\u001b[31m`, `┗╋╋╋╋╋╋╋┃┃╋┃┃`);
  console.log(`\u001b[31m`, `╋╋╋╋╋╋╋┗┛╋┗┛`);
  console.log(`    `);
  console.log(`\u001b[32m`, `――――――――――――――――――――――――――――――――――――――――――――`);
  console.log(`    `);
  console.log(
    `\u001b[31m`,
    `${supportbot.General.Name} | [${supportbot.SupportBot_Version}]`,
    `\u001b[32m`,
    `Connected to Discord`,
  );
  
  console.log(`\u001b[31m`, `SupportBot proudly created by Emerald Development`);

  console.log(`    `);

  console.log(
    `\u001b[31m`,
    `Discord`,
    `\u001b[32m`,
    `https://dsc.gg/emerald-dev`,
  );

  console.log(
    `\u001b[31m`,
    `Resources`,
    `\u001b[32m`,
    `https://emeraldsrv.dev`,
  );

  console.log(
    `\u001b[31m`,
    `Documentation`,
    `\u001b[32m`,
    `https://emeraldsrv.dev/wiki`,
  );

  console.log(
    `\u001b[31m`,
    `Third-Party Documentation`,
    `\u001b[32m`,
    `https://emeraldsrv.dev/third-party`,
  );

  console.log(`    `);

  console.log(
    `\u001b[31m`,
    `Invite URL:`,
    `\u001b[36m`,
    `https://discord.com/api/oauth2/authorize?client_id=` +
      client.user.id +
      `&permissions=8&scope=bot%20applications.commands`
  );

  console.log(`    `);
  console.log(`\u001b[32m`, `――――――――――――――――――――――――――――――――――――――――――――`);

  const roles = [
    supportbot.Roles.StaffMember.Admin,
    supportbot.Roles.StaffMember.Staff,
    supportbot.Roles.ModRoles.Blacklisted,
    supportbot.Roles.ModRoles.Muted
  ];

    supportbot.Departments.forEach((department) => roles.push(department.role));

  if (supportbot.Roles.AutoRole.Role) roles.push(supportbot.Roles.AutoRole.Role);
  
  // const channels = [
  //   supportbot.Suggestions.Channel,
  //   supportbot.Ticket.Log.TicketLog,
  //   supportbot.Ticket.Log.TranscriptLog,
  //   panelconfig.Channel,
  //   supportbot.Welcome.Channel,
  //   supportbot.Leave.Channel,
  //   supportbot.Translate.Log
  // ];
  //const categories = [supportbot.TicketCategory];

  const missingC = [];
  const missingR = [];
  const missingCat = [];
  
  // for (let c of channels) {
  //   if ((c === supportbot.Suggestion.Channel && cmdconfig.Suggestion.Enabled) || c === supportbot.Ticket.Log.TicketLog && supportbot.Ticket.Log.DisableTicketLogChannel) {
  //     continue;
  //   }
  //   const find = await getChannel(c, client.guilds.cache.first());
  //   if (!find) missingC.push(c);
  // }
  
  for (let r of roles) {
    const find = await getRole(r, client.guilds.cache.first());
    if (!find) missingR.push(r);
  }
 // for (let cat of categories) {
 //   const find = await getCategory(cat, client.guilds.cache.first());
 //   if (!find) missingCat.push(cat);
 // }

  if (missingR.length > 0) {
    console.log(
      "\u001b[31m",
      `[MISSING CONFIGURATION]`,
      "\u001b[33m",
      `The following Roles could not be found in your server.\n`, `\u001b[31m`, `[${missingR.join(
        ", "
      )}]`, `\n  `,
    );
  }

  if (missingC.length > 0) {
    console.log(
      "\u001b[31m",
      `[MISSING CONFIGURATION]`,
      "\u001b[33m",
      `The following Channels could not be found in your server.\n`, `\u001b[31m`, `[${missingC.join(
        ", "
      )}]`, `\n  `
    );
  }
  if (missingCat.length > 0) {
    console.log(
      "\u001b[31m",
      `[MISSING CONFIGURATION]`,
      "\u001b[33m",
      `The following Categories could not be found in your server.\n`, `\u001b[31m`, `[${missingCat.join(
        ", "
      )}]`, `\n  `,
    );
  }
  if (panelconfig.TicketPanel) {
    let chan1 = await client.getChannel(
      panelconfig.Channel,
      client.guilds.cache.first()
    );

    if (!chan1) {
      console.log(
        "\u001b[31m",
        `[TICKET PANEL]`,
        "\u001b[33m",
        "Ticket Panel is not setup, You can set this in", `\u001b[31m`, '/Configs/Ticket-Panel.yml', `\n  `,
      );
      return false;
    }

    const panelid = JSON.parse(
      fs.readFileSync("./Data/ticket-panel-id.json", "utf8")
    );

    chan1.messages.fetch(panelid.TicketPanelID).catch(async () => {
      let embed = new Discord.EmbedBuilder()
        .setTitle(panelconfig.PanelTitle)
        .setColor(panelconfig.PanelColour)
        .setFooter({
          text: supportbot.Embed.Footer,
          iconURL: interaction.user.displayAvatarURL(),
        });

      if (panelconfig.TicketPanel_Description) {
        embed.setDescription(panelconfig.PanelMessage);
      }

      if (panelconfig.TicketPanel_Thumbnail) {
        embed.setThumbnail(panelconfig.PanelThumbnail);
      }

      if (panelconfig.TicketPanel_Image) {
        embed.setImage(panelconfig.PanelImage);
      }
      let button;

        button = supportbot.Departments.map((x) =>
          new Discord.ButtonBuilder()
            .setCustomId("department-" + supportbot.Departments.indexOf(x))
            .setLabel(x.title)
            .setStyle(x.color)
            .setEmoji(x.emoji)
        );

      let row = new Discord.ActionRowBuilder().addComponents(button);

      await chan1
        .send({
          embeds: [embed],
          components: [row],
        })
        .then((r) => {
          let data = {
            id: panelid.id,
            TicketPanelID: r.id,
          };
          fs.writeFileSync(
            "./Data/ticket-panel-id.json",
            JSON.stringify(data),
            "utf8"
          );
        })
        .catch((e) => {
          console.log("Raw: " + e);
        });
    });
  }
});