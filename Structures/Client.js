const fs = require("fs");
const path = require("path");
const Discord = require("discord.js");
const { GatewayIntentBits, Partials } = require('discord.js');
const yaml = require("js-yaml");
const { Command, Event } = require('./Addon.js');

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));


function walk(dir, ext = ".js", fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = `${dir}/${file}`;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, ext, fileList);
    } else if (file.endsWith(ext)) {
      fileList.push(full);
    }
  }
  return fileList;
}

class Client extends Discord.Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ],
      partials: [Partials.Message, Partials.Channel]
    });

    this.commands = new Discord.Collection();
  }

  async getChannel(channel, guild) {
    if (!channel) return null;
    return guild.channels.cache.find(
      (c) =>
        (c.type === Discord.ChannelType.GuildText || c.type === Discord.ChannelType.GuildNews) &&
        (c.id === channel || (c.name && c.name.toLowerCase() === channel.toLowerCase()))
    );
  }

  async getRole(role, guild) {
    if (!role) return null;
    return guild.roles.cache.find(
      (r) => r.id === role || (r.name && r.name.toLowerCase() === role.toLowerCase())
    );
  }

  async getCategory(category, guild) {
    if (!category) return null;
    return guild.channels.cache.find(
      (c) =>
        c.type === Discord.ChannelType.GuildCategory &&
        (c.id === category || (c.name && c.name.toLowerCase() === category.toLowerCase()))
    );
  }

  async start(token) {
    let tempCommandFiles = walk("./Commands");

    if (cmdconfig.Suggestion.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "suggest.js");
    }

    if (cmdconfig.Suggestion.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "suggestadmin.js");
    }

    if (cmdconfig.Help.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "help.js");
    }

    if (cmdconfig.Info.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "info.js");
    }

    if (cmdconfig.OpenTicket.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "ticket.js");
    }

    if (cmdconfig.CloseTicket.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "close.js");
    }

    if (cmdconfig.Embed.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "embed.js");
    }

    if (cmdconfig.Translate.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "translate.js");
    }

    if (cmdconfig.UserInfo.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "userinfo.js");
    }

    if (cmdconfig.Ping.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "Ping.js");
    }

    if (cmdconfig.AddUser.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "addUser.js");
    }

    if (cmdconfig.RemoveUser.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "removeUser.js");
    }    

    if (cmdconfig.ForceAddUser.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "forceaddUser.js");
    }   

    if (cmdconfig.Profile.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "profile.js");
    }    

    if (cmdconfig.Settings.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "settings.js");
    }    

    if (cmdconfig.Mod.Enabled === false) {
      tempCommandFiles = tempCommandFiles.filter(item => path.basename(item) !== "mod.js");
    }    

    const commandFiles = tempCommandFiles;
    const commands = commandFiles.map((file) => require(`../${file}`));

    console.log(`\u001b[33m`, "――――――――――――――――――――――――――――――――――――――――――――");

    commands.forEach((cmd) => {
      console.log(`\u001b[32m`, `[CMD]`, `\u001b[37;1m`, `${cmd.name}`, `\u001b[32;1m`, "Loaded");
      this.commands.set(cmd.name, cmd);
    });

    console.log(`\u001b[33m`, "▬▬▬▬▬▬▬ Commands ▬▬▬▬▬▬▬");

    if (supportbot.General.Addons.Enabled) {
      const addonFiles = fs.readdirSync("./Addons").filter((file) => file.endsWith(".js"));

      const addons = addonFiles.map((file) => {
        const addon = require(`../Addons/${file}`);
        addon.name = file.split(".")[0];
        return addon;
      });

      console.log("   ");
      console.log(`\u001b[33m`, "▬▬▬▬▬▬▬ Addons ▬▬▬▬▬▬▬");

      addons.forEach((addon) => {
        console.log(
          `\u001b[32m`,
          `[ADDON]`,
          `\u001b[37;1m`,
          `${addon.name}`,
          `\u001b[32;1m`,
          "Loaded"
        );

        if (addon instanceof Command) {
          this.commands.set(addon.name, addon);
        }

        if (addon.events && Array.isArray(addon.events)) {
          addon.events.forEach((event) => {
            if (event instanceof Event) {
              this.on(event.event, (...args) => event.run(this, ...args));
            }
          });
        }
      });

      console.log(`\u001b[33m`, "▬▬▬▬▬▬▬ Addons ▬▬▬▬▬▬▬");
    }

    this.once("clientReady", async () => {
      await this.guilds.cache.first()?.commands.set(this.commands);
      console.log(
        "\u001b[32m",
        `[SUCCESS]`,
        `\u001b[37;1m`,
        `Slash Commands Registered for ${this.guilds.cache.first().name}`
      );
    });

    console.log("   ");
    console.log(`\u001b[33m`, "▬▬▬▬▬▬▬ Events ▬▬▬▬▬▬▬");

    fs.readdirSync("./Events").filter((file) => file.endsWith(".js")).forEach((file) => {
      const event = require(`../Events/${file}`);
      console.log(`\u001b[32m`, `[EVENT]`, `\u001b[37;1m`, `${event.event}`, `\u001b[32;1m`, "Loaded");
      this.on(event.event, (...args) => event.run(this, ...args));
    });

    console.log(`\u001b[33m`, "▬▬▬▬▬▬▬ Events ▬▬▬▬▬▬▬");
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
