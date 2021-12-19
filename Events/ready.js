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

const Event = require("../Structures/Event.js");

module.exports = new Event("ready", async (client) => {
  const { getRole, getChannel, getCategory } = client;
  client.user.setActivity(supportbot.BotActivity, {
    type: supportbot.ActivityType,
    url: supportbot.StreamingURL,
  });

  console.log(`\u001b[32m`, `┏━━━┓╋╋╋╋╋╋╋╋╋╋╋╋╋┏┓┏━━┓╋╋╋┏┓`);
  console.log(`\u001b[32m`, `┃┏━┓┃╋╋╋╋╋╋╋╋╋╋╋╋┏┛┗┫┏┓┃╋╋┏┛┗┓`);
  console.log(`\u001b[32m`, `┃┗━━┳┓┏┳━━┳━━┳━━┳┻┓┏┫┗┛┗┳━┻┓┏┛`);
  console.log(`\u001b[32m`, `┗━━┓┃┃┃┃┏┓┃┏┓┃┏┓┃┏┫┃┃┏━┓┃┏┓┃┃`);
  console.log(`\u001b[32m`, `┃┗━┛┃┗┛┃┗┛┃┗┛┃┗┛┃┃┃┗┫┗━┛┃┗┛┃┗┓`);
  console.log(`\u001b[32m`, `┗━━━┻━━┫┏━┫┏━┻━━┻┛┗━┻━━━┻━━┻━┛`);
  console.log(`\u001b[32m`, `┗╋╋╋╋╋╋╋┃┃╋┃┃`);
  console.log(`\u001b[32m`, `╋╋╋╋╋╋╋┗┛╋┗┛`);
  console.log(`    `);
  console.log(`\u001b[31m`, `――――――――――――――――――――――――――――――――――――――――――――`);
  console.log(`    `);
  console.log(
    `\u001b[33m`,
    `${supportbot.Name} v${supportbot.SupportBot_Version}`,
    `\u001b[36m`,
    `Connected to Discord`
  );
  console.log(
    `\u001b[33m`,
    `Resources:`,
    `\u001b[36m`,
    `https://emeraldsrv.dev/resources`
  );
  console.log(
    `\u001b[33m`,
    `Documentation:`,
    `\u001b[36m`,
    `https://supportbot.emeraldsrv.dev`
  );
  console.log(
    `\u001b[33m`,
    `Discord:`,
    `\u001b[36m`,
    `https://emeraldsrv.dev/discord`
  );
  console.log(
    `\u001b[33m`,
    `Hosting:`,
    `\u001b[36m`,
    `https://emeraldsrv.dev/hosting`
  );
  console.log(`    `);
  console.log(`\u001b[37m`, `SupportBot proudly created by Emerald Services`);
  console.log(`    `);
  console.log(`\u001b[31m`, `――――――――――――――――――――――――――――――――――――――――――――`);
  if (
    !supportbot.Guild ||
    (await client.guilds.cache.size) !== 1 ||
    (await client.guilds.cache.first().id) !== supportbot.Guild
  ) {
    console.log(
      `\u001b[31m`,
      `${client.user.username} is not in the correct server set in your config. Please join the server and restart the bot.`
    );
    console.log(`\u001b[31m`, `${client.user.username} will now exit.`);
    return process.exit(1);
  }
  const roles = [
    supportbot.Admin,
    supportbot.Staff,
    supportbot.TicketBlackListRole,
    supportbot.DepartmentRole_1,
    supportbot.DepartmentRole_2,
    supportbot.DepartmentRole_3,
  ];
  if (supportbot.AutoRole) roles.push(supportbot.AutoRole_Role);
  const channels = [
    supportbot.SuggestionChannel,
    supportbot.TicketLog,
    supportbot.TranscriptLog,
    panelconfig.Channel,
  ];
  const categories = [supportbot.TicketCategory];

  const missingC = [];
  const missingR = [];
  const missingCat = [];
  for (let c of channels) {
    const find = await getChannel(c, client.guilds.cache.first());
    if (!find) missingC.push(c);
  }
  for (let r of roles) {
    const find = await getRole(r, client.guilds.cache.first());
    if (!find) missingR.push(r);
  }
  for (let cat of categories) {
    const find = await getCategory(cat, client.guilds.cache.first());
    if (!find) missingCat.push(cat);
  }

  if (missingR.length > 0) {
    console.log(
      "\u001b[33m",
      `[WARN] The following Roles could not be found! Please check your configs!\n${missingR.join(
        ", "
      )}`
    );
  }

  if (missingC.length > 0) {
    console.log(
      "\u001b[33m",
      `[WARN] The following Channels could not be found! Please check your configs!\n${missingC.join(
        ", "
      )}`
    );
  }
  if (missingCat.length > 0) {
    console.log(
      "\u001b[33m",
      `[WARN] The following Categories could not be found! Please check your configs!\n${missingCat.join(
        ", "
      )}`
    );
  }
  if (panelconfig.TicketPanel) {
    let chan1 = client.channels.cache.find(
      (channel) => channel.name === panelconfig.Channel
    );

    if (!chan1) {
      console.log(
        "\u001b[33m",
        "[WARN] Ticket reaction panel is not setup, You can do so via the configuration file!"
      );
      return false;
    }

    const panelid = JSON.parse(
      fs.readFileSync("./Data/ticket-panel-id.json", "utf8")
    );

    chan1.messages.fetch(panelid.TicketPanelID).catch(async (r) => {
      let embed = new Discord.MessageEmbed()
        .setTitle(`${panelconfig.PanelTitle}`)
        .setColor(supportbot.SuccessColour)
        .setFooter(supportbot.EmbedFooter);

      if (panelconfig.TicketPanel_Description) {
        embed.setDescription(panelconfig.PanelMessage);
      }

      if (panelconfig.TicketPanel_Thumbnail) {
        embed.setThumbnail(panelconfig.PanelThumbnail);
      }

      if (panelconfig.TicketPanel_Image) {
        embed.setImage(panelconfig.PanelImage);
      }

      let button = new Discord.MessageButton()
        .setLabel(panelconfig.ButtonLabel)
        .setCustomId("openticket")
        .setStyle(panelconfig.ButtonColour)
        .setEmoji(panelconfig.ButtonEmoji);

      let row = new Discord.MessageActionRow().addComponents(button);

      await chan1
        .send({
          embeds: [embed],
          components: [row],
        })
        .then((r) => {
          let data = {
            id: panelid.id,
            TicketPanelID: `${r.id}`,
          };
          fs.writeFileSync(
            "./Data/ticket-panel-id.json",
            JSON.stringify(data),
            "utf8"
          );
        })
        .catch((e) => {
          console.log("Raw" + e);
        });
    });
  }
});
