const { Structures } = require('discord.js');
const fs = require('fs');

class Extends {
    constructor(client) {
        for (const struct of fs.readdirSync('src/structures/extensions')) Structures.extend(struct.slice(0, -3), require('./extensions/' + struct));
    }
}

module.exports = Extends;