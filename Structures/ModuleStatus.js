const fs = require("fs");
const path = require("path");

const PLACEHOLDER_PATTERNS = [
  /ROLE_ID/i,
  /CHANNEL_ID/i,
  /CATEGORY_ID/i,
  /TAG_ID/i,
  /FORUM_CHANNEL_ID/i,
  /BOT_TOKEN/i,
  /MODEL_API_KEY/i,
  /PASTEBIN_API_KEY/i,
  /YOUR_/i,
  /PUT_RANDOM_STRING/i,
  /example\.com/i,
];

function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return false;
  return String(value).trim() === "";
}

function isPlaceholder(value) {
  if (isEmpty(value)) return true;
  const s = String(value).trim();
  return PLACEHOLDER_PATTERNS.some((p) => p.test(s));
}

function isDiscordId(value) {
  return /^\d{17,20}$/.test(String(value).trim());
}

function isConfiguredId(value) {
  return isDiscordId(value) && !isPlaceholder(value);
}

function isValidToken(value) {
  if (isPlaceholder(value)) return false;
  const s = String(value).trim();
  return s.length >= 50 && s.includes(".");
}

function scoreChecks(checks) {
  const total = checks.length;
  const passed = checks.filter((c) => c.ok).length;

  if (total === 0) {
    return { status: "done", subtitle: "Ready", passed: 0, total: 0 };
  }

  if (passed === 0) {
    const hint = checks.find((c) => !c.ok)?.hint ?? "Not configured yet";
    return { status: "todo", subtitle: hint, passed, total };
  }

  if (passed === total) {
    return { status: "done", subtitle: "Configured and ready", passed, total };
  }

  const next = checks.find((c) => !c.ok);
  return {
    status: "progress",
    subtitle: next?.hint ?? `${passed} of ${total} steps complete`,
    passed,
    total,
  };
}

function evaluateTickets(supportbot, ticketPanel) {
  const ticket = supportbot?.Ticket ?? {};
  const ticketType = String(ticket.TicketType || "channels").toLowerCase();

  return scoreChecks([
    {
      ok: ticketPanel?.Panel === true,
      hint: "Enable the ticket panel",
    },
    {
      ok: isConfiguredId(ticket.TicketHome),
      hint: "Set TicketHome channel ID",
    },
    {
      ok:
        ticketType !== "channels" ||
        isConfiguredId(ticket.TicketChannelsCategory),
      hint: "Set ticket category ID",
    },
    {
      ok: !isPlaceholder(ticketPanel?.Button?.Text),
      hint: "Configure panel button text",
    },
  ]);
}

function evaluateSupportbot(supportbot) {
  const roles = supportbot?.Roles?.StaffMember ?? {};
  const welcome = supportbot?.Welcome ?? {};

  return scoreChecks([
    { ok: isValidToken(supportbot?.General?.Token), hint: "Add your bot token" },
    {
      ok:
        isConfiguredId(roles.Staff) ||
        isConfiguredId(roles.Admin) ||
        isConfiguredId(roles.Moderator),
      hint: "Set staff role IDs",
    },
    {
      ok: !welcome.Enabled || isConfiguredId(welcome.Channel),
      hint: "Set welcome channel ID",
    },
    {
      ok: !isPlaceholder(supportbot?.Activity?.Status),
      hint: "Set bot activity status",
    },
  ]);
}

function evaluateTranscripts(supportbot, transcriptCount) {
  const ticketReady = isConfiguredId(supportbot?.Ticket?.TicketHome);

  if (!ticketReady) {
    return {
      status: "todo",
      subtitle: "Set up tickets first",
      passed: 0,
      total: 2,
    };
  }

  if (transcriptCount > 0) {
    return {
      status: "done",
      subtitle: `${transcriptCount} transcript${transcriptCount === 1 ? "" : "s"} saved`,
      passed: 2,
      total: 2,
    };
  }

  return {
    status: "progress",
    subtitle: "Close tickets to generate transcripts",
    passed: 1,
    total: 2,
  };
}

function evaluateSuggestions(supportbot) {
  const sug = supportbot?.Suggestions ?? {};
  const mode = String(sug.Mode || "Channel").toLowerCase();

  const channelOk =
    mode === "forum"
      ? isConfiguredId(sug.ForumChannel)
      : isConfiguredId(sug.Channel);

  return scoreChecks([
    {
      ok: channelOk,
      hint:
        mode === "forum"
          ? "Set suggestions forum channel"
          : "Set suggestions channel ID",
    },
    {
      ok: !isPlaceholder(sug.UpvoteEmoji) && !isPlaceholder(sug.DownvoteEmoji),
      hint: "Configure voting emojis",
    },
  ]);
}

function evaluateAi(supportbotAi) {
  if (supportbotAi?.Enabled !== true) {
    return {
      status: "progress",
      subtitle: "AI is disabled in config",
      passed: 0,
      total: 3,
    };
  }

  return scoreChecks([
    {
      ok: !isPlaceholder(supportbotAi?.General?.Model_API_Key),
      hint: "Add your model API key",
    },
    {
      ok: isConfiguredId(supportbotAi?.Channels?.AIChannel),
      hint: "Set AI channel ID",
    },
    {
      ok: !isPlaceholder(supportbotAi?.General?.Model),
      hint: "Choose an AI model",
    },
  ]);
}

function evaluateCommands(commands) {
  const entries = Object.entries(commands || {}).filter(
    ([, v]) => v && typeof v === "object" && "Enabled" in v,
  );

  if (!entries.length) {
    return { status: "todo", subtitle: "No commands configured", passed: 0, total: 0 };
  }

  const enabled = entries.filter(([, v]) => v.Enabled !== false).length;
  const total = entries.length;
  const ratio = enabled / total;

  if (ratio >= 0.85) {
    return {
      status: "done",
      subtitle: `${enabled} of ${total} commands enabled`,
      passed: enabled,
      total,
    };
  }

  if (enabled === 0) {
    return {
      status: "todo",
      subtitle: "Enable slash commands",
      passed: 0,
      total,
    };
  }

  return {
    status: "progress",
    subtitle: `${enabled} of ${total} commands enabled`,
    passed: enabled,
    total,
  };
}

function countTranscripts() {
  const dir = path.resolve(__dirname, "../Data/Transcripts");
  if (!fs.existsSync(dir)) return 0;
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith("-transcript.html")).length;
}

function evaluateAllModules(configStore, options = {}) {
  const supportbot = configStore.supportbot;
  const ticketPanel = configStore.ticketPanel;
  const supportbotAi = configStore.supportbotAi;
  const commands = configStore.commands;
  const transcriptCount =
    options.transcriptCount ?? countTranscripts();

  return {
    tickets: evaluateTickets(supportbot, ticketPanel),
    supportbot: evaluateSupportbot(supportbot),
    transcripts: evaluateTranscripts(supportbot, transcriptCount),
    suggestions: evaluateSuggestions(supportbot),
    ai: evaluateAi(supportbotAi),
    commands: evaluateCommands(commands),
  };
}

module.exports = {
  evaluateAllModules,
  isPlaceholder,
  isConfiguredId,
};
