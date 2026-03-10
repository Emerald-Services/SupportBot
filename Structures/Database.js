// SupportBot | Emerald Services
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "../Data/supportbot.db"));

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS suggestions (
    thread_id TEXT PRIMARY KEY,
    author_id TEXT,
    text TEXT,
    status TEXT DEFAULT 'Created'
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    bio TEXT,
    timezone TEXT,
    clockedIn INTEGER DEFAULT 0
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS tickets (
    ticket_id TEXT PRIMARY KEY,
    user_id TEXT,
    status TEXT DEFAULT 'open',
    created_at INTEGER,
    updated_at INTEGER,
    subject TEXT,
    description TEXT
  )
`,
).run();

// Safe column upgrades
const safeAlter = (sql) => {
  try {
    db.prepare(sql).run();
  } catch (e) {
    if (!String(e).includes("duplicate column name")) throw e;
  }
};

safeAlter(`ALTER TABLE tickets ADD COLUMN voiceChannelId TEXT`);
safeAlter(`ALTER TABLE tickets ADD COLUMN department TEXT DEFAULT 'general'`);
safeAlter(`ALTER TABLE tickets ADD COLUMN priority TEXT DEFAULT 'medium'`);

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS ticket_panel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT,
    channel_id TEXT,
    created_at INTEGER
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS ticket_users (
    ticket_id TEXT,
    user_id TEXT,
    PRIMARY KEY(ticket_id, user_id)
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    data TEXT
  )
`,
).run();

function ensureProfile(userId) {
  const existing = db.prepare(`
    SELECT user_id FROM profiles WHERE user_id = ?
  `).get(userId);

  if (!existing) {
    db.prepare(`
      INSERT INTO profiles (user_id, bio, timezone, clockedIn)
      VALUES (?, '', '', 0)
    `).run(userId);
  }
}

module.exports = {
  addTicket(ticket) {
    const now = Date.now();

    db.prepare(
      `
      INSERT INTO tickets (
        ticket_id,
        user_id,
        subject,
        description,
        created_at,
        updated_at,
        department,
        priority
      )
      VALUES (
        @ticket_id,
        @user_id,
        @subject,
        @description,
        @created_at,
        @updated_at,
        @department,
        @priority
      )
      ON CONFLICT(ticket_id) DO NOTHING
    `,
    ).run({
      ticket_id: ticket.id,
      user_id: ticket.user,
      subject: ticket.reason || "",
      description: ticket.description || "",
      created_at: now,
      updated_at: now,
      department: ticket.department || "general",
      priority: ticket.priority || "medium",
    });
  },

  updateTicketVoice(ticketId, voiceChannelId) {
    db.prepare(
      `
      UPDATE tickets
      SET voiceChannelId=@voiceChannelId, updated_at=@updatedAt
      WHERE ticket_id=@ticketId
    `,
    ).run({
      ticketId,
      voiceChannelId,
      updatedAt: Date.now(),
    });
  },

  updateTicketStatus(ticketId, status) {
    db.prepare(
      `
      UPDATE tickets
      SET status=@status, updated_at=@updatedAt
      WHERE ticket_id=@ticketId
    `,
    ).run({
      status,
      updatedAt: Date.now(),
      ticketId,
    });
  },

  updateTicketDepartment(ticketId, department) {
    db.prepare(
      `
      UPDATE tickets
      SET department=@department, updated_at=@updatedAt
      WHERE ticket_id=@ticketId
    `,
    ).run({
      ticketId,
      department,
      updatedAt: Date.now(),
    });
  },

  updateTicketPriority(ticketId, priority) {
    db.prepare(
      `
      UPDATE tickets
      SET priority=@priority, updated_at=@updatedAt
      WHERE ticket_id=@ticketId
    `,
    ).run({
      ticketId,
      priority,
      updatedAt: Date.now(),
    });
  },

  getTicket(ticketId) {
    return db
      .prepare(
        `
      SELECT * FROM tickets WHERE ticket_id=@ticketId
    `,
      )
      .get({ ticketId });
  },

  getAllTickets() {
    return db.prepare(`SELECT * FROM tickets`).all();
  },

  saveTicketPanel(messageId, channelId) {
    db.prepare(
      `
      INSERT INTO ticket_panel (message_id, channel_id, created_at)
      VALUES (@messageId, @channelId, @createdAt)
    `,
    ).run({ messageId, channelId, createdAt: Date.now() });
  },

  getTicketPanel() {
    return db
      .prepare(
        `
      SELECT * FROM ticket_panel ORDER BY id DESC LIMIT 1
    `,
      )
      .get();
  },

  addUserToTicket(ticketId, userId) {
    db.prepare(
      `
      INSERT INTO ticket_users (ticket_id, user_id)
      VALUES (?, ?)
      ON CONFLICT(ticket_id, user_id) DO NOTHING
    `,
    ).run(ticketId, userId);
  },

  removeUserFromTicket(ticketId, userId) {
    db.prepare(
      `
      DELETE FROM ticket_users WHERE ticket_id=? AND user_id=?
    `,
    ).run(ticketId, userId);
  },

  getTicketUsers(ticketId) {
    return db
      .prepare(
        `
      SELECT user_id FROM ticket_users WHERE ticket_id=?
    `,
      )
      .all(ticketId)
      .map((r) => r.user_id);
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

  getProfile(userId) {
    ensureProfile(userId);

    const row = db.prepare(`
      SELECT * FROM profiles WHERE user_id = ?
    `).get(userId);

    if (!row) {
      return {
        user_id: userId,
        bio: "",
        timezone: "",
        clockedIn: false,
      };
    }

    return {
      ...row,
      clockedIn: Boolean(row.clockedIn),
    };
  },

  setClockedIn(userId, clockedIn) {
    ensureProfile(userId);

    db.prepare(`
      UPDATE profiles
      SET clockedIn = ?
      WHERE user_id = ?
    `).run(clockedIn ? 1 : 0, userId);
  },

  saveSettings(obj) {
    const data = JSON.stringify(obj);
    db.prepare(
      `
      INSERT INTO settings (id, data)
      VALUES (1, @data)
      ON CONFLICT(id) DO UPDATE SET data = excluded.data
    `,
    ).run({ data });
  },
};
