const { readdirSync, statSync } = require('fs');
const { join, sep } = require('path');
const { Collection } = require('discord.js');
const Command = require('./Command');

class Handler {
    constructor(client) {
        this.client = client;
        this.aliases = new Collection();
        this.commands = new Collection();
        this.events = new Collection();
    }

    readdir(directory) {
        if (!directory) throw new Error('No diretory provided.')
        const result = [];
        (function read(dir) {
            const files = readdirSync(dir);
            for (const file of files) {
                const filepath = join(dir, file);
                if (statSync(filepath).isDirectory()) {
                    read(filepath);
                } else {
                    result.push(`${process.cwd()}${sep}${filepath}`);
                }
            }
        }(directory));
        return result;
    }

    loadCommands() {
        const files = this.readdir('../commands');
        for (const file of files) {
            delete require.cache[require.resolve(file)];
            if (file.endsWith('.js')) {
                try {
                    const command = new (require(file))(this.client);
                    for (const alias of command.aliases) {
                        this.aliases.set(alias, command.name)
                    }
                    this.commands.set(command.name, command);
                } catch (e) {
                    throw new Error(e);
                }
            }
        }
    }
    loadEvents() {
        const files = this.readdir('../events');
        for (const file of files) {
            delete require.cache[require.resolve(file)];
            if (file.endsWith('.js')) {
                try {
                    const event = new (require(file))(this.client);
                    this.client.on(event.name, (...args) => {
                        event.exec(...args);
                    });
                    this.events.set(event.name, event);
                } catch (e) {
                    throw new Error(e);
                }
            }
        }
    }
}

module.exports = Handler;