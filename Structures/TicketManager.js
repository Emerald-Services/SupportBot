const fs = require("fs");
const path = require("path");
const Discord = require("discord.js");
const yaml = require("js-yaml");
const db = require("./Database.js");

const supportbot = yaml.load(fs.readFileSync("./Configs/supportbot.yml", "utf8"));
const msgconfig = yaml.load(fs.readFileSync("./Configs/messages.yml", "utf8"));

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
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="attachment-file">📎 ${name}</a>
        <div class="attachment-preview attachment-image">
          <img src="${url}" alt="${name}" loading="lazy">
        </div>
      </div>
    `;
  }

  if (type === "video") {
    return `
      <div class="attachment">
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="attachment-file">📎 ${name}</a>
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
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="attachment-file">📎 ${name}</a>
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
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="attachment-file">📎 ${name}</a>
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

function createTranscriptHTML(ticket, reason) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transcript - ${escapeHtml(ticket.name)}</title>
  <style>
    :root {
      --bg: #0b0f14;
      --panel: #111821;
      --panel-2: #182230;
      --panel-3: #1d2938;
      --border: #283548;
      --text: #e6edf3;
      --muted: #9fb0c3;
      --accent: #22c55e;
      --accent-soft: rgba(34, 197, 94, 0.12);
      --code: #0f1720;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body {
      padding: 32px 20px;
    }

    .page {
      max-width: 1100px;
      margin: 0 auto;
    }

    .header {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 18px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }

    .title-wrap h1 {
      margin: 0;
      font-size: 1.8rem;
      line-height: 1.2;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .title-wrap p {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 0.98rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--accent-soft);
      color: #8df0ad;
      border: 1px solid rgba(34, 197, 94, 0.25);
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 0.9rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .meta-grid {
      margin-top: 18px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }

    .meta-card {
      background: var(--panel-2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
    }

    .meta-label {
      color: var(--muted);
      font-size: 0.82rem;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    }

    .meta-value {
      font-size: 0.98rem;
      font-weight: 600;
      word-break: break-word;
    }

    .messages-wrap {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
    }

    .messages-header {
      padding: 18px 20px;
      border-bottom: 1px solid var(--border);
      background: var(--panel-2);
      font-weight: 800;
      font-size: 1rem;
    }

    .message {
      display: flex;
      gap: 14px;
      padding: 18px 20px;
      border-bottom: 1px solid var(--border);
    }

    .message:last-child {
      border-bottom: none;
    }

    .avatar {
      width: 42px;
      height: 42px;
      min-width: 42px;
      border-radius: 50%;
      object-fit: cover;
      background: var(--panel-3);
      border: 1px solid var(--border);
    }

    .message-body {
      min-width: 0;
      flex: 1;
    }

    .message-header {
      display: flex;
      align-items: baseline;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .username {
      font-weight: 800;
      color: var(--text);
      font-size: 0.98rem;
    }

    .userid {
      color: var(--muted);
      font-size: 0.8rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .timestamp {
      color: var(--muted);
      font-size: 0.82rem;
      margin-left: auto;
    }

    .content {
      color: var(--text);
      font-size: 0.96rem;
      line-height: 1.6;
      word-break: break-word;
    }

    .content:empty {
      display: none;
    }

    .discord-embed {
      margin-top: 12px;
      background: var(--panel-2);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 10px;
      padding: 12px 14px;
    }

    .discord-embed-title {
      font-weight: 800;
      margin-bottom: 6px;
    }

    .discord-embed-description {
      color: var(--text);
      line-height: 1.5;
    }

    .embed-field {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    .embed-field-name {
      font-weight: 700;
      margin-bottom: 4px;
    }

    .embed-field-value {
      color: var(--text);
      line-height: 1.5;
    }

    .attachment {
      margin-top: 12px;
      background: var(--panel-2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px;
    }

    .attachment-file {
      display: inline-block;
      color: #8fd9a8;
      text-decoration: none;
      font-weight: 700;
      word-break: break-word;
    }

    .attachment-file:hover {
      text-decoration: underline;
    }

    .attachment-preview {
      margin-top: 10px;
    }

    .attachment-preview img,
    .attachment-preview video {
      width: 100%;
      max-width: 560px;
      border-radius: 10px;
      border: 1px solid var(--border);
      display: block;
      background: #0a0f15;
    }

    .attachment-preview audio {
      width: 100%;
      max-width: 560px;
      display: block;
    }

    code {
      background: var(--code);
      border: 1px solid var(--border);
      padding: 2px 6px;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.9em;
    }

    pre {
      background: var(--code);
      border: 1px solid var(--border);
      padding: 12px;
      border-radius: 10px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }

    pre code {
      background: transparent;
      border: none;
      padding: 0;
    }

    a {
      color: #8fd9ff;
    }

    .empty-state {
      padding: 24px 20px;
      color: var(--muted);
    }

    @media (max-width: 700px) {
      body {
        padding: 18px 12px;
      }

      .header,
      .messages-wrap {
        border-radius: 12px;
      }

      .message {
        padding: 14px;
      }

      .timestamp {
        width: 100%;
        margin-left: 0;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="header">
      <div class="header-top">
        <div class="title-wrap">
          <h1>Ticket Transcript</h1>
          <p>Exported conversation log for support ticket <strong>${escapeHtml(ticket.name)}</strong></p>
        </div>
        <div class="badge">Closed Transcript</div>
      </div>

      <div class="meta-grid">
        <div class="meta-card">
          <div class="meta-label">Channel</div>
          <div class="meta-value">${escapeHtml(ticket.name)}</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Ticket ID</div>
          <div class="meta-value">${escapeHtml(ticket.id)}</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Message Count</div>
          <div class="meta-value">${ticket.messages.length}</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Close Reason</div>
          <div class="meta-value">${escapeHtml(reason || "No Reason Provided.")}</div>
        </div>
      </div>
    </section>

    <section class="messages-wrap">
      <div class="messages-header">Messages</div>
      ${
        ticket.messages.length
          ? ticket.messages
              .map(
                (msg) => `
        <article class="message">
          <img src="${escapeHtml(msg.avatar || "")}" alt="Avatar" class="avatar">
          <div class="message-body">
            <div class="message-header">
              <span class="username">${escapeHtml(msg.username || "Unknown User")}</span>
              <span class="userid">${escapeHtml(msg.userId || "Unknown ID")}</span>
              <span class="timestamp">${formatDate(msg.timestamp)}</span>
            </div>

            <div class="content">${parseMarkdown(msg.content || "")}</div>

            ${renderEmbeds(msg.embeds || [])}
            ${(msg.attachments || []).map(renderAttachment).join("")}
          </div>
        </article>
      `,
              )
              .join("")
          : `<div class="empty-state">No messages were found in this ticket.</div>`
      }
    </section>
  </div>
</body>
</html>`;
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