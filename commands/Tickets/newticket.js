const Command = require('../../structures/Command');
const { MessageEmbed } = require('discord.js');
const Ticket = require('../../models/ticket');
module.exports = class New extends Command {
    constructor(client) {
        super(client, {
            name: 'config.Ticket_Command',
            description: `Open a ticket`,
            usage: 'new [reason]'
        });
    }

    async exec(message, args) {
       
    }
}
