const Event = require('../structures/Event');

const config = require('../supportbot-config.js');
const moment = require('moment');

module.exports = class guildMemberRemove extends Event {
    constructor(client) {
        super(client, {
            name: 'guildMemberRemove'
        });
    }
    async exec(member, guild) {
        
    }
}
