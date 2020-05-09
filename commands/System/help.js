const Command = require('../../structures/Command');
const { MessageEmbed } = require('discord.js');

module.exports = class Help extends Command {
    constructor(client) {
        super(client, {
            name: 'help',
            aliases: ['h', '?'],
            description: `Get a list of commands that I offer!`,
            usage: '[Command?]'
        });
    }

    async exec(message, args) {
       const help = new MessageEmbed()
       .setAuthor(`Prefix = \`${message.guild.settings.prefix}\``)
    }
}