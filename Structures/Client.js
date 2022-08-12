// SupportBot | Emerald Services
// Client Structure

const fs = require("fs");

const Discord = require("discord.js");
const { GatewayIntentBits, Partials } = require('discord.js');

const yaml = require("js-yaml");

const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);

const cmdconfig = yaml.load(
  fs.readFileSync("./Configs/commands.yml", "utf8")
);

class Client extends Discord.Client {
  constructor() {
    super({ intents: [GatewayIntentBits.Guilds], partials: [Partials.Channel] });

    this.commands = new Discord.Collection();
  }
  async getChannel(channel, guild) {
    return guild.channels.cache.find(
      (c) =>
        (c.type === Discord.ChannelType.GuildText || c.type === Discord.ChannelType.GuildNews) &&
        (c.id === channel || c.name.toLowerCase() === channel.toLowerCase())
    );
  }
  async getRole(role, guild) {
    return guild.roles.cache.find(
      (r) => r.id === role || r.name.toLowerCase() === role.toLowerCase()
    );
  }
  async getCategory(category, guild) {
    return guild.channels.cache.find(
      (c) =>
        c.type === Discord.ChannelType.GuildCategory &&
        (c.id === category || c.name.toLowerCase() === category.toLowerCase())
    );
  }

  async start(token) {
    var tempCommandFiles = fs.readdirSync("./Commands").filter((file) => file.endsWith(".js"));

    if (cmdconfig.Suggestion.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => item !== "suggest.js");
    }

    if (cmdconfig.Help.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => item !== "help.js");
    }

    if (cmdconfig.Info.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => item !== "info.js");
    }

    if (cmdconfig.TicketAdd.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => item !== "add.js");
    }

    if (cmdconfig.TicketRemove.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => item !== "remove.js");
    }

    if (cmdconfig.OpenTicket.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => item !== "ticket.js");
    }

    if (cmdconfig.CloseTicket.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => item !== "close.js");
    }

    if (cmdconfig.Embed.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => item !== "embed.js");
    }

    if (cmdconfig.Translate.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => item !== "translate.js");
    }

    if (cmdconfig.UserInfo.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => item !== "userinfo.js");
    }

    if (cmdconfig.Ping.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => item !== "Ping.js");
    }

    const commandFiles = tempCommandFiles;

    const commands = commandFiles.map((file) => require(`../Commands/${file}`));

    // Commands
    console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Commands ▬▬▬▬▬▬▬");

    commands.forEach((cmd) => {
      console.log(`\u001b[32m`, `[CMD]`, `\u001b[37;1m`, `${cmd.name}`, `\u001b[32;1m`, "Loaded");
      this.commands.set(cmd.name, cmd);
    });

    console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Commands ▬▬▬▬▬▬▬");

    if (supportbot.General.Addons.Enabled) {
      const addonFiles = fs
        .readdirSync("./Addons")
        .filter((file) => file.endsWith(".js"));

      const addons = addonFiles.map((file) => {
        let addon = require(`../Addons/${file}`);
        addon.name = file.split(".")[0];
        return addon;
      });

      // Addons
      console.log("   ");
      console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Addons ▬▬▬▬▬▬▬");

      addons.forEach((addon) => {
        console.log(
          `\u001b[32m`,
          `[ADDON]`,
          `\u001b[37;1m`,
          `${addon.name}`,
          `\u001b[32;1m`,
          "Loaded"
        );
      addon.commands?.forEach((command) => {
        this.commands.set(command.name, command);
      });
      addon.events?.forEach((event) => {
        this.on(event.event, (...args) => event.run(this, ...args));
      });
    });

    console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Addons ▬▬▬▬▬▬▬");

    } 

    // Slash Commands

    this.once("ready", async () => {
      await this.guilds.cache.first()?.commands.set(this.commands);
      console.log(
        "\u001b[32m",
        `[SUCCESS]`,
        `\u001b[37;1m`,
        `Slash Commands Registered for ${this.guilds.cache.first().name}`
      );
    });

    console.log("   ");
    console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Events ▬▬▬▬▬▬▬");

    fs.readdirSync("./Events")
      .filter((file) => file.endsWith(".js"))
      .forEach((file) => {
        const event = require(`../Events/${file}`);
        console.log(`\u001b[32m`, `[EVENT]`, `\u001b[37;1m`, `${event.event}`, `\u001b[32;1m`, "Loaded");
        this.on(event.event, (...args) => event.run(this, ...args));
      });

    console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Events ▬▬▬▬▬▬▬");
    if (process.argv[2] !== "test") {
      await this.login(token);
    } else {
      console.log(
        `\u001b[31;1m`,
        "RUNNING IN TEST MODE, IF NOT INTENDED, PLEASE USE npm start"
      );
    }
  }
}

module.exports = Client;
