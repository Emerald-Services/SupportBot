const Handler = require('./Handler');
const Util = require('./Util');
const winston = require('winston');
const Discord = require('discord.js')
const config = require('../supportbot-config.js');
class SupportClient extends Discord.Client {
    constructor(token, options) {
        super(options);
        this.token = token;
        this.config = config;
        this.color = config.EmbedColour;
        require("./Library/d.js")(Discord)
        this.handler = new Handler(this);
        this.util = new Util(this);
        this.db = require("../database/database").default
        this.handler.loadCommands();
        this.handler.loadEvents();
        const colorizer = winston.format.colorize();
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.simple(),
                winston.format.printf(msg =>
                    colorizer.colorize(msg.level, `${msg.timestamp} - ${msg.level}: ${msg.message}`)
                )
            ),
            transports: [
                new winston.transports.Console(),
            ]
        });
    }
}

module.exports = SupportClient;
