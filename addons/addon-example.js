// SupportBot 6.0, Created by Emerald Services
// Help Command

const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');

// location for the addons configuration, to keep it simple we generate a settings folder within the addons directory.
const example = yaml.load(fs.readFileSync('./addons/settings/exampleaddon.yml', 'utf8'));

module.exports = {
    name: example.ExampleAddonCommand,
    description: example.ExampleAddonDesc,

    execute(message, args) {
        message.channel.send(example.ExampleAddonMessage)
    }
};