//  ____                               _   ____        _   
// / ___| _   _ _ __  _ __   ___  _ __| |_| __ )  ___ | |_ 
// \___ \| | | | '_ \| '_ \ / _ \| '__| __|  _ \ / _ \| __|
//  ___) | |_| | |_) | |_) | (_) | |  | |_| |_) | (_) | |_ 
// |____/ \__,_| .__/| .__/ \___/|_|   \__|____/ \___/ \__|
//             |_|   |_|                                   

// Resource: SupportBot
// Developed by Emerald Services
// Version: 5.0.0

const Discord = require("discord.js");
const fs = require("fs");
const bot = new Discord.Client();

bot.commands = new Discord.Collection();
bot.settings = require("./settings.json");

fs.readdir("./commands/", (err, files) => {
    if(err) console.log(err);
  
    let jsfile = files.filter(f => f.split(".").pop() === "js")
    if(jsfile.length <= 0) return console.log(`${bot.settings.botname} No commands found. Try to Re-download the resource`);
  
    jsfile.forEach((f, i) =>{
      let props = require(`./commands/${f}`);
      console.log(`[${bot.settings.botname}] > Command Loaded > ${f}`);
      bot.commands.set(props.help.name, props);
    });
  
  });

bot.addons = new Discord.Collection();  

fs.readdir("./sb-addons/", (err, files) => {
    if(err) console.log(err);
  
    let jsfile = files.filter(f => f.split(".").pop() === "js")
    if(jsfile.length <= 0) return console.log(`${bot.settings.botname} No addons detected nor default! Either download addons from https://itzemerald.tk/`);
  
    jsfile.forEach((f, i) =>{
      let props = require(`./sb-addons/${f}`);
      console.log(`[${bot.settings.botname}] > Addons Loaded > ${f}`);
      bot.addons.set(props.help.name, props);
    });
  
  });

bot.on("ready", async () => {
  bot.user.setActivity(bot.settings.BotStatus, {type:"PLAYING"});
    console.log(`\u001b[32m`, `―――――――――――――――――― SupportBot ――――――――――――――――――`)
    console.log(`\u001b[37m`, `Emerald Services has successfully connected to discord`)
    console.log(`\u001b[37m`, `Invite your bot with https://discordapp.com/api/oauth2/authorize?client_id=${bot.user.id}&permissions=8&scope=bot`)
    console.log(`\u001b[37m`, `© ️SupportBot created by Emerald Services`)
    console.log(`\u001b[32m`, `―――――――――――――――――― SupportBot ――――――――――――――――――`)
    console.log(`\u001b[43;1m \u001b[37m \u001b[1m`, `If you require any assistance you can contact us at discord, https://discord.gg/tNt95Ba`)

});

bot.on("message", async message => {
  if(message.author.bot) return;
  if(message.channel.type === "dm") return;
  if (message.content.indexOf(bot.settings.prefix) !== 0) return;

  let messageArray = message.content.split(" ");
  const args = message.content.slice(bot.settings.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  const cmd = bot.commands.get(command);
  if(!cmd) return;
  cmd.run(bot, message, args);
});

bot.on("message", async message => {
if(message.author.bot) return;
if(message.channel.type === "dm") return;
if (message.content.indexOf(bot.settings.prefix) !== 0) return;

let messageArray = message.content.split(" ");
const args = message.content.slice(bot.settings.prefix.length).trim().split(/ +/g);
const addon = args.shift().toLowerCase();

const cmd = bot.addons.get(addon);
if(!cmd) return;
cmd.run(bot, message, args);
});

// [SupportBot] Welcome Message && Auto Join Role

bot.on("guildMemberAdd", (member) => {
  let channel = member.guild.channels.find(channel => channel.name === `${bot.settings.Welcome_Channel}`)
  let autorole = member.guild.roles.find(autorole => autorole.name === `${bot.settings.Auto_Role}`)
  
  const WelcomeMsg= new Discord.RichEmbed()
  .setColor(bot.settings.colour)
  .setThumbnail(member.user.avatarURL)
  .setDescription(`:wave: ${member.user.username}\n${bot.settings.Welcome_Message}`)

  channel.send(WelcomeMsg);
  member.addRole(autorole).catch(console.error);
    
});

// [SupportBot] Leave Message

bot.on("guildMemberRemove", (member) => {
  let channel = member.guild.channels.find(channel => channel.name === `${bot.settings.Leave_Channel}`)

  const LeaveMsg= new Discord.RichEmbed()
  .setColor(bot.settings.colour)
  .setThumbnail(member.user.avatarURL)
  .setDescription(`:wave: ${member.user.username}\n${bot.settings.Leave_Message}`)

  channel.send(LeaveMsg);

});

bot.login(bot.settings.token);
