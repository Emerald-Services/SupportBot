//  ____                               _   ____        _   
// / ___| _   _ _ __  _ __   ___  _ __| |_| __ )  ___ | |_ 
// \___ \| | | | '_ \| '_ \ / _ \| '__| __|  _ \ / _ \| __|
//  ___) | |_| | |_) | |_) | (_) | |  | |_| |_) | (_) | |_ 
// |____/ \__,_| .__/| .__/ \___/|_|   \__|____/ \___/ \__|
//             |_|   |_|                                   
//              © 2020 Created by Emerald Services
//              Licnese: MIT
//              SupportBot v5.2

const Discord = require("discord.js");
const fs = require("fs");
const bot = new Discord.Client();

bot.commands = new Discord.Collection();

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

fs.readdir("./commands/", (err, files) => {
    if(err) console.log(err);
  
    let jsfile = files.filter(f => f.split(".").pop() === "js")
    if(jsfile.length <= 0) return console.log(`${supportbot.Bot_Name} No commands found. Try to Re-download the resource`);
  
    jsfile.forEach((f, i) =>{
      let props = require(`./commands/${f}`);
      console.log(`[${supportbot.Bot_Name}] > Command Loaded > ${f}`);
      bot.commands.set(props.help.name, props);
    });
  
  });

bot.addons = new Discord.Collection();  

fs.readdir("./sb-addons/", (err, files) => {
    if(err) console.log(err);
  
    let jsfile = files.filter(f => f.split(".").pop() === "js")
    if(jsfile.length <= 0) return console.log(`${supportbot.Bot_Name} No addons detected nor default! Either download addons from https://emeraldservices.xyz/`);
  
    jsfile.forEach((f, i) =>{
      let props = require(`./sb-addons/${f}`);
      console.log(`[${supportbot.Bot_Name}] > Addons Loaded > ${f}`);
      bot.addons.set(props.help.name, props);
    });
  
  });

bot.on("ready", async () => {
  bot.user.setActivity(supportbot.BotActivity, {type: supportbot.ActvityType});
    console.log(`\u001b[32m`, `―――――――――――――――――― SupportBot ――――――――――――――――――`)
    console.log(`\u001b[37m`, `${supportbot.Bot_Name} has successfully connected to discord`)
    console.log(`\u001b[37m`, `You can download additional features from our marketplace https://emeraldservices.xyz/`)   
    console.log(`\u001b[37m`, `Invite your bot with https://discordapp.com/api/oauth2/authorize?client_id=${bot.user.id}&permissions=8&scope=bot`)
    console.log(`\u001b[37m`, `© SupportBot created by Emerald Services`)
    console.log(`\u001b[32m`, `―――――――――――――――――― SupportBot ――――――――――――――――――`)

});

bot.on("message", async message => {
	if(message.author.bot) return;
  	if(message.channel.type === "dm") return;
  	if (message.content.indexOf(supportbot.Prefix) !== 0) return;

  	let messageArray = message.content.split(" ");
  	const args = message.content.slice(supportbot.Prefix.length).trim().split(/ +/g);
  	const command = args.shift().toLowerCase();

    let staffGroup = message.guild.roles.cache.find(staffRole => staffRole.name === `${supportbot.StaffRole}`)
    let autoGroup = message.guild.roles.cache.find(autoRole => autoRole.name === `${supportbot.AutoRole}`)
    let deptGroup1 = message.guild.roles.cache.find(deptRole1 => deptRole1.name === `${supportbot.Department_Role_1}`)
    let deptGroup2 = message.guild.roles.cache.find(deptRole2 => deptRole2.name === `${supportbot.Department_Role_2}`)
    let deptGroup3 = message.guild.roles.cache.find(deptRole3 => deptRole3.name === `${supportbot.Department_Role_3}`)

    const rolemissing = new Discord.MessageEmbed()
        .setTitle("SupportBot Error!")
        .setDescription(`:x: **Error!** Staff role missing, You cannot execute any commands as the following role does not exist with this server.\nThis role is configurable via **supportbot-config.yml**\n\nPlease create the role: \`${supportbot.StaffRole}\`\n\nError Code: \`SB-01\``)
        .setColor(supportbot.ErrorColour)
    if (!staffGroup) return message.reply(rolemissing).catch(err=>{console.error(err)})

    const rolemissing1 = new Discord.MessageEmbed()
        .setTitle("SupportBot Error!")
        .setDescription(`:x: **Error!** Auto Role missing, You cannot execute any commands as the following role does not exist with this server.\nThis role is configurable via **supportbot-config.yml**\n\nPlease create the role: \`${supportbot.AutoRole}\`\n\nError Code: \`SB-01\``)
        .setColor(supportbot.ErrorColour)
    if (!autoGroup) return message.reply(rolemissing1).catch(err=>{console.error(err)})

    const rolemissing2 = new Discord.MessageEmbed()
        .setTitle("SupportBot Error!")
        .setDescription(`:x: **Error!** Department Role missing, You cannot execute any commands as the following role does not exist with this server.\nThis role is configurable via **supportbot-config.yml**\n\nPlease create the role: \`${supportbot.Department_Role_1}\`\n\nError Code: \`SB-01\``)
        .setColor(supportbot.ErrorColour)
    if (!deptGroup1) return message.reply(rolemissing2).catch(err=>{console.error(err)})

    const rolemissing3 = new Discord.MessageEmbed()
        .setTitle("SupportBot Error!")
        .setDescription(`:x: **Error!** Department Role missing, You cannot execute any commands as the following role does not exist with this server.\nThis role is configurable via **supportbot-config.yml**\n\nPlease create the role: \`${supportbot.Department_Role_2}\`\n\nError Code: \`SB-01\``)
        .setColor(supportbot.ErrorColour)
    if (!deptGroup2) return message.reply(rolemissing3).catch(err=>{console.error(err)})

    const rolemissing4 = new Discord.MessageEmbed()
        .setTitle("SupportBot Error!")
        .setDescription(`:x: **Error!** Department Role missing, You cannot execute any commands as the following role does not exist with this server.\nThis role is configurable via **supportbot-config.yml**\n\nPlease create the role: \`${supportbot.Department_Role_3}\`\n\nError Code: \`SB-01\` `)
        .setColor(supportbot.ErrorColour)
    if (!deptGroup3) return message.reply(rolemissing4).catch(err=>{console.error(err)})

  	const cmd = bot.commands.get(command);
  	if(!cmd) return;
  	cmd.run(bot, message, args);
    message.delete();
});

bot.on("message", async message => {
	if(message.author.bot) return;
	if(message.channel.type === "dm") return;
	if (message.content.indexOf(supportbot.Prefix) !== 0) return;

	let messageArray = message.content.split(" ");
	const args = message.content.slice(supportbot.Prefix.length).trim().split(/ +/g);
	const addon = args.shift().toLowerCase();

	const cmd = bot.addons.get(addon);
	if(!cmd) return;
	cmd.run(bot, message, args);
  message.delete();
});

// [SupportBot] Welcome Message && Auto Join Role

bot.on("guildMemberAdd", (member) => {
  let channel = member.guild.channels.cache.find(channel => channel.name === `${supportbot.WelcomeChannel}`)
  let autorole = member.guild.roles.cache.find(autorole => autorole.name === `${supportbot.AutoRole}`)
  
  const WelcomeMsg = new Discord.MessageEmbed()
    .setColor(supportbot.EmbedColour)
    .setThumbnail(member.user.avatarURL)
    .setDescription(`:wave: ${member.user.username}\n${supportbot.WelcomeMessage}`)

  channel.send(WelcomeMsg);
  member.roles.add(autorole).catch(console.error);
    
});

// [SupportBot] Leave Message

bot.on("guildMemberRemove", (member) => {
  let channel = member.guild.channels.cache.find(channel => channel.name === `${supportbot.LeaveChannel}`)

  const LeaveMsg = new Discord.MessageEmbed()
    .setColor(supportbot.EmbedColour)
    .setThumbnail(member.user.avatarURL)
    .setDescription(`:wave: ${member.user.username}\n${supportbot.LeaveMessage}`)

  channel.send(LeaveMsg);

});

bot.login(supportbot.Token);
