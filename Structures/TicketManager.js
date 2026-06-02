const fs = require("fs");
const path = require("path");
const Discord = require("discord.js");
const yaml = require("js-yaml");
const db = require("./Database.js");

const supportbot = require("./ConfigStore").supportbot;
const msgconfig = require("./ConfigStore").messages;
const { createTranscriptHTML } = require("./TranscriptTemplate.js");

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseMarkdown(content = "") {
  let safe = escapeHtml(content);

  safe = safe.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  safe = safe.replace(/`(.*?)`/g, "<code>$1</code>");
  safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/\*(.*?)\*/g, "<em>$1</em>");
  safe = safe.replace(/_(.*?)_/g, "<em>$1</em>");
  safe = safe.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  return safe.replace(/\n/g, "<br>");
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function getFileTypeInfo(att) {
  const fileName = String(att.name || "attachment").toLowerCase();

  if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(fileName)) {
    return "image";
  }

  if (/\.(mp4|webm|mov|m4v)$/i.test(fileName)) {
    return "video";
  }

  if (/\.(mp3|wav|ogg|m4a|flac)$/i.test(fileName)) {
    return "audio";
  }

  return "file";
}

function renderAttachment(att) {
  const url = escapeHtml(att.url || "");
  const name = escapeHtml(att.name || "attachment");
  const type = getFileTypeInfo(att);

  if (type === "image") {
    return `
      <div class="attachment">
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="attachment-file">ðŸ“Ž ${name}</a>
        <div class="attachment-preview attachment-image">
          <img src="${url}" alt="${name}" loading="lazy">
        </div>
      </div>
    `;
  }

  if (type === "video") {
    return `
      <div class="attachment">
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="attachment-file">ðŸ“Ž ${name}</a>
        <div class="attachment-preview">
          <video controls preload="metadata">
            <source src="${url}">
          </video>
        </div>
      </div>
    `;
  }

  if (type === "audio") {
    return `
      <div class="attachment">
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="attachment-file">ðŸ“Ž ${name}</a>
        <div class="attachment-preview">
          <audio controls preload="metadata">
            <source src="${url}">
          </audio>
        </div>
      </div>
    `;
  }

  return `
    <div class="attachment">
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="attachment-file">ðŸ“Ž ${name}</a>
    </div>
  `;
}

function renderEmbeds(embeds = []) {
  return embeds
    .map((embed) => {
      const fields = (embed.fields || [])
        .map(
          (field) => `
            <div class="embed-field">
              <div class="embed-field-name">${escapeHtml(field.name || "Field")}</div>
              <div class="embed-field-value">${parseMarkdown(field.value || "")}</div>
            </div>
          `,
        )
        .join("");

      return `
        <div class="discord-embed">
          ${embed.title ? `<div class="discord-embed-title">${escapeHtml(embed.title)}</div>` : ""}
          ${embed.description ? `<div class="discord-embed-description">${parseMarkdown(embed.description)}</div>` : ""}
          ${fields}
        </div>
      `;
    })
    .join("");
}

async function createTranscript(interaction, ticket, reason) {
  const { getChannel } = interaction.client;

  const transcriptChannel = await getChannel(
    supportbot.Ticket.Log.TicketDataLog,
    interaction.guild,
  );

  if (!transcriptChannel) {
    throw new Error("Transcript log channel missing or inaccessible.");
  }

  let allMessages = [];
  let lastId = null;

  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const messages = await interaction.channel.messages.fetch(options);
    if (messages.size === 0) break;

    allMessages = [...allMessages, ...messages.values()];
    lastId = messages.last().id;

    if (messages.size < 100) break;
  }

  allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const transcriptData = allMessages.map((msg) => ({
    content: msg.content || "",
    username: msg.author.username,
    userId: msg.author.id,
    avatar: msg.author.displayAvatarURL({ extension: "png", size: 128 }),
    timestamp: msg.createdAt.toISOString(),
    attachments: Array.from(msg.attachments.values()).map((att) => ({
      url: att.url,
      name: att.name || "attachment",
      contentType: att.contentType || null,
      size: att.size || 0,
    })),
    embeds: msg.embeds.map((embed) => ({
      title: embed.title || "",
      description: embed.description || "",
      fields: embed.fields || [],
    })),
  }));

  if (typeof db.updateTicketStatus === "function") {
    db.updateTicketStatus(interaction.channel.id, "closed");
  }

  const ticketUserId = ticket.user_id || ticket.user;
  const tUser =
    interaction.client.users.cache.get(ticketUserId) ||
    (ticketUserId
      ? await interaction.client.users.fetch(ticketUserId).catch(() => null)
      : null);

  const transcriptEmbed = new Discord.EmbedBuilder()
    .setTitle(msgconfig.TicketLog.Title)
    .setColor(msgconfig.TicketLog.Colour)
    .setFooter({
      text: supportbot.Embed.Footer,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setDescription(
      `> **Ticket:** ${interaction.channel.name} (\`${interaction.channel.id}\`)\n` +
        `> **User:** ${tUser?.tag || "Unknown User"} (\`${tUser?.id || ticketUserId || "Unknown"}\`)\n` +
        `> **Closed by:** <@${interaction.user.id}>\n` +
        `> **Message Count:** ${transcriptData.length}`,
    )
    .addFields({
      name: "Reason",
      value: `\`\`\`${reason || "No Reason Provided."}\`\`\``,
      inline: false,
    });

  const transcriptDir = path.join(process.cwd(), "./Data/Transcripts");
  if (!fs.existsSync(transcriptDir)) {
    fs.mkdirSync(transcriptDir, { recursive: true });
  }

  const htmlFileName = `${interaction.channel.id}-transcript.html`;
  const htmlPath = path.join(transcriptDir, htmlFileName);

  const html = createTranscriptHTML(
    {
      id: interaction.channel.id,
      name: interaction.channel.name,
      messages: transcriptData,
    },
    reason,
  );

  fs.writeFileSync(htmlPath, html, "utf8");

  await transcriptChannel.send({
    embeds: [transcriptEmbed],
    files: [
      new Discord.AttachmentBuilder(htmlPath, {
        name: `SPOILER_${htmlFileName}`,
      }),
    ],
  });

  return { htmlPath };
}

module.exports = {
  createTranscript,
};
