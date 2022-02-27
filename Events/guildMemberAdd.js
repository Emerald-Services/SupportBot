
const Discord = require('discord.js');
const fs = require("fs");
const Event = require("../Structures/Event.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);

module.exports = new Event("guildMemberAdd", async (client, member, interaction, guild) => {
    
    const WelcomeChannel = interaction.guild.channels.get(supportbot.WelcomeChannel)

    const WelcomeEmbed = new Discord.MessageEmbed()
        .setColor(supportbot.WelcomeColour)
        .setTitle(supportbot.WelcomeTitle)
        .setDescription(supportbot.WelcomeMessage.replace(/%joined_user%/g, member.user))
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
    
        member.guild.channels.cache.get(
            supportbot.WelcomeChannel).send({
                embeds: [WelcomeEmbed] 

            })


        const WelcomeMsg = await WelcomeChannel.send({ 
            embeds: [WelcomeEmbed] 
        });

});
