const Discord = require("discord.js");
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));
const reactionrole = yaml.load(fs.readFileSync('./reactionroles.yml', 'utf8'));

let asd = require("./ready.js");

module.exports = async (client, reaction, user) => {

    const Emoji_1 = supportbot.Announcement_Emoji;
    const Emoji_2 = supportbot.Updates_Emoji;
    const Emoji_3 = supportbot.Giveaways_Emoji;
    const Emoji_4 = supportbot.ChatRevival_Emoji;

    const Role1 = reaction.message.guild.roles.cache.find(role => role.name === "Announcements")
    const Role2 = reaction.message.guild.roles.cache.find(role => role.name === "Updates")
    const Role3 = reaction.message.guild.roles.cache.find(role => role.name === "Giveaways")
    const Role4 = reaction.message.guild.roles.cache.find(role => role.name === "Chat Revival")


    if (reaction.message.id === reactionrole.ReactionRole_MessageID) {
        if (user.bot) return;

        switch (reaction.emoji.id) {
            case Emoji_1: {
                let embed = new Discord.MessageEmbed()
                    .setTitle("Role applied!")
                    .setColor(supportbot.SuccessColor)
                    .setDescription("Role <@" + Role1 + "> has been applied to your account!")
                    .setFooter(supportbot.EmbedFooter)

                reaction.message.guild.members.fetch(user).then(r => {
                    r.roles.remove(Role1)
                })
                //reaction.client.createDM().send({ embed: embed })
                return true;
            }
            case Emoji_2: {
                let embed = new Discord.MessageEmbed()
                    .setTitle("Role applied!")
                    .setColor(supportbot.SuccessColor)
                    .setDescription("Role <@" + Role2 + "> has been applied to your account!")
                    .setFooter(supportbot.EmbedFooter)

                console.log(user.user)

                reaction.message.guild.members.fetch(user).then(r => {
                    r.roles.remove(Role2)
                })
                //reaction.client.createDM().send({ embed: embed })
                return true;
            }
            case Emoji_3: {
                let embed = new Discord.MessageEmbed()
                    .setTitle("Role applied!")
                    .setColor(supportbot.SuccessColor)
                    .setDescription("Role <@" + Role3 + "> has been applied to your account!")
                    .setFooter(supportbot.EmbedFooter)

                reaction.message.guild.members.fetch(user).then(r => {
                    r.roles.remove(Role3)
                })
                //reaction.client.createDM().send({ embed: embed })
                return true;
            }
            case Emoji_4: {
                let embed = new Discord.MessageEmbed()
                    .setTitle("Role applied!")
                    .setColor(supportbot.SuccessColor)
                    .setDescription("Role <@" + Role4 + "> has been applied to your account!")
                    .setFooter(supportbot.EmbedFooter)

                reaction.message.guild.members.fetch(user).then(r => {
                    r.roles.remove(Role4)
                })
                //reaction.client.createDM().send({ embed: embed })
                return true;
            }
        }
    }
};
