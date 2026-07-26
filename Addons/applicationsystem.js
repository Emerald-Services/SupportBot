const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const { Command } = require("../Structures/Addon.js");

// Main bot config
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);

// Addon config
const addonConfig = yaml.load(
  fs.readFileSync("./Addons/Configs/applicationsystem.yml", "utf8")
);

// Data file
const dataPath = path.join(__dirname, "Data/applicationsystem.json");

function ensureDataFile() {
  const dir = path.dirname(dataPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(
      dataPath,
      JSON.stringify({ applications: [] }, null, 2),
      "utf8"
    );
  }
}

function readData() {
  ensureDataFile();

  try {
    const raw = fs.readFileSync(dataPath, "utf8");
    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.applications)) {
      return { applications: [] };
    }

    return parsed;
  } catch (error) {
    console.error("[ApplicationSystem] Failed to read data file:", error);
    return { applications: [] };
  }
}

function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
}

function now() {
  return Date.now();
}

function createId() {
  return `app_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function parseColor(value, fallback = 0x2b2d31) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const cleaned = value.trim().replace("#", "");
    if (/^[0-9A-Fa-f]{6}$/.test(cleaned)) {
      return parseInt(cleaned, 16);
    }
  }

  return fallback;
}

function getGeneralColour() {
  return parseColor(supportbot?.Embed?.Colours?.General, 0x2b2d31);
}

function buildNoticeContainer(title, description, colour = 0x5865f2) {
  return new Discord.ContainerBuilder()
    .setAccentColor(colour)
    .addTextDisplayComponents(
      new Discord.TextDisplayBuilder().setContent(`## ${title}`)
    )
    .addSeparatorComponents(new Discord.SeparatorBuilder())
    .addTextDisplayComponents(
      new Discord.TextDisplayBuilder().setContent(description)
    );
}

function buildPanelContainer() {
  const options = Object.entries(addonConfig.Applications || {})
    .slice(0, 25)
    .map(([key, app]) =>
      new Discord.StringSelectMenuOptionBuilder()
        .setLabel(String(app.Name || key).slice(0, 100))
        .setDescription(
          String(app.Description || "Apply for this position").slice(0, 100)
        )
        .setValue(key)
    );

  return new Discord.ContainerBuilder()
    .setAccentColor(getGeneralColour())
    .addTextDisplayComponents(
      new Discord.TextDisplayBuilder().setContent(
        `## ${addonConfig.Panel?.Title || "Applications"}`
      )
    )
    .addSeparatorComponents(new Discord.SeparatorBuilder())
    .addTextDisplayComponents(
      new Discord.TextDisplayBuilder().setContent(
        addonConfig.Panel?.Description ||
          "Choose an application from the dropdown below."
      )
    )
    .addActionRowComponents(
      new Discord.ActionRowBuilder().addComponents(
        new Discord.StringSelectMenuBuilder()
          .setCustomId("appsystem_select")
          .setPlaceholder(
            addonConfig.Panel?.Placeholder || "Select an application type"
          )
          .addOptions(options)
      )
    );
}

function textInputStyle(style) {
  return style === "Paragraph"
    ? Discord.TextInputStyle.Paragraph
    : Discord.TextInputStyle.Short;
}

function sanitizeQuestionKey(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

function formatQuestionTitle(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildApplicationModal(typeKey) {
  const applicationType = addonConfig.Applications?.[typeKey];
  if (!applicationType) return null;

  const modal = new Discord.ModalBuilder()
    .setCustomId(`appsystem_modal_${typeKey}`)
    .setTitle(String(applicationType.Name || typeKey).slice(0, 45));

  const questionEntries = Object.entries(applicationType.Questions || {}).slice(0, 5);

  for (const [key, question] of questionEntries) {
    const input = new Discord.TextInputBuilder()
      .setCustomId(sanitizeQuestionKey(key))
      .setLabel(String(question.Label || key).slice(0, 45))
      .setPlaceholder(String(question.Placeholder || "Enter your answer").slice(0, 100))
      .setRequired(Boolean(question.Required))
      .setStyle(textInputStyle(question.Style))
      .setMinLength(Number(question.MinLength || 1))
      .setMaxLength(Number(question.MaxLength || 1000));

    modal.addComponents(
      new Discord.ActionRowBuilder().addComponents(input)
    );
  }

  return modal;
}

function buildReviewContainer(application, reviewerText = null, locked = false) {
  const statusText =
    application.status === "accepted"
      ? "Accepted"
      : application.status === "rejected"
      ? "Rejected"
      : "Pending";

  const answerLines = Object.entries(application.answers || {})
    .map(([key, value]) => `### ${formatQuestionTitle(key)}\n${value}`)
    .join("\n\n");

  const body = [
    `**Applicant:** <@${application.userId}>`,
    `**Tag:** ${application.userTag}`,
    `**Application Type:** ${application.typeName}`,
    `**Application ID:** \`${application.id}\``,
    `**Status:** ${statusText}`,
    "",
    answerLines || "*No answers provided.*",
  ].join("\n");

  const container = new Discord.ContainerBuilder()
    .setAccentColor(getGeneralColour())
    .addTextDisplayComponents(
      new Discord.TextDisplayBuilder().setContent(
        `## ${addonConfig.Review?.Title || "New Application"}`
      )
    )
    .addSeparatorComponents(new Discord.SeparatorBuilder())
    .addTextDisplayComponents(
      new Discord.TextDisplayBuilder().setContent(body)
    );

  if (reviewerText) {
    container
      .addSeparatorComponents(new Discord.SeparatorBuilder())
      .addTextDisplayComponents(
        new Discord.TextDisplayBuilder().setContent(reviewerText)
      );
  }

  container.addActionRowComponents(
    new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId(`appsystem_accept_${application.id}`)
        .setLabel(addonConfig.Review?.AcceptLabel || "Accept")
        .setStyle(Discord.ButtonStyle.Success)
        .setDisabled(locked),
      new Discord.ButtonBuilder()
        .setCustomId(`appsystem_reject_${application.id}`)
        .setLabel(addonConfig.Review?.RejectLabel || "Reject")
        .setStyle(Discord.ButtonStyle.Danger)
        .setDisabled(locked)
    )
  );

  return container;
}

function getPendingApplication(data, guildId, userId, type) {
  return data.applications.find(
    (app) =>
      app.guildId === guildId &&
      app.userId === userId &&
      app.type === type &&
      app.status === "pending"
  );
}

function getCooldownApplication(data, guildId, userId, type) {
  const cooldownMs =
    Number(addonConfig.Application?.CooldownHours || 24) * 60 * 60 * 1000;

  return data.applications.find(
    (app) =>
      app.guildId === guildId &&
      app.userId === userId &&
      app.type === type &&
      now() - Number(app.createdAt || 0) < cooldownMs
  );
}

function memberCanReview(member) {
  if (!member) return false;

  if (member.permissions?.has(Discord.PermissionFlagsBits.ManageGuild)) {
    return true;
  }

  return false;
}

function registerAddonInteractions(client) {
  if (client.__applicationSystemRegistered) return;
  client.__applicationSystemRegistered = true;

  client.on("interactionCreate", async (interaction) => {
    try {
      if (!interaction.guild) return;

      // Application dropdown select
      if (
        interaction.isStringSelectMenu() &&
        interaction.customId === "appsystem_select"
      ) {
        const typeKey = interaction.values[0];
        const applicationType = addonConfig.Applications?.[typeKey];

        if (!applicationType) {
          return interaction.reply({
            flags:
              Discord.MessageFlags.Ephemeral |
              Discord.MessageFlags.IsComponentsV2,
            components: [
              buildNoticeContainer(
                "Invalid Application",
                "That application type does not exist.",
                0xed4245
              ),
            ],
          });
        }

        const data = readData();

        if (addonConfig.Application?.OneOpenApplicationPerUserPerType) {
          const existing = getPendingApplication(
            data,
            interaction.guild.id,
            interaction.user.id,
            typeKey
          );

          if (existing) {
            return interaction.reply({
              flags:
                Discord.MessageFlags.Ephemeral |
                Discord.MessageFlags.IsComponentsV2,
              components: [
                buildNoticeContainer(
                  "Application Already Open",
                  `You already have a pending ${applicationType.Name} application.`,
                  0xed4245
                ),
              ],
            });
          }
        }

        const cooldownHit = getCooldownApplication(
          data,
          interaction.guild.id,
          interaction.user.id,
          typeKey
        );

        if (cooldownHit && cooldownHit.status !== "pending") {
          return interaction.reply({
            flags:
              Discord.MessageFlags.Ephemeral |
              Discord.MessageFlags.IsComponentsV2,
            components: [
              buildNoticeContainer(
                "Please Wait",
                `You must wait ${addonConfig.Application?.CooldownHours || 24} hours before applying again for ${applicationType.Name}.`,
                0xfee75c
              ),
            ],
          });
        }

        const modal = buildApplicationModal(typeKey);

        if (!modal) {
          return interaction.reply({
            flags:
              Discord.MessageFlags.Ephemeral |
              Discord.MessageFlags.IsComponentsV2,
            components: [
              buildNoticeContainer(
                "Modal Error",
                "The application form could not be created.",
                0xed4245
              ),
            ],
          });
        }

        return interaction.showModal(modal);
      }

      // Application modal submit
      if (
        interaction.isModalSubmit() &&
        interaction.customId.startsWith("appsystem_modal_")
      ) {
        const typeKey = interaction.customId.replace("appsystem_modal_", "");
        const applicationType = addonConfig.Applications?.[typeKey];

        if (!applicationType) {
          return interaction.reply({
            flags:
              Discord.MessageFlags.Ephemeral |
              Discord.MessageFlags.IsComponentsV2,
            components: [
              buildNoticeContainer(
                "Invalid Application",
                "That application type no longer exists.",
                0xed4245
              ),
            ],
          });
        }

        const reviewChannel = interaction.guild.channels.cache.get(
          addonConfig.Application?.ReviewChannelId
        );

        if (!reviewChannel) {
          return interaction.reply({
            flags:
              Discord.MessageFlags.Ephemeral |
              Discord.MessageFlags.IsComponentsV2,
            components: [
              buildNoticeContainer(
                "Configuration Error",
                "The review channel was not found. Please contact staff.",
                0xed4245
              ),
            ],
          });
        }

        const data = readData();

        if (addonConfig.Application?.OneOpenApplicationPerUserPerType) {
          const existing = getPendingApplication(
            data,
            interaction.guild.id,
            interaction.user.id,
            typeKey
          );

          if (existing) {
            return interaction.reply({
              flags:
                Discord.MessageFlags.Ephemeral |
                Discord.MessageFlags.IsComponentsV2,
              components: [
                buildNoticeContainer(
                  "Application Already Open",
                  `You already have a pending ${applicationType.Name} application.`,
                  0xed4245
                ),
              ],
            });
          }
        }

        const answers = {};
        const questionEntries = Object.entries(applicationType.Questions || {}).slice(0, 5);

        for (const [key] of questionEntries) {
          const inputKey = sanitizeQuestionKey(key);
          answers[inputKey] = interaction.fields.getTextInputValue(inputKey);
        }

        const application = {
          id: createId(),
          type: typeKey,
          typeName: applicationType.Name || typeKey,
          guildId: interaction.guild.id,
          userId: interaction.user.id,
          userTag: interaction.user.tag || interaction.user.username,
          status: "pending",
          createdAt: now(),
          reviewerId: null,
          reviewedAt: null,
          reviewMessageId: null,
          answers,
        };

        const reviewMessage = await reviewChannel.send({
          flags: Discord.MessageFlags.IsComponentsV2,
          components: [buildReviewContainer(application, null, false)],
        });

        application.reviewMessageId = reviewMessage.id;
        data.applications.push(application);
        writeData(data);

        return interaction.reply({
          flags:
            Discord.MessageFlags.Ephemeral |
            Discord.MessageFlags.IsComponentsV2,
          components: [
            buildNoticeContainer(
              "Application Sent",
              `Your ${applicationType.Name} application has been submitted successfully.`,
              0x57f287
            ),
          ],
        });
      }

      // Review buttons
      if (
        interaction.isButton() &&
        (interaction.customId.startsWith("appsystem_accept_") ||
          interaction.customId.startsWith("appsystem_reject_"))
      ) {
        if (!memberCanReview(interaction.member)) {
          return interaction.reply({
            flags:
              Discord.MessageFlags.Ephemeral |
              Discord.MessageFlags.IsComponentsV2,
            components: [
              buildNoticeContainer(
                "No Permission",
                "You do not have permission to review applications.",
                0xed4245
              ),
            ],
          });
        }

        const isAccept = interaction.customId.startsWith("appsystem_accept_");
        const applicationId = interaction.customId.replace(
          isAccept ? "appsystem_accept_" : "appsystem_reject_",
          ""
        );

        const data = readData();
        const application = data.applications.find((app) => app.id === applicationId);

        if (!application) {
          return interaction.reply({
            flags:
              Discord.MessageFlags.Ephemeral |
              Discord.MessageFlags.IsComponentsV2,
            components: [
              buildNoticeContainer(
                "Not Found",
                "This application no longer exists in storage.",
                0xed4245
              ),
            ],
          });
        }

        if (application.status !== "pending") {
          return interaction.reply({
            flags:
              Discord.MessageFlags.Ephemeral |
              Discord.MessageFlags.IsComponentsV2,
            components: [
              buildNoticeContainer(
                "Already Reviewed",
                `This application has already been ${application.status}.`,
                0xfee75c
              ),
            ],
          });
        }

        application.status = isAccept ? "accepted" : "rejected";
        application.reviewerId = interaction.user.id;
        application.reviewedAt = now();
        writeData(data);

        const reviewerText = [
          `### Review Result`,
          `**Decision:** ${isAccept ? "Accepted" : "Rejected"}`,
          `**Reviewer:** <@${interaction.user.id}>`,
          `**Reviewed At:** <t:${Math.floor(application.reviewedAt / 1000)}:F>`,
        ].join("\n");

        await interaction.update({
          flags: Discord.MessageFlags.IsComponentsV2,
          components: [
            buildReviewContainer(application, reviewerText, true),
          ],
        });

        const applicationType = addonConfig.Applications?.[application.type];

        if (isAccept && applicationType?.AcceptedRoleId) {
          const member = await interaction.guild.members
            .fetch(application.userId)
            .catch(() => null);

          if (member) {
            await member.roles.add(applicationType.AcceptedRoleId).catch(() => null);
          }
        }

        const applicantUser = await interaction.client.users
          .fetch(application.userId)
          .catch(() => null);

        if (applicantUser) {
          await applicantUser
            .send({
              flags: Discord.MessageFlags.IsComponentsV2,
              components: [
                buildNoticeContainer(
                  isAccept ? "Application Accepted" : "Application Rejected",
                  isAccept
                    ? `Congratulations! Your ${application.typeName} application in **${interaction.guild.name}** has been accepted.`
                    : `Your ${application.typeName} application in **${interaction.guild.name}** has been rejected.`,
                  isAccept ? 0x57f287 : 0xed4245
                ),
              ],
            })
            .catch(() => null);
        }

        return;
      }
    } catch (error) {
      console.error("[ApplicationSystem] Interaction error:", error);

      if (interaction.deferred || interaction.replied) {
        return;
      }

      return interaction
        .reply({
          flags:
            Discord.MessageFlags.Ephemeral |
            Discord.MessageFlags.IsComponentsV2,
          components: [
            buildNoticeContainer(
              "Error",
              "Something went wrong while handling that application interaction.",
              0xed4245
            ),
          ],
        })
        .catch(() => null);
    }
  });
}

module.exports = new Command({
  name: addonConfig.Command?.Name || "applicationsetup",
  description:
    addonConfig.Command?.Description || "Posts the application panel",
  options: [],
  permissions: addonConfig.Command?.Permission || ["ManageGuild"],

  async run(interaction) {
    registerAddonInteractions(interaction.client);

    await interaction.channel.send({
      flags: Discord.MessageFlags.IsComponentsV2,
      components: [buildPanelContainer()],
    });

    return interaction.reply({
      flags:
        Discord.MessageFlags.Ephemeral |
        Discord.MessageFlags.IsComponentsV2,
      components: [
        buildNoticeContainer(
          "Application Panel Posted",
          "The application panel has been posted in this channel.",
          0x57f287
        ),
      ],
    });
  },
});