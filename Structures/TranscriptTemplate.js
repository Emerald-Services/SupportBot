const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const {
  normalizeFontFamily,
  resolveTypography,
} = require("./googleFonts.js");

const TEMPLATE_PATH = path.join(__dirname, "../Configs/transcript-template.yml");

let cachedTemplate = null;

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

function deepMerge(base, patch) {
  const out = structuredClone(base);
  for (const [key, val] of Object.entries(patch || {})) {
    if (
      val &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      out[key] &&
      typeof out[key] === "object" &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMerge(out[key], val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

function getDefaultTemplate() {
  return {
    Theme: {
      Background: "#0b0f14",
      Panel: "#111821",
      PanelSecondary: "#182230",
      PanelTertiary: "#1d2938",
      Border: "#283548",
      Text: "#e6edf3",
      Muted: "#9fb0c3",
      Accent: "#22c55e",
      AccentSoft: "rgba(34, 197, 94, 0.12)",
      AccentBorder: "rgba(34, 197, 94, 0.25)",
      AccentText: "#8df0ad",
      Link: "#8fd9ff",
      AttachmentLink: "#8fd9a8",
      CodeBackground: "#0f1720",
    },
    Typography: {
      FontFamily: "Inter",
    },
    Header: {
      Title: "Ticket Transcript",
      Subtitle:
        "Exported conversation log for support ticket **{{ticketName}}**",
      Badge: "Closed Transcript",
      ShowMetaCards: true,
    },
    Meta: {
      ChannelLabel: "Channel",
      TicketIdLabel: "Ticket ID",
      MessageCountLabel: "Message Count",
      CloseReasonLabel: "Close Reason",
      DefaultCloseReason: "No Reason Provided.",
    },
    Messages: {
      SectionTitle: "Messages",
      EmptyState: "No messages were found in this ticket.",
    },
    Advanced: {
      CustomCss: "",
    },
  };
}

function normalizeTemplate(raw) {
  const merged = deepMerge(getDefaultTemplate(), raw || {});
  if (merged.Typography) {
    merged.Typography.FontFamily = normalizeFontFamily(
      merged.Typography.FontFamily,
    );
  }
  return merged;
}

function loadTemplateFromDisk() {
  try {
    if (!fs.existsSync(TEMPLATE_PATH)) {
      const defaults = getDefaultTemplate();
      fs.mkdirSync(path.dirname(TEMPLATE_PATH), { recursive: true });
      fs.writeFileSync(TEMPLATE_PATH, yaml.dump(defaults), "utf8");
      return defaults;
    }
    const parsed = yaml.load(fs.readFileSync(TEMPLATE_PATH, "utf8"));
    return normalizeTemplate(parsed);
  } catch (err) {
    console.error("[TranscriptTemplate] Failed to load template:", err.message);
    return getDefaultTemplate();
  }
}

function getTemplate() {
  if (!cachedTemplate) {
    cachedTemplate = loadTemplateFromDisk();
  }
  return structuredClone(cachedTemplate);
}

function reloadTemplate() {
  cachedTemplate = loadTemplateFromDisk();
  return getTemplate();
}

function saveTemplate(data) {
  const merged = normalizeTemplate(data);
  fs.mkdirSync(path.dirname(TEMPLATE_PATH), { recursive: true });
  fs.writeFileSync(TEMPLATE_PATH, yaml.dump(merged), "utf8");
  cachedTemplate = merged;
  return merged;
}

function applyPlaceholders(text, ctx) {
  return String(text || "")
    .replace(/\{\{ticketName\}\}/g, ctx.name || "")
    .replace(/\{\{ticketId\}\}/g, ctx.id || "")
    .replace(/\{\{messageCount\}\}/g, String(ctx.messageCount ?? 0))
    .replace(/\{\{reason\}\}/g, ctx.reason || "");
}

function formatHeaderText(text, ctx) {
  const withPlaceholders = applyPlaceholders(text, ctx);
  const escaped = escapeHtml(withPlaceholders);
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function buildStyles(template) {
  const t = template.Theme;
  const { fontFamilyCss } = resolveTypography(template.Typography?.FontFamily);
  const custom = String(template.Advanced?.CustomCss || "").trim();

  return `
    :root {
      --bg: ${t.Background};
      --panel: ${t.Panel};
      --panel-2: ${t.PanelSecondary};
      --panel-3: ${t.PanelTertiary};
      --border: ${t.Border};
      --text: ${t.Text};
      --muted: ${t.Muted};
      --accent: ${t.Accent};
      --accent-soft: ${t.AccentSoft};
      --accent-border: ${t.AccentBorder};
      --accent-text: ${t.AccentText};
      --link: ${t.Link};
      --attachment-link: ${t.AttachmentLink};
      --code: ${t.CodeBackground};
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--text);
      font-family: ${fontFamilyCss};
    }

    body { padding: 32px 20px; }

    .page { max-width: 1100px; margin: 0 auto; }

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
      color: var(--accent-text);
      border: 1px solid var(--accent-border);
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

    .message:last-child { border-bottom: none; }

    .avatar {
      width: 42px;
      height: 42px;
      min-width: 42px;
      border-radius: 50%;
      object-fit: cover;
      background: var(--panel-3);
      border: 1px solid var(--border);
    }

    .message-body { min-width: 0; flex: 1; }

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

    .content:empty { display: none; }

    .discord-embed {
      margin-top: 12px;
      background: var(--panel-2);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 10px;
      padding: 12px 14px;
    }

    .discord-embed-title { font-weight: 800; margin-bottom: 6px; }
    .discord-embed-description { color: var(--text); line-height: 1.5; }

    .embed-field {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    .embed-field-name { font-weight: 700; margin-bottom: 4px; }
    .embed-field-value { color: var(--text); line-height: 1.5; }

    .attachment {
      margin-top: 12px;
      background: var(--panel-2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px;
    }

    .attachment-file {
      display: inline-block;
      color: var(--attachment-link);
      text-decoration: none;
      font-weight: 700;
      word-break: break-word;
    }

    .attachment-file:hover { text-decoration: underline; }

    .attachment-preview { margin-top: 10px; }

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

    pre code { background: transparent; border: none; padding: 0; }

    a { color: var(--link); }

    .empty-state { padding: 24px 20px; color: var(--muted); }

    @media (max-width: 700px) {
      body { padding: 18px 12px; }
      .header, .messages-wrap { border-radius: 12px; }
      .message { padding: 14px; }
      .timestamp { width: 100%; margin-left: 0; }
    }

    ${custom}
  `;
}

function getSampleTicket() {
  return {
    id: "123456789012345678",
    name: "ticket-support-demo",
    messages: [
      {
        username: "SupportBot",
        userId: "100000000000000001",
        avatar: "https://cdn.discordapp.com/embed/avatars/0.png",
        timestamp: new Date().toISOString(),
        content: "Hello! Thanks for opening a ticket. How can we help?",
        embeds: [],
        attachments: [],
      },
      {
        username: "Member",
        userId: "100000000000000002",
        avatar: "https://cdn.discordapp.com/embed/avatars/1.png",
        timestamp: new Date(Date.now() - 60000).toISOString(),
        content: "I need help with my purchase — order **#48291**.",
        embeds: [
          {
            title: "Order details",
            description: "Payment received · awaiting delivery",
            fields: [{ name: "Status", value: "Pending" }],
          },
        ],
        attachments: [],
      },
    ],
  };
}

function createTranscriptHTML(ticket, reason, templateInput) {
  const template = templateInput
    ? normalizeTemplate(templateInput)
    : getTemplate();
  const header = template.Header;
  const meta = template.Meta;
  const messagesCfg = template.Messages;
  const closeReason = reason || meta.DefaultCloseReason;
  const ctx = {
    name: ticket.name,
    id: ticket.id,
    messageCount: ticket.messages.length,
    reason: closeReason,
  };

  const { headLinks } = resolveTypography(template.Typography?.FontFamily);

  const metaSection = header.ShowMetaCards
    ? `
      <div class="meta-grid">
        <div class="meta-card">
          <div class="meta-label">${escapeHtml(meta.ChannelLabel)}</div>
          <div class="meta-value">${escapeHtml(ticket.name)}</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">${escapeHtml(meta.TicketIdLabel)}</div>
          <div class="meta-value">${escapeHtml(ticket.id)}</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">${escapeHtml(meta.MessageCountLabel)}</div>
          <div class="meta-value">${ticket.messages.length}</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">${escapeHtml(meta.CloseReasonLabel)}</div>
          <div class="meta-value">${escapeHtml(closeReason)}</div>
        </div>
      </div>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transcript - ${escapeHtml(ticket.name)}</title>
  ${headLinks}
  <style>${buildStyles(template)}</style>
</head>
<body>
  <div class="page">
    <section class="header">
      <div class="header-top">
        <div class="title-wrap">
          <h1>${escapeHtml(header.Title)}</h1>
          <p>${formatHeaderText(header.Subtitle, ctx)}</p>
        </div>
        <div class="badge">${escapeHtml(header.Badge)}</div>
      </div>
      ${metaSection}
    </section>

    <section class="messages-wrap">
      <div class="messages-header">${escapeHtml(messagesCfg.SectionTitle)}</div>
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
          : `<div class="empty-state">${escapeHtml(messagesCfg.EmptyState)}</div>`
      }
    </section>
  </div>
</body>
</html>`;
}

function renderPreview(templateInput) {
  const sample = getSampleTicket();
  return createTranscriptHTML(
    sample,
    "Resolved — thank you for contacting support.",
    templateInput,
  );
}

module.exports = {
  TEMPLATE_PATH,
  getDefaultTemplate,
  getTemplate,
  reloadTemplate,
  saveTemplate,
  normalizeTemplate,
  getSampleTicket,
  createTranscriptHTML,
  renderPreview,
};
