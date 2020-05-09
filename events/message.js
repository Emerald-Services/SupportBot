const Event = require('../structures/Event');

module.exports = class Message extends Event {
    constructor(client) {
        super(client, {
            name: 'message'
        });
    }
    async exec(message) {
        if (message.author.bot || !message.guild) return;
        const guild = await message.guild.settings();
        const { content, flags } = this.client.util.parseFlags(message.content);
        message.content = content;
        message.flags = flags;
        if (!message.content.toLowerCase().startsWith(guild.prefix)) return;
        const args = message.content.slice(guild.prefix.length).split(/ +/);
        const command = args.shift().toLowerCase();
        const cmd = this.client.handler.commands.get(command) || this.client.handler.commands.get(this.client.handler.aliases.get(command));
        if (!cmd) return;
        try {
            this.client.logger.info(`command "${cmd.name}" executed in ${message.guild.id}`)
            return cmd.exec(message, args);
        } catch (e) {
            this.client.logger.error(`sentry exception captured from "${cmd.name}": ${e}`);
            return message.channel.send(`Boo! Something went wrong when running that command!`)
        }
    }
}