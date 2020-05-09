const Event = require('../structures/Event');

const config = require('../supportbot-config.js');
const moment = require('moment');

module.exports = class guildMemberAdd extends Event {
    constructor(client) {
        super(client, {
            name: 'guildMemberAdd'
        });
    }
    async exec(member, guild) {
        
    }
}
