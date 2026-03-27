const fs = require("fs");
const path = require("path");
const Discord = require("discord.js");
const { GatewayIntentBits, Partials } = require("discord.js");
const yaml = require("js-yaml");
const { Command, Event } = require("./Addon.js");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const c = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  white: "\x1b[37m",
  bold: "\x1b[1m",
};

function line() {
  console.log(`${c.gray}────────────────────────────────────────────────────────${c.reset}`);
}

function section(title) {
  console.log(`\n${c.green}${title}${c.reset}`);
  console.log(`${c.gray}${"-".repeat(title.length)}${c.reset}`);
}

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
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    });

    this.commands = new Discord.Collection();
  }

  async getChannel(channel, guild) {
    if (!channel) return null;
    return guild.channels.cache.find(
      (c) =>
        (c.type === Discord.ChannelType.GuildText || c.type === Discord.ChannelType.GuildNews) &&
        (c.id === channel || (c.name && c.name.toLowerCase() === channel.toLowerCase())),
    );
  }

  async getRole(role, guild) {
    if (!role) return null;
    return guild.roles.cache.find(
      (r) => r.id === role || (r.name && r.name.toLowerCase() === role.toLowerCase()),
    );
  }

  async getCategory(category, guild) {
    if (!category) return null;
    return guild.channels.cache.find(
      (c) =>
        c.type === Discord.ChannelType.GuildCategory &&
        (c.id === category || (c.name && c.name.toLowerCase() === category.toLowerCase())),
    );
  }

  async start(token) {
    const commandFiles = walk("./Commands");

    const allCommands = commandFiles.map((file) => ({
      file,
      command: require(`../${file}`),
    }));

    const enabledCommands = allCommands.filter(({ command }) => {
      const matchingConfig = Object.values(cmdconfig).find(
        (entry) =>
          entry &&
          typeof entry === "object" &&
          entry.Command &&
          String(entry.Command).toLowerCase() === String(command.name).toLowerCase(),
      );

      if (!matchingConfig) {
        return true;
      }

      return matchingConfig.Enabled !== false;
    });

    section("Commands");

    enabledCommands.forEach(({ command, file }) => {
      console.log(
        `${c.green}✓${c.reset} ${c.white}${command.name}${c.reset} ${c.gray}(${path.basename(file)})${c.reset}`,
      );
      this.commands.set(command.name, command);
    });

    if (supportbot.General.Addons.Enabled) {
      const addonFiles = fs.readdirSync("./Addons").filter((file) => file.endsWith(".js"));

      const addons = addonFiles.map((file) => {
        const addon = require(`../Addons/${file}`);
        addon.name = file.split(".")[0];
        return addon;
      });

      section("Addons");

      addons.forEach((addon) => {
        console.log(`${c.green}✓${c.reset} ${c.white}${addon.name}${c.reset}`);

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
    }

    this.once("clientReady", async () => {
      await this.guilds.cache.first()?.commands.set(this.commands);

      console.log(
        `\n${c.green}✓${c.reset} ${c.white}Slash Commands Registered${c.reset} ${c.gray}for ${this.guilds.cache.first().name}${c.reset}`,
      );
    });

    section("Events");

    fs.readdirSync("./Events")
      .filter((file) => file.endsWith(".js"))
      .forEach((file) => {
        const event = require(`../Events/${file}`);
        console.log(
          `${c.green}✓${c.reset} ${c.white}${event.event}${c.reset} ${c.gray}(${file})${c.reset}`,
        );
        this.on(event.event, (...args) => event.run(this, ...args));
      });

    console.log("");

    if (process.argv[2] !== "test") {
      await this.login(token);
    } else {
      console.log(`${c.red}RUNNING IN TEST MODE, IF NOT INTENDED, PLEASE USE npm start${c.reset}`);
    }
  }
}

module.exports = Client;
