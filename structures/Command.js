class Command {
    constructor(client, options = {
        name: null,
        aliases: [],
        description: null,
        usage: null,
        category: 'system',
        }) {
        this.client = client;
        this.name = options.name || null;
        this.aliases = options.aliases || []
        this.description = options.description || null;
        this.usage = options.usage ? `${this.name} ${options.usage}` : this.name;
        this.category = options.category || 'system';
        }
}

module.exports = Command;