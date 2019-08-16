const Discord = require("discord.js");
const bot = new Discord.Client()
bot.settings = require("../settings.json");

exports.run = async (bot, message, args) => {
    if (message.guild.owner === message.member) {
        message.delete(1000);

        const embed = new Discord.RichEmbed()
            .setTitle("SupportBot Setup Mode")
	    .setColor("#fff")
            .setDescription(`${bot.settings.botname} is about to enter **Setup Mode**.\nThis means that all the roles & channels that are\nrequired to allow supportbot to work will be created.`)
            .setFooter("Setup mode will expire in 60 seconds")
        message.channel.send(embed).then((msg) => {
            msg.react("✅");
            const filter = (reaction, user) => reaction.emoji.name === "✅" && user.id === message.author.id;
            msg.awaitReactions(filter, {
                max: 1,
                time: 60000,
                errors: ["time"]
            }).then(async (collected) => {
                msg.clearReactions();

        const embed1 = new Discord.RichEmbed()
            .setTitle("SupportBot Setup Mode")
	        .setColor("#fff")
            .setDescription(`${bot.settings.botname} has activated **Setup Mode**\nPlease allow a couple minutes for the process to be complete.`)
        msg.edit(embed1).then((m) => {
                    m.delete(5000);
                    m.edit(":white_check_mark: **Success!** You\'r server is ready, thanks for using SupportBot by Emerald Services.");
                });
                const reaction = collected.first();
                if (reaction.emoji.name === "✅") {
                    // Roles
                    let supportRole = bot.settings.support;
                    let staffRole = bot.settings.staff;
                    let autoRole = bot.settings.Auto_Role;
                    let Department_Role_1 = bot.settings.Department_Role_1
                    let Department_Role_2 = bot.settings.Department_Role_2
                    let Department_Role_3 = bot.settings.Department_Role_3


                    // Channels & Categories
                    let generalCategory = bot.settings.General_Category;
                    let informationCategory = bot.settings.InformationCategory;
                    let ticketCategory = bot.settings.category;
                    let staffCategory = bot.settings.StaffCategory;
                    let accessChannel = bot.settings.Access_Channel;
                    let announceChannel = bot.settings.Announcement_Channel;
                    let suggestChannel = bot.settings.Suggestion_Channel;
                    let reportsChannel = bot.settings.Report_Channel;
                    let ticketsChannel = bot.settings.Tickets_Channel;
                    let ticketsVoice1 = bot.settings.TicketsVoice1;
                    let ticketsVoice2 = bot.settings.TicketsVoice2;
                    let generalChannel = bot.settings.GeneralChannel;
                    let pollsChannel = bot.settings.Poll_Channel;
                    let botSpam = bot.settings.BotSpam_Channel;
                    let staffGeneral = bot.settings.StaffChat;
                    let staffCommands = bot.settings.StaffCmds;
                    let staffVoice = bot.settings.StaffVoice;
                    let ticketLogs = bot.settings.Ticket_Logs;
                    let commandLogs = bot.settings.Command_Log_Channel;

                    // Information Category
                    await message.guild.createChannel(`${informationCategory}`, {
                        type: "category",
                        position: 1
                    }).then(async (cat) => {
                        await message.guild.createChannel(`${accessChannel}`, {
                            type: "text",
                            position: 1,
                            topic: `${bot.settings.Access_Topic}`,
                            parent: cat
                        });
                        await message.guild.createChannel(`${announceChannel}`, {
                            type: "text",
                            position: 2,
                            topic: `${bot.settings.Announcement_Topic}`,
                            parent: cat
                        });
                        await message.guild.createChannel(`${pollsChannel}`, {
                            type: "text",
                            position: 3,
                            topic: `${bot.settings.Poll_Topic}`,
                            parent: cat
                        });
                        await message.guild.createChannel(`${suggestChannel}`, {
                            type: "text",
                            position: 4,
                            topic: `${bot.settings.Suggestion_Topic}`,
                            parent: cat
                        });
                        await message.guild.createChannel(`${reportsChannel}`, {
                            type: "text",
                            position: 5,
                            topic: `${bot.settings.Report_Topic}`,
                            parent: cat
                        });
                    });
                    // General Category
                    await message.guild.createChannel(`${generalCategory}`, {
                        type: "category",
                        position: 2
                    }).then(async (cat) => {
                        await message.guild.createChannel(`${generalChannel}`, {
                            type: "text",
                            position: 1,
                            topic: `${bot.settings.GeneralTopic}`,
                            parent: cat
                        });
                        await message.guild.createChannel(`${botSpam}`, {
                            type: "text",
                            position: 2,
                            topic: `${bot.settings.BotSpam_Topic}`,
                            parent: cat
                        });
                    });
                    // Support Category
                    await message.guild.createChannel(`${ticketCategory}`, {
                        type: "category",
                        position: 3
                    }).then(async (cat) => {
                        await message.guild.createChannel(`${ticketsChannel}`, {
                            type: "text",
                            position: 1,
                            topic: `${bot.settings.Tickets_Topic}`,
                            parent: cat
                        });
                        await message.guild.createChannel(`${ticketsVoice1}`, {
                            type: "voice",
                            position: 2,
                            parent: cat,
                            userLimit: 2,
                            speakable: true,
                            joineable: true
                        });
                        await message.guild.createChannel(`${ticketsVoice2}`, {
                            type: "voice",
                            position: 3,
                            parent: cat,
                            userLimit: 2,
                            speakable: true,
                            joineable: true
                        });
                    });
                    // Staff Category (Private)
                    await message.guild.createChannel(`${staffCategory}`, {
                        type: "category",
                        position: 4
                    }).then(async (cat) => {
                        await message.guild.createChannel(`${staffGeneral}`, {
                            type: "text",
                            position: 1,
                            parent: cat
                        });
                        await message.guild.createChannel(`${staffCommands}`, {
                            type: "text",
                            position: 2,
                            parent: cat
                        });
                        await message.guild.createChannel(`${staffVoice}`, {
                            type: "voice",
                            position: 3,
                            parent: cat,
                            joineable: true,
                            speakable: true
                        });
                        await message.guild.createChannel(`${ticketLogs}`, {
                            type: "text",
                            position: 4,
                            parent: cat
                        });
                        await message.guild.createChannel(`${commandLogs}`, {
                            type: "text",
                            position: 5,
                            parent: cat
                        });
                        
                        await message.guild.createRole({
                            name: `${staffRole}`,
                            color: "#ff0000",
                            position: 1,
                            permissions: {
                                "MANAGE_CHANNELS": true,
                                "MANAGE_GUILD": true,
                                "MENTION_EVERYONE": true,
                                "CREATE_INSTANT_INVITE": true,
                                "KICK_MEMBERS": true,
                                "VIEW_AUDIT_LOG": true,
                                "MANAGE_NICKNAMES": true,
                                "CONNECT": true,
                                "SPEAK": true,
                                "USE_EXTERNAL_EMOJIS": true,
                                "MANAGE_MESSAGES": true,
                                "PRIORITY_SPEAKER": true
                            },
                            mentionable: true
                        });
                        await message.guild.createRole({
                            name: `${autoRole}`,
                            color: "#ffffff",
                            position: 2,
                            permissions: {
                                "MANAGE_CHANNELS": false,
                                "MANAGE_GUILD": false,
                                "MENTION_EVERYONE": false,
                                "CREATE_INSTANT_INVITE": true,
                                "KICK_MEMBERS": false,
                                "VIEW_AUDIT_LOG": false,
                                "MANAGE_NICKNAMES": false,
                                "CONNECT": true,
                                "SPEAK": true,
                                "USE_EXTERNAL_EMOJIS": true,
                                "MANAGE_MESSAGES": false,
                                "PRIORITY_SPEAKER": false
                            },
                            mentionable: false
                        });
                        await message.guild.createRole({
                            name: `${Department_Role_1}`,
                            color: "#ffffff",
                            position: 2,
                            permissions: {
                                "MANAGE_CHANNELS": false,
                                "MANAGE_GUILD": false,
                                "MENTION_EVERYONE": false,
                                "CREATE_INSTANT_INVITE": true,
                                "KICK_MEMBERS": true,
                                "VIEW_AUDIT_LOG": true,
                                "MANAGE_NICKNAMES": true,
                                "CONNECT": true,
                                "SPEAK": true,
                                "USE_EXTERNAL_EMOJIS": true,
                                "MANAGE_MESSAGES": true,
                                "PRIORITY_SPEAKER": true
                            },
                            mentionable: false
                        });
                        await message.guild.createRole({
                            name: `${Department_Role_2}`,
                            color: "#ffffff",
                            position: 2,
                            permissions: {
                                "MANAGE_CHANNELS": false,
                                "MANAGE_GUILD": false,
                                "MENTION_EVERYONE": false,
                                "CREATE_INSTANT_INVITE": true,
                                "KICK_MEMBERS": true,
                                "VIEW_AUDIT_LOG": true,
                                "MANAGE_NICKNAMES": true,
                                "CONNECT": true,
                                "SPEAK": true,
                                "USE_EXTERNAL_EMOJIS": true,
                                "MANAGE_MESSAGES": true,
                                "PRIORITY_SPEAKER": true
                            },
                            mentionable: false
                        });
                        await message.guild.createRole({
                            name: `${Department_Role_3}`,
                            color: "#ffffff",
                            position: 2,
                            permissions: {
                                "MANAGE_CHANNELS": false,
                                "MANAGE_GUILD": false,
                                "MENTION_EVERYONE": false,
                                "CREATE_INSTANT_INVITE": true,
                                "KICK_MEMBERS": true,
                                "VIEW_AUDIT_LOG": true,
                                "MANAGE_NICKNAMES": true,
                                "CONNECT": true,
                                "SPEAK": true,
                                "USE_EXTERNAL_EMOJIS": true,
                                "MANAGE_MESSAGES": true,
                                "PRIORITY_SPEAKER": true
                            },
                            mentionable: false
                        });
                    });
                } else {
                    return;
                }
            });
        });
    } else {
        message.channel.send(":x: **Error:** You don't have permissions to use this command.").then((msg) => {
            msg.delete(5000);
        });
    }
}

exports.help = {
    name: bot.settings.Setup_Command
}