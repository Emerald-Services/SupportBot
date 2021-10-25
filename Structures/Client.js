// SupportBot | Emerald Services
// Client Structure

const fs = require("fs");

const Discord = require("discord.js");
const Command = require("./Command.js");
const Event = require("./Event.js");
const intents = new Discord.Intents(32767);

const yaml = require("js-yaml");
const supportbot = yaml.load(fs.readFileSync("./Data/supportbot.yml", "utf8"));

class Client extends Discord.Client {
  constructor() {
    super({ intents });

    this.commands = new Discord.Collection();
  }

  start(token) {
    const commandFiles = fs
      .readdirSync("./Commands")
      .filter((file) => file.endsWith(".js"));

    const addonFiles = fs
      .readdirSync("./Addons")
      .filter((file) => file.endsWith(".js"));

    const addons = addonFiles.map((file) => require(`../Addons/${file}`));

    const commands = commandFiles.map((file) => require(`../Commands/${file}`));

    console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Commands ▬▬▬▬▬▬▬");

    commands.forEach((cmd) => {
      console.log(`\u001b[31;1m`, `${cmd.name}`, `\u001b[32;1m`, "Loaded");
      this.commands.set(cmd.name, cmd);
    });

    addons.forEach((addon) => {
      console.log(
        `\u001b[33m`,
        `[ADDON]`,
        `\u001b[31;1m`,
        `${addon.name}`,
        `\u001b[32;1m`,
        "Loaded"
      );
      this.commands.set(addon.name, addon);
    });

    console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Commands ▬▬▬▬▬▬▬");

    // Slash Commands

    const slashCommands = commands.map((cmd) => ({
      name: cmd.name.toLowerCase(),
      description: cmd.description,
      permissions: [],
      options: cmd.slashCommandOptions,
      defaultPermission: true,
    }));

    const slashCommands1 = addons.map((addon) => ({
      name: addon.name.toLowerCase(),
      description: addon.description,
      permissions: [],
      options: addon.slashCommandOptions,
      defaultPermission: true,
    }));

    this.removeAllListeners();

    this.on("ready", async () => {
      const allCommands = slashCommands.concat(slashCommands1);
      await this.application?.commands.set(allCommands);

      console.log("   ");
      console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Slash Command ▬▬▬▬▬▬▬"),
        console.log("   ");

      slashCommands.forEach((cmd) =>
        console.log(
          `\u001b[31;1m`,
          `${cmd.name}`,
          `\u001b[32;1m`,
          `| Slash Command Registered`
        )
      );

      slashCommands1.forEach((addon) =>
        console.log(
          `\u001b[33m`,
          `[ADDON]`,
          `\u001b[31;1m`,
          `${addon.name}`,
          `\u001b[32;1m`,
          `| Slash Command Registered`
        )
      );
    });

    console.log("   ");
    console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Events ▬▬▬▬▬▬▬");

    fs.readdirSync("./Events")
      .filter((file) => file.endsWith(".js"))
      .forEach((file) => {
        const event = require(`../Events/${file}`);
        console.log(`\u001b[31;1m`, `${event.event}`, `\u001b[32;1m`, "Loaded");

        this.on(event.event, event.run.bind(null, this));
      });

    console.log(`\u001b[34;1m`, "▬▬▬▬▬▬▬ Events ▬▬▬▬▬▬▬");
    console.log("   ");

    this.login(token);
  }
}

module.exports = Client;
