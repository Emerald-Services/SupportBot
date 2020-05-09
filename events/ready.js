const Event = require('../structures/Event');

const config = require('../supportbot-config.js');
const moment = require('moment');

module.exports = class Ready extends Event {
    constructor(client) {
        super(client, {
            name: 'ready'
        });
    }
    async exec(message) {
        this.client.logger.info(`started as ${this.client.user.username} at ${moment(this.client.readyAt).format('LLL')}`)
        this.client.user.setActivity(config.BotActivity, { type: config.ActivityType })
    }
}
