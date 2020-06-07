const Discord = require("discord.js");
const bot = new Discord.Client()
const Sequelize = require('sequelize');

const fs = require("fs")
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

module.exports = {
    name: supportbot.NewTicket,

    execute(message, args) {
      const author = sequelize.define('TicketAuthor', {
        name: {
          type: Sequelize.STRING,
          unique: true,
        },
        
        description: Sequelize.TEXT,
	      username: Sequelize.STRING,
	      usage_count: {
          type: Sequelize.INTEGER,
		      defaultValue: 0,
		      allowNull: false,
        }
    });
  }
};
