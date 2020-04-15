//  ____                               _   ____        _   
// / ___| _   _ _ __  _ __   ___  _ __| |_| __ )  ___ | |_ 
// \___ \| | | | '_ \| '_ \ / _ \| '__| __|  _ \ / _ \| __|
//  ___) | |_| | |_) | |_) | (_) | |  | |_| |_) | (_) | |_ 
// |____/ \__,_| .__/| .__/ \___/|_|   \__|____/ \___/ \__|
//             |_|   |_|                                   
//              © 2020 Created by Emerald Services
//              Licnese: MIT
//              SupportBot v5.1.2

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
    if(jsfile.length <= 0) return console.log(`${supportbot.Bot_Name} No addons detected nor default! Either download addons from https://itzemerald.tk/`);
  
    jsfile.forEach((f, i) =>{
      let props = require(`./sb-addons/${f}`);
      console.log(`[${supportbot.Bot_Name}] > Addons Loaded > ${f}`);
      bot.addons.set(props.help.name, props);
    });
  
  });

bot.on("ready", async () => {
  bot.user.setActivity(supportbot.BotActivity, {type: supportbot.ActvityType});
    console.log(`\u001b[32m`, `―――――――――――――――――― SupportBot ――――――――――――――――――`)
    console.log(`\u001b[37m`, `Emerald Services has successfully connected to discord`)
    console.log(`\u001b[37m`, `Invite your bot with https://discordapp.com/api/oauth2/authorize?client_id=${bot.user.id}&permissions=8&scope=bot`)
    console.log(`\u001b[37m`, `© ️SupportBot created by Emerald Services`)
    console.log(`\u001b[32m`, `―――――――――――――――――― SupportBot ――――――――――――――――――`)

});

bot.on("message", async message => {
	if(message.author.bot) return;
  	if(message.channel.type === "dm") return;
  	if (message.content.indexOf(supportbot.Prefix) !== 0) return;

  	let messageArray = message.content.split(" ");
  	const args = message.content.slice(supportbot.Prefix.length).trim().split(/ +/g);
  	const command = args.shift().toLowerCase();

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
  let channel = member.guild.channels.find(channel => channel.name === `${supportbot.WelcomeChannel}`)
  let autorole = member.guild.roles.find(autorole => autorole.name === `${supportbot.AutoRole}`)
  
  const WelcomeMsg= new Discord.MessageEmbed()
    .setColor(supportbot.EmbedColour)
    .setThumbnail(member.user.avatarURL)
    .setDescription(`:wave: ${member.user.username}\n${supportbot.WelcomeMessage}`)

  channel.send(WelcomeMsg);
  member.addRole(autorole).catch(console.error);
    
});

// [SupportBot] Leave Message

bot.on("guildMemberRemove", (member) => {
  let channel = member.guild.channels.find(channel => channel.name === `${supportbot.LeaveChannel}`)

  const LeaveMsg= new Discord.MessageEmbed()
    .setColor(supportbot.EmbedColour)
    .setThumbnail(member.user.avatarURL)
    .setDescription(`:wave: ${member.user.username}\n${supportbot.LeaveMessage}`)

  channel.send(LeaveMsg);

});

bot.login(supportbot.Token);
