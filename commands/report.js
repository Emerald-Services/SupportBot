// SupportBot
// Created by © 2020 Emerald Services
// Command: Report

const Discord = require("discord.js");
const bot = new Discord.Client();

const fs = require("fs");
const yaml = require('js-yaml');

const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

exports.run = (bot, message, args) => {

    console.log(`\u001b[33m`, `[${supportbot.Bot_Name}] > `, `\u001b[31;1m`, `${message.author.tag}`, `\u001b[32;1m`, `has executed`, `\u001b[31;1m`, `${supportbot.Prefix}${supportbot.Report_Command}`);

    let staffGroup = message.guild.roles.find(staffRole => staffRole.name === `${supportbot.StaffRole}`);

    const rolemissing = new Discord.MessageEmbed()
        .setDescription(`:x: Looks like this server doesn't have the role **${supportbot.StaffRole}**`)
        .setColor(supportbot.EmbedColour);

    if(!staffGroup) {
        message.reply(rolemissing).catch(err => {
          console.error(err);
        });
    } else {
        const donothaverole = new Discord.MessageEmbed()
            .setDescription(`:x: Sorry! You cannot use this command with the role **${supportbot.StaffRole}**`)
            .setColor(supportbot.EmbedColour)
        if(!message.member.roles.has(staffGroup.id)) {
            message.reply(donothaverole);
        } else {
            if(!args[0]) {
                message.reply(":x: Sorry! Please specify the user to report.");
            } else {
                if(!args[1]) {
                    message.reply(":x: Sorry! Specify the reason of your report.");
                } else {
                  let reportDesc = args.slice(1).join(" ");
                    const embed = new Discord.MessageEmbed()
                        .setTitle(`${supportbot.Report_Title}`)
                        .setThumbnail(message.author.avatarURL)
                        .addField("Report by:", `<@${message.author.id}>`, false)
                        .addField("Description:", `${reportDesc}`, false)
                        .addField("Reported User:", `${args[0]}`, false)
                        .setTimestamp(new Date())
                        .setColor(supportbot.EmbedColour)
                        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.displayAvatarURL);
                    let rc = message.guild.channels.find(ReportChannel => ReportChannel.name === `${supportbot.Report_Channel}`)
                    if(!rc) {
                        message.channel.send(`:x: Error! Could not find the logs channel **${supportbot.Report_Channel}**`);
                    } else {
                        rc.send(embed);

                    }
                }
            }
        }
    }
};

exports.help = {
    name: supportbot.Report_Command
}
