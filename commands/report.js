// SupportBot
// Command: Report

const Discord = require("discord.js");
const bot = new Discord.Client()

bot.settings = require("../settings.json");

exports.run = (bot, message, args) => {
    message.delete();

    let staffGroup = message.guild.roles.find(staffRole => staffRole.name === `${bot.settings.staff}`);

    const rolemissing = new Discord.RichEmbed()
        .setDescription(`:x: Looks like this server doesn't have the role **${bot.settings.staff}**`)
        .setColor(bot.settings.colour);

    if(!staffGroup) {
        message.reply(rolemissing).catch(err => {
          console.error(err);
        });
    } else {
        const donothaverole = new Discord.RichEmbed()
            .setDescription(`:x: Sorry! You cannot use this command with the role **${bot.settings.staff}**`)
            .setColor(bot.settings.colour)
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
                    const embed = new Discord.RichEmbed()
                        .setTitle(`${bot.settings.Report_Title}`)
                        .setThumbnail(message.author.avatarURL)
                        .addField("Report by:", `<@${message.author.id}>`, false)
                        .addField("Description:", `${reportDesc}`, false)
                        .addField("Reported User:", `${args[0]}`, false)
                        .setTimestamp(new Date())
                        .setColor(bot.settings.colour)
                        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.displayAvatarURL);
                    let rc = message.guild.channels.find(ReportChannel => ReportChannel.name === `${bot.settings.Report_Channel}`)
                    if(!rc) {
                        message.channel.send(`:x: Error! Could not find the logs channel **${bot.settings.Report_Channel}**`);
                    } else {
                        rc.send(embed);
                        console.log(`\x1b[36m`, `${message.author} has executed ${bot.settings.prefix}${bot.settings.Report_Command}`);

                         const CMDLog = new Discord.RichEmbed()
                            .setTitle(bot.settings.Commands_Log_Title)
                            .addField(`User`, `<@${message.author.id}>`)
                            .addField(`Command`, bot.settings.Report_Command, true)
                            .addField(`Channel`, message.channel, true)
                            .addField(`Executed At`, message.createdAt, true)
                            .setColor(bot.settings.colour)
                            .setFooter(bot.settings.footer)

                        let CommandLog = message.guild.channels.find(LogsChannel => LogsChannel.name === `${bot.settings.Command_Log_Channel}`);
                        if(!CommandLog) return message.channel.send(`:x: Error! Could not find the logs channel. **${bot.settings.Command_Log_Channel}**\nThis can be changed via ``settings.json```);
    
                        CommandLog.send(CMDLog);

                    }
                }
            }
        }
    }
}

exports.help = {
    name: bot.settings.Report_Command
}
