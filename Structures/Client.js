// SupportBot | Emerald Services
// Client Structure

const fs = require("fs");

const Discord = require("discord.js");
const intents = new Discord.Intents(32767);

const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);

class Client extends Discord.Client {
  constructor() {
    super({ intents });

    this.commands = new Discord.Collection();
  }
  async getChannel(channel, guild) {
    return guild.channels.cache.find(
      (c) =>
        (c.type === "GUILD_TEXT" || c.type === "GUILD_NEWS") &&
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
        c.type === "GUILD_CATEGORY" &&
        (c.id === category || c.name.toLowerCase() === category.toLowerCase())
    );
  }

  async start(token) {
    const commandFiles = fs
      .readdirSync("./Commands")
      .filter((file) => file.endsWith(".js"));

    const addonFiles = fs
      .readdirSync("./Addons")
      .filter((file) => file.endsWith(".js"));

    const addons = addonFiles.map((file) => {
      let addon = require(`../Addons/${file}`);
      addon.name = file.split(".")[0];
      return addon;
    });

    const commands = commandFiles.map((file) => require(`../Commands/${file}`));

    // Commands
    console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Commands ▬▬▬▬▬▬▬");

    commands.forEach((cmd) => {
      console.log(`\u001b[31;1m`, `${cmd.name}`, `\u001b[32;1m`, "Loaded");
      this.commands.set(cmd.name, cmd);
    });

    console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Commands ▬▬▬▬▬▬▬");
    // Addons
    console.log("   ");
    console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Addons ▬▬▬▬▬▬▬");

    addons.forEach((addon) => {
      console.log(
        `\u001b[33m`,
        `[ADDON]`,
        `\u001b[31;1m`,
        `${addon.name}`,
        `\u001b[32;1m`,
        "Loaded"
      );
      addon.commands.forEach((command) => {
        this.commands.set(command.name, command);
      });
      addon.events.forEach((event) => {
        this.on(event.event, (...args) => event.run(this, ...args));
      });
    });

    console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Addons ▬▬▬▬▬▬▬");

    // Slash Commands

    this.once("ready", async () => {
      await this.guilds.cache.first()?.commands.set(this.commands);
      console.log(
        `\u001b[32;1m`,
        `Slash Commands Registered for ${this.guilds.cache.first().name}`
      );
    });

    console.log("   ");
    console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Events ▬▬▬▬▬▬▬");

    fs.readdirSync("./Events")
      .filter((file) => file.endsWith(".js"))
      .forEach((file) => {
        const event = require(`../Events/${file}`);
        console.log(`\u001b[31;1m`, `${event.event}`, `\u001b[32;1m`, "Loaded");
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
