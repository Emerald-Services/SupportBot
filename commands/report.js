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

    let staffGroup = message.guild.roles.cache.find(staffRole => staffRole.name === `${supportbot.StaffRole}`);

    if(!staffGroup) {
        message.reply(rolemissing).catch(err => {
          console.error(err);
        });
    } else {
    const rolerequired = new Discord.MessageEmbed()
        .setTitle("SupportBot Error!")
        .setDescription(`:x: **Error!** Incorrect Permissions, You cannot execute this command as you do not have the required role.\n\nRole Required: \`${supportbot.StaffRole}\`\n\nError Code: \`SB-02\``)
        .setColor(supportbot.ErrorColour)

    if (!message.member.roles.cache.has(staffGroup.id)) return message.reply({embed: rolerequired});
        if(!message.member.roles.cache.has(staffGroup.id)) {
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
                    let locateChannel = message.guild.channels.cache.find(LocateChannel => LocateChannel.name === `${supportbot.Report_Channel}`)
                    if(!locateChannel) {
                        const errornochannel = new Discord.MessageEmbed()
                            .setTitle("SupportBot Error!")
                            .setDescription(`:x: **Error!** Channel not Found, This command cannot be executed proberbly as their is no channel within this server.\nThis is configurable via **supportbot-config.yml**\n\nChannel Required: \`${supportbot.Report_Channel}\`\n\nError Code: \`SB-03\``)
                            .setColor(supportbot.ErrorColour);
                        if(!locateChannel) return message.channel.send(errornochannel);        

                    } else {
                        locateChannel.send(embed);

                    }
                }
            }
        }
    }
};

exports.help = {
    name: supportbot.Report_Command
}
