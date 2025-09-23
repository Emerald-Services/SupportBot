// SupportBot | Emerald Services
// Database Structure

const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "../Data/supportbot.db"));

db.prepare(`
  CREATE TABLE IF NOT EXISTS suggestions (
    thread_id TEXT PRIMARY KEY,
    author_id TEXT,
    text      TEXT,
    status    TEXT DEFAULT 'Created'
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS profiles (
    user_id   TEXT PRIMARY KEY,
    bio       TEXT,
    timezone  TEXT,
    clockedIn INTEGER DEFAULT 0
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS tickets (
    ticket_id      TEXT PRIMARY KEY,
    user_id        TEXT,
    status         TEXT DEFAULT 'open',
    created_at     INTEGER,
    updated_at     INTEGER,
    subject        TEXT,
    description    TEXT
  )
`).run();

try {
  db.prepare("ALTER TABLE tickets ADD COLUMN voiceChannelId TEXT").run();
} catch (e) {
  if (!String(e).includes("duplicate column name")) {
    throw e;
  }
}

db.prepare(`
  CREATE TABLE IF NOT EXISTS ticket_panel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT,
    channel_id TEXT,
    created_at INTEGER
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS ticket_users (
    ticket_id TEXT,
    user_id   TEXT,
    PRIMARY KEY(ticket_id, user_id)
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS settings (
    id   INTEGER PRIMARY KEY,
    data TEXT
  )
`).run();

module.exports = {
  addSuggestion(threadId, authorId, text) {
    db.prepare(`
      INSERT INTO suggestions (thread_id, author_id, text)
      VALUES (@threadId, @authorId, @text)
      ON CONFLICT(thread_id) DO NOTHING
    `).run({ threadId, authorId, text });
  },

  setSuggestionStatus(threadId, status) {
    db.prepare(`
      UPDATE suggestions SET status=@status WHERE thread_id=@threadId
    `).run({ threadId, status });
  },

  getSuggestion(threadId) {
    return db.prepare(`
      SELECT * FROM suggestions WHERE thread_id=@threadId
    `).get({ threadId });
  },

  // ----- Profiles -----
  getProfile(userId) {
    const row = db.prepare(`SELECT * FROM profiles WHERE user_id=?`).get(userId);
    if (!row) {
      db.prepare(`
        INSERT INTO profiles (user_id, bio, timezone, clockedIn)
        VALUES (?, '', '', 0)
      `).run(userId);
      return { user_id: userId, bio: "", timezone: "", clockedIn: 0 };
    }
    return row;
  },

  updateProfile(userId, data) {
    const { bio = "", timezone = "", clockedIn = 0 } = data;
    db.prepare(`
      INSERT INTO profiles (user_id, bio, timezone, clockedIn)
      VALUES (@userId, @bio, @timezone, @clockedIn)
      ON CONFLICT(user_id) DO UPDATE SET
        bio       = excluded.bio,
        timezone  = excluded.timezone,
        clockedIn = excluded.clockedIn
    `).run({ userId, bio, timezone, clockedIn });
  },

  setClockedIn(userId, value) {
    db.prepare(`UPDATE profiles SET clockedIn=? WHERE user_id=?`)
      .run(value ? 1 : 0, userId);
  },

  addTicket(ticket) {
    const now = Date.now();
    db.prepare(`
      INSERT INTO tickets (ticket_id, user_id, subject, description, created_at, updated_at)
      VALUES (@ticket_id, @user_id, @subject, @description, @created_at, @updated_at)
      ON CONFLICT(ticket_id) DO NOTHING
    `).run({
      ticket_id: ticket.id,
      user_id: ticket.user,
      subject: ticket.reason || "",
      description: ticket.description || "",
      created_at: now,
      updated_at: now
    });
  },

  updateTicketVoice(ticketId, voiceChannelId) {
    db.prepare(`
      UPDATE tickets SET voiceChannelId=@voiceChannelId, updated_at=@updatedAt WHERE ticket_id=@ticketId
    `).run({ ticketId, voiceChannelId, updatedAt: Date.now() });
  },

  getTicketVoice(ticketId) {
    return db.prepare(`SELECT voiceChannelId FROM tickets WHERE ticket_id=?`).get(ticketId);
  },

  deleteTicketVoice(ticketId) {
    db.prepare(`
      UPDATE tickets SET voiceChannelId=NULL, updated_at=@updatedAt WHERE ticket_id=@ticketId
    `).run({ ticketId, updatedAt: Date.now() });
  },

  updateTicketStatus(ticketId, status) {
    db.prepare(`
      UPDATE tickets SET status=@status, updated_at=@updatedAt WHERE ticket_id=@ticketId
    `).run({ status, updatedAt: Date.now(), ticketId });
  },

  getTicket(ticketId) {
    return db.prepare(`
      SELECT * FROM tickets WHERE ticket_id=@ticketId
    `).get({ ticketId });
  },

  getAllTickets() {
    return db.prepare(`SELECT * FROM tickets`).all();
  },

  saveTicketPanel(messageId, channelId) {
    db.prepare(`
      INSERT INTO ticket_panel (message_id, channel_id, created_at)
      VALUES (@messageId, @channelId, @createdAt)
    `).run({ messageId, channelId, createdAt: Date.now() });
  },

  getTicketPanel() {
    return db.prepare(`
      SELECT * FROM ticket_panel ORDER BY id DESC LIMIT 1
    `).get();
  },

  addUserToTicket(ticketId, userId) {
    db.prepare(`
      INSERT INTO ticket_users (ticket_id, user_id)
      VALUES (?, ?)
      ON CONFLICT(ticket_id, user_id) DO NOTHING
    `).run(ticketId, userId);
  },

  removeUserFromTicket(ticketId, userId) {
    db.prepare(`
      DELETE FROM ticket_users WHERE ticket_id=? AND user_id=?
    `).run(ticketId, userId);
  },

  getTicketUsers(ticketId) {
    return db.prepare(`
      SELECT user_id FROM ticket_users WHERE ticket_id=?
    `).all(ticketId).map(r => r.user_id);
  },

  getSettings() {
    const row = db.prepare(`SELECT data FROM settings WHERE id=1`).get();
    if (!row) return {};
    try {
      return JSON.parse(row.data);
    } catch {
      return {};
    }
  },

  saveSettings(obj) {
    const data = JSON.stringify(obj);
    db.prepare(`
      INSERT INTO settings (id, data)
      VALUES (1, @data)
      ON CONFLICT(id) DO UPDATE SET data = excluded.data
    `).run({ data });
  }
};
