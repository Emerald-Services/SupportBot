// SupportBot | JSON fallback adapter for environments without native addons (Pterodactyl)
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../Data/supportbot.json");

function load() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return {
      suggestions: {},
      profiles: {},
      tickets: {},
      ticket_panel: [],
      ticket_users: {},
      settings: {},
    };
  }
}

function save(state) {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to persist database:", e);
  }
}

const state = load();

function ensureProfile(userId) {
  if (!state.profiles[userId]) {
    state.profiles[userId] = { user_id: userId, bio: "", timezone: "", clockedIn: 0 };
    save(state);
  }
}

function normaliseTicketRow(row) {
  if (!row) return null;
  let questionAnswers = [];
  if (row.questionAnswers) {
    try {
      questionAnswers = JSON.parse(row.questionAnswers);
    } catch {
      questionAnswers = [];
    }
  }

  return {
    ...row,
    aiModeEnabled: Boolean(row.aiModeEnabled),
    clockedIn: row.clockedIn !== undefined ? Boolean(row.clockedIn) : row.clockedIn,
    questionAnswers,
  };
}

module.exports = {
  addTicket(ticket) {
    const now = Date.now();
    const id = ticket.id;
    state.tickets[id] = state.tickets[id] || {};
    const existing = state.tickets[id];

    state.tickets[id] = {
      ticket_id: id,
      user_id: ticket.user,
      subject: ticket.reason || "",
      description: ticket.description || "",
      created_at: existing.created_at || now,
      updated_at: now,
      department: ticket.department || "general",
      priority: ticket.priority || "medium",
      aiModeEnabled: ticket.aiModeEnabled ? 1 : 0,
      aiChannelId: ticket.aiChannelId || null,
      aiType: ticket.aiType || null,
      aiEnabledBy: ticket.aiEnabledBy || null,
      aiEnabledAt: ticket.aiEnabledAt || null,
      questionAnswers: JSON.stringify(ticket.questionAnswers || []),
      ticketName: ticket.name || null,
      ticketNumber: ticket.number || null,
      status: existing.status || "open",
    };

    save(state);

    if (global.apiServer) {
      global.apiServer.broadcast("ticket_created", {
        ticket_id: id,
        user_id: ticket.user,
        subject: ticket.reason || "",
        description: ticket.description || "",
        department: ticket.department || "general",
        priority: ticket.priority || "medium",
        created_at: now,
      });
    }
  },

  updateTicketQuestionAnswers(ticketId, questionAnswers = []) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.questionAnswers = JSON.stringify(questionAnswers);
    t.updated_at = Date.now();
    save(state);
  },

  updateTicketVoice(ticketId, voiceChannelId) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.voiceChannelId = voiceChannelId;
    t.updated_at = Date.now();
    save(state);
  },

  updateTicketStatus(ticketId, status) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.status = status;
    t.updated_at = Date.now();
    save(state);

    if (global.apiServer && status === "closed") {
      global.apiServer.broadcast("ticket_closed", { ticket_id: ticketId });
    }
  },

  updateTicketDepartment(ticketId, department) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.department = department;
    t.updated_at = Date.now();
    save(state);
  },

  updateTicketPriority(ticketId, priority) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.priority = priority;
    t.updated_at = Date.now();
    save(state);
  },

  setTicketAIState(ticketId, aiState = {}) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.aiModeEnabled = aiState.enabled ? 1 : 0;
    t.aiChannelId = aiState.aiChannelId || null;
    t.aiType = aiState.aiType || null;
    t.aiEnabledBy = aiState.enabledBy || null;
    t.aiEnabledAt = aiState.enabledAt ? new Date(aiState.enabledAt).getTime() : aiState.enabled ? Date.now() : null;
    t.updated_at = Date.now();
    save(state);
  },

  enableTicketAI(ticketId, aiChannelId = null, aiType = null, enabledBy = null) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.aiModeEnabled = 1;
    t.aiChannelId = aiChannelId;
    t.aiType = aiType;
    t.aiEnabledBy = enabledBy;
    t.aiEnabledAt = Date.now();
    t.updated_at = Date.now();
    save(state);
  },

  disableTicketAI(ticketId) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.aiModeEnabled = 0;
    t.updated_at = Date.now();
    save(state);
  },

  getTicket(ticketId) {
    return normaliseTicketRow(state.tickets[ticketId]);
  },

  getTicketByAIChannel(aiChannelId) {
    const keys = Object.keys(state.tickets);
    for (const k of keys) {
      const t = state.tickets[k];
      if (t && t.aiChannelId === aiChannelId) return normaliseTicketRow(t);
    }
    return null;
  },

  getAllTickets() {
    return Object.values(state.tickets).map(normaliseTicketRow);
  },

  saveTicketPanel(messageId, channelId) {
    state.ticket_panel.push({ id: Date.now(), message_id: messageId, channel_id: channelId, created_at: Date.now() });
    save(state);
  },

  getTicketPanel() {
    const arr = state.ticket_panel;
    if (!arr || arr.length === 0) return null;
    return arr[arr.length - 1];
  },

  addUserToTicket(ticketId, userId) {
    state.ticket_users[ticketId] = state.ticket_users[ticketId] || new Set();
    // Sets cannot be serialized directly; store as array
    const arr = new Set(state.ticket_users[ticketId]);
    arr.add(userId);
    state.ticket_users[ticketId] = Array.from(arr);
    save(state);
  },

  removeUserFromTicket(ticketId, userId) {
    const arr = new Set(state.ticket_users[ticketId] || []);
    arr.delete(userId);
    state.ticket_users[ticketId] = Array.from(arr);
    save(state);
  },

  getTicketUsers(ticketId) {
    return (state.ticket_users[ticketId] || []).slice();
  },

  getSettings() {
    return state.settings || {};
  },

  getProfile(userId) {
    ensureProfile(userId);
    const row = state.profiles[userId];
    if (!row) return { user_id: userId, bio: "", timezone: "", clockedIn: false };
    return { ...row, clockedIn: Boolean(row.clockedIn) };
  },

  setClockedIn(userId, clockedIn) {
    ensureProfile(userId);
    state.profiles[userId].clockedIn = clockedIn ? 1 : 0;
    save(state);
  },

  saveSettings(obj) {
    state.settings = obj || {};
    save(state);
  },
};
