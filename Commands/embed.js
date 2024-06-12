// File path: ./commands/embed.js

const fs = require("fs");
const Discord = require("discord.js");
const yaml = require("js-yaml");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.Embed.Command,
  description: cmdconfig.Embed.Description,
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "title",
      description: "Embed Title",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "message",
      description: "Embed Message",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "color",
      description: "Embed HEX Color",
      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "fields",
      description: "Embed Fields (title|content;title|content;...)",
      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "thumbnail",
      description: "Embed Thumbnail URL",
      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "image",
      description: "Embed Image URL",
      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "footer",
      description: "Embed Footer Text",
      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "footericon",
      description: "Embed Footer Icon URL",
      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "author",
      description: "Embed Author Name",
      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "authoricon",
      description: "Embed Author Icon URL",
      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "authorurl",
      description: "Embed Author URL",
      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "timestamp",
      description: "Include Timestamp",
      type: Discord.ApplicationCommandOptionType.Boolean,
      required: false,
    },
    {
      name: "inline",
      description: "Make Fields Inline",
      type: Discord.ApplicationCommandOptionType.Boolean,
      required: false,
    }
  ],
  permissions: cmdconfig.Embed.Permission,

  async run(interaction) {
    const { getRole } = interaction.client;
    let SupportStaff = await getRole(supportbot.Roles.StaffMember.Staff, interaction.guild);
    let Admin = await getRole(supportbot.Roles.StaffMember.Admin, interaction.guild);

    if (!SupportStaff || !Admin) {
      return interaction.reply("Some roles seem to be missing!\nPlease check for errors when starting the bot.");
    }

    const NoPerms = new Discord.EmbedBuilder()
      .setTitle("Invalid Permissions!")
      .setDescription(`${msgconfig.Error.IncorrectPerms}\n\nRole Required: \`${supportbot.Roles.StaffMember.Staff}\` or \`${supportbot.Roles.StaffMember.Admin}\``)
      .setColor(supportbot.Embed.Colours.Warn);

    if (
      interaction.member.roles.cache.has(SupportStaff.id) ||
      interaction.member.roles.cache.has(Admin.id)
    ) {
      const EmbedTitle = interaction.options.getString("title").replace(/\\n/g, '\n');
      const EmbedSubject = interaction.options.getString("message").replace(/\\n/g, '\n');
      const GeneralColour = interaction.options.getString("color") || supportbot.Embed.Colours.Default;
      const EmbedThumbnail = interaction.options.getString("thumbnail");
      const EmbedImage = interaction.options.getString("image");
      const EmbedFields = interaction.options.getString("fields");
      const EmbedFooter = interaction.options.getString("footer")?.replace(/\\n/g, '\n');
      const EmbedFooterIcon = interaction.options.getString("footericon");
      const EmbedAuthor = interaction.options.getString("author")?.replace(/\\n/g, '\n');
      const EmbedAuthorIcon = interaction.options.getString("authoricon");
      const EmbedAuthorURL = interaction.options.getString("authorurl");
      const EmbedTimestamp = interaction.options.getBoolean("timestamp");
      const InlineFields = interaction.options.getBoolean("inline");

      const EmbedMsg = new Discord.EmbedBuilder()
        .setTitle(EmbedTitle)
        .setDescription(EmbedSubject)
        .setColor(GeneralColour)
        .setThumbnail(EmbedThumbnail)
        .setImage(EmbedImage);

      if (EmbedFields) {
        const fieldsArray = EmbedFields.split(';');
        fieldsArray.forEach(field => {
          const [title, value] = field.split('|');
          if (title && value) {
            EmbedMsg.addFields({ name: title.replace(/\\n/g, '\n'), value: value.replace(/\\n/g, '\n'), inline: InlineFields || false });
          }
        });
      }

      if (EmbedFooter) {
        EmbedMsg.setFooter({ text: EmbedFooter, iconURL: EmbedFooterIcon });
      }

      if (EmbedAuthor) {
        EmbedMsg.setAuthor({ name: EmbedAuthor, iconURL: EmbedAuthorIcon, url: EmbedAuthorURL });
      }

      if (EmbedTimestamp) {
        EmbedMsg.setTimestamp();
      }

      interaction.reply({
        embeds: [EmbedMsg],
      });
    } else {
      return interaction.reply({ embeds: [NoPerms] });
    }
  },
});
