const Discord = require("discord.js");
const bot = new Discord.Client()
const Sequelize = require('sequelize');

const fs = require("fs")
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));
