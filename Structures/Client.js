// SupportBot | Emerald Services
// Client Structure

const fs = require("fs");

const Discord = require("discord.js");
const Command = require("./Command.js");
const Event = require("./Event.js");
const intents = new Discord.Intents(32767);

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./Data/supportbot.yml', 'utf8'));

class Client extends Discord.Client {
	constructor() {
		super({ intents });

		this.commands = new Discord.Collection();

		this.prefix = supportbot.Prefix;
	}

	start(token) {
		const commandFiles = fs.readdirSync("./Commands")
			.filter(file => file.endsWith(".js"));

		const commands = commandFiles.map(file => require(`../Commands/${file}`));

		commands.forEach(cmd => {
			console.log(`Command ${cmd.name} loaded`);
			this.commands.set(cmd.name, cmd);
		});

		const slashCommands = commands
			.filter(cmd => ["BOTH", "SLASH"].includes(cmd.type))
			.map(cmd => ({
				name: cmd.name.toLowerCase(),
				description: cmd.description,
				permissions: [],
				options: cmd.slashCommandOptions,
				defaultPermission: true
			}));

		this.removeAllListeners();

		this.on("ready", async () => {
			const cmds = await this.application.commands.set(slashCommands);

			cmds.forEach(cmd => console.log(`Slash Command ${cmd.name} registered`));
		})

		fs.readdirSync("./Events")
			.filter(file => file.endsWith(".js"))
			.forEach(file => {
				/**
				 * @type {Event}
				 */
				const event = require(`../Events/${file}`);
				console.log(`Event ${event.event} loaded`);
				this.on(event.event, event.run.bind(null, this));
			});

		this.login(token);
	}
}

module.exports = Client;