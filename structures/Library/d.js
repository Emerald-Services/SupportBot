const config = require('../../supportbot-config');

module.exports = (Discord) => {
    Discord.Embed = class extends Discord.MessageEmbed {
        constructor(footer, color, data) {
            super(data)
            this.setColor(color || config.EmbedColour)
            this.setFooter(footer || config.EmbedFooter)
        }
    }

}
