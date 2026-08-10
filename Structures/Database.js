// SupportBot | Unified SQL Database Adapter (MySQL/MariaDB & SQLite)
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const CONFIG_PATH = path.join(__dirname, "../Configs/supportbot.yml");
const LEGACY_JSON_PATH = path.join(__dirname, "../Data/supportbot.json");
const SQLITE_DB_PATH = path.join(__dirname, "../Data/supportbot.db");

// Load config
let dbConfig = { Driver: "sqlite", MySQL: {}, SQLite: { File: "./Data/supportbot.db" } };
try {
  if (fs.existsSync(CONFIG_PATH)) {
    const rawYaml = fs.readFileSync(CONFIG_PATH, "utf8");
    const parsed = yaml.load(rawYaml);
    if (parsed && parsed.Database) {
      dbConfig = parsed.Database;
    }
  }
} catch (e) {
  console.warn("[Database] Warning: Failed to parse Database section in supportbot.yml, defaulting to SQLite.");
}

const driver = String(dbConfig.Driver || "sqlite").toLowerCase();
const isMySQL = driver === "mysql" || driver === "mariadb";

let sqliteDb = null;
let mysqlPool = null;
let mysqlReady = false;
const mysqlWriteQueue = [];

// In-memory state cache for synchronous, high-performance reads
const state = {
  tickets: {},
  ticket_panel: [],
  ticket_users: {},
  profiles: {},
  settings: {},
  blacklisted_users: {},
};

// ----------------------------------------------------
// Database Initialization
// ----------------------------------------------------
function initDatabase() {
  if (isMySQL) {
    initMySQL();
  } else {
    initSQLite();
  }
  migrateLegacyJSON();
}

function initSQLite() {
  const Database = require("better-sqlite3");
  const dbDir = path.dirname(SQLITE_DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqliteDb = new Database(SQLITE_DB_PATH);
  sqliteDb.pragma("journal_mode = WAL");

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      ticket_id TEXT PRIMARY KEY,
      user_id TEXT,
      subject TEXT,
      description TEXT,
      department TEXT,
      priority TEXT,
      status TEXT,
      ai_mode_enabled INTEGER DEFAULT 0,
      ai_channel_id TEXT,
      ai_type TEXT,
      ai_enabled_by TEXT,
      ai_enabled_at INTEGER,
      question_answers TEXT,
      ticket_name TEXT,
      ticket_number TEXT,
      voice_channel_id TEXT,
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS ticket_panels (
      id INTEGER PRIMARY KEY,
      message_id TEXT,
      channel_id TEXT,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS ticket_users (
      ticket_id TEXT,
      user_id TEXT,
      PRIMARY KEY (ticket_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      bio TEXT DEFAULT '',
      timezone TEXT DEFAULT '',
      clocked_in INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT
    );

    CREATE TABLE IF NOT EXISTS blacklisted_users (
      user_id TEXT PRIMARY KEY,
      reason TEXT,
      added_by TEXT,
      created_at INTEGER
    );
  `);

  loadSQLiteState();
  const clr = { reset: "\x1b[0m", gray: "\x1b[90m", green: "\x1b[32m", white: "\x1b[37m" };
  console.log(`${clr.green}✓${clr.reset} ${clr.white}Database Connected${clr.reset} ${clr.gray}to SQLite (${SQLITE_DB_PATH})${clr.reset}`);
}

function loadSQLiteState() {
  const tickets = sqliteDb.prepare("SELECT * FROM tickets").all();
  for (const r of tickets) {
    state.tickets[r.ticket_id] = {
      ticket_id: r.ticket_id,
      user_id: r.user_id,
      subject: r.subject || "",
      description: r.description || "",
      department: r.department || "general",
      priority: r.priority || "medium",
      status: r.status || "open",
      aiModeEnabled: r.ai_mode_enabled,
      aiChannelId: r.ai_channel_id,
      aiType: r.ai_type,
      aiEnabledBy: r.ai_enabled_by,
      aiEnabledAt: r.ai_enabled_at,
      questionAnswers: r.question_answers || "[]",
      ticketName: r.ticket_name,
      ticketNumber: r.ticket_number,
      voiceChannelId: r.voice_channel_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  const panels = sqliteDb.prepare("SELECT * FROM ticket_panels ORDER BY id ASC").all();
  state.ticket_panel = panels.map((p) => ({
    id: p.id,
    message_id: p.message_id,
    channel_id: p.channel_id,
    created_at: p.created_at,
  }));

  const ticketUsers = sqliteDb.prepare("SELECT * FROM ticket_users").all();
  for (const tu of ticketUsers) {
    state.ticket_users[tu.ticket_id] = state.ticket_users[tu.ticket_id] || [];
    if (!state.ticket_users[tu.ticket_id].includes(tu.user_id)) {
      state.ticket_users[tu.ticket_id].push(tu.user_id);
    }
  }

  const profiles = sqliteDb.prepare("SELECT * FROM profiles").all();
  for (const p of profiles) {
    state.profiles[p.user_id] = {
      user_id: p.user_id,
      bio: p.bio || "",
      timezone: p.timezone || "",
      clockedIn: p.clocked_in,
    };
  }

  const settings = sqliteDb.prepare("SELECT * FROM settings").all();
  for (const s of settings) {
    try {
      state.settings[s.setting_key] = JSON.parse(s.setting_value);
    } catch {
      state.settings[s.setting_key] = s.setting_value;
    }
  }

  const blacklisted = sqliteDb.prepare("SELECT * FROM blacklisted_users").all();
  for (const b of blacklisted) {
    state.blacklisted_users[b.user_id] = {
      user_id: b.user_id,
      reason: b.reason || "",
      added_by: b.added_by || "",
      created_at: b.created_at,
    };
  }
}

function initMySQL() {
  const mysql = require("mysql2");
  const mysqlOpts = dbConfig.MySQL || {};

  mysqlPool = mysql.createPool({
    host: mysqlOpts.Host || "127.0.0.1",
    port: mysqlOpts.Port || 3306,
    user: mysqlOpts.User || "supportbot",
    password: mysqlOpts.Password || "",
    database: mysqlOpts.Database || "supportbot",
    connectionLimit: mysqlOpts.ConnectionLimit || 10,
    waitForConnections: true,
  });

  const poolPromise = mysqlPool.promise();

  (async () => {
    try {
      await poolPromise.query(`
        CREATE TABLE IF NOT EXISTS tickets (
          ticket_id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255),
          subject TEXT,
          description TEXT,
          department VARCHAR(255),
          priority VARCHAR(255),
          status VARCHAR(255),
          ai_mode_enabled INT DEFAULT 0,
          ai_channel_id VARCHAR(255),
          ai_type VARCHAR(255),
          ai_enabled_by VARCHAR(255),
          ai_enabled_at BIGINT,
          question_answers TEXT,
          ticket_name VARCHAR(255),
          ticket_number VARCHAR(255),
          voice_channel_id VARCHAR(255),
          created_at BIGINT,
          updated_at BIGINT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await poolPromise.query(`
        CREATE TABLE IF NOT EXISTS ticket_panels (
          id BIGINT PRIMARY KEY,
          message_id VARCHAR(255),
          channel_id VARCHAR(255),
          created_at BIGINT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await poolPromise.query(`
        CREATE TABLE IF NOT EXISTS ticket_users (
          ticket_id VARCHAR(255),
          user_id VARCHAR(255),
          PRIMARY KEY (ticket_id, user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await poolPromise.query(`
        CREATE TABLE IF NOT EXISTS profiles (
          user_id VARCHAR(255) PRIMARY KEY,
          bio TEXT,
          timezone VARCHAR(255),
          clocked_in INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await poolPromise.query(`
        CREATE TABLE IF NOT EXISTS settings (
          setting_key VARCHAR(255) PRIMARY KEY,
          setting_value LONGTEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await poolPromise.query(`
        CREATE TABLE IF NOT EXISTS blacklisted_users (
          user_id VARCHAR(255) PRIMARY KEY,
          reason TEXT,
          added_by VARCHAR(255),
          created_at BIGINT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Load initial state from MySQL
      const [tickets] = await poolPromise.query("SELECT * FROM tickets");
      for (const r of tickets) {
        state.tickets[r.ticket_id] = {
          ticket_id: r.ticket_id,
          user_id: r.user_id,
          subject: r.subject || "",
          description: r.description || "",
          department: r.department || "general",
          priority: r.priority || "medium",
          status: r.status || "open",
          aiModeEnabled: r.ai_mode_enabled,
          aiChannelId: r.ai_channel_id,
          aiType: r.ai_type,
          aiEnabledBy: r.ai_enabled_by,
          aiEnabledAt: r.ai_enabled_at,
          questionAnswers: r.question_answers || "[]",
          ticketName: r.ticket_name,
          ticketNumber: r.ticket_number,
          voiceChannelId: r.voice_channel_id,
          created_at: Number(r.created_at),
          updated_at: Number(r.updated_at),
        };
      }

      const [panels] = await poolPromise.query("SELECT * FROM ticket_panels ORDER BY id ASC");
      state.ticket_panel = panels.map((p) => ({
        id: Number(p.id),
        message_id: p.message_id,
        channel_id: p.channel_id,
        created_at: Number(p.created_at),
      }));

      const [ticketUsers] = await poolPromise.query("SELECT * FROM ticket_users");
      for (const tu of ticketUsers) {
        state.ticket_users[tu.ticket_id] = state.ticket_users[tu.ticket_id] || [];
        if (!state.ticket_users[tu.ticket_id].includes(tu.user_id)) {
          state.ticket_users[tu.ticket_id].push(tu.user_id);
        }
      }

      const [profiles] = await poolPromise.query("SELECT * FROM profiles");
      for (const p of profiles) {
        state.profiles[p.user_id] = {
          user_id: p.user_id,
          bio: p.bio || "",
          timezone: p.timezone || "",
          clockedIn: p.clocked_in,
        };
      }

      const [settings] = await poolPromise.query("SELECT * FROM settings");
      for (const s of settings) {
        try {
          state.settings[s.setting_key] = JSON.parse(s.setting_value);
        } catch {
          state.settings[s.setting_key] = s.setting_value;
        }
      }

      const [blacklisted] = await poolPromise.query("SELECT * FROM blacklisted_users");
      for (const b of blacklisted) {
        state.blacklisted_users[b.user_id] = {
          user_id: b.user_id,
          reason: b.reason || "",
          added_by: b.added_by || "",
          created_at: Number(b.created_at),
        };
      }

      mysqlReady = true;
      const clr = { reset: "\x1b[0m", gray: "\x1b[90m", green: "\x1b[32m", white: "\x1b[37m" };
      console.log(`${clr.green}✓${clr.reset} ${clr.white}Database Connected${clr.reset} ${clr.gray}to MySQL (${mysqlOpts.Host}:${mysqlOpts.Port}/${mysqlOpts.Database})${clr.reset}`);

      while (mysqlWriteQueue.length > 0) {
        const fn = mysqlWriteQueue.shift();
        try { fn(); } catch (e) {}
      }
    } catch (err) {
      console.error("[Database] Error initializing MySQL tables or state:", err.message);
    }
  })();
}

// ----------------------------------------------------
// Legacy JSON Migration Utility
// ----------------------------------------------------
function migrateLegacyJSON() {
  if (!fs.existsSync(LEGACY_JSON_PATH)) return;

  try {
    const raw = fs.readFileSync(LEGACY_JSON_PATH, "utf8");
    const jsonState = JSON.parse(raw);
    console.log("[Database] Legacy supportbot.json detected. Migrating records to SQL...");

    if (jsonState.tickets) {
      for (const tId of Object.keys(jsonState.tickets)) {
        const t = jsonState.tickets[tId];
        if (t && !state.tickets[tId]) {
          const ticketObj = {
            id: t.ticket_id || tId,
            user: t.user_id,
            reason: t.subject,
            description: t.description,
            department: t.department,
            priority: t.priority,
            aiModeEnabled: t.aiModeEnabled,
            aiChannelId: t.aiChannelId,
            aiType: t.aiType,
            aiEnabledBy: t.aiEnabledBy,
            aiEnabledAt: t.aiEnabledAt,
            questionAnswers: typeof t.questionAnswers === "string" ? JSON.parse(t.questionAnswers) : t.questionAnswers || [],
            name: t.ticketName,
            number: t.ticketNumber,
          };
          exportsModule.addTicket(ticketObj);
        }
      }
    }

    if (jsonState.ticket_panel && Array.isArray(jsonState.ticket_panel)) {
      for (const p of jsonState.ticket_panel) {
        exportsModule.saveTicketPanel(p.message_id, p.channel_id);
      }
    }

    if (jsonState.profiles) {
      for (const uId of Object.keys(jsonState.profiles)) {
        const prof = jsonState.profiles[uId];
        if (prof) {
          state.profiles[uId] = prof;
          persistProfile(uId);
        }
      }
    }

    if (jsonState.settings) {
      exportsModule.saveSettings(jsonState.settings);
    }

    // Archive legacy json file
    const backupPath = LEGACY_JSON_PATH + ".bak";
    fs.renameSync(LEGACY_JSON_PATH, backupPath);
    console.log(`[Database] Legacy supportbot.json successfully migrated and archived to ${backupPath}`);
  } catch (e) {
    console.error("[Database] Failed to migrate legacy supportbot.json:", e);
  }

  // Migrate legacy BlacklistedUsers.json if present
  const legacyBlacklistPath = path.join(__dirname, "../Data/BlacklistedUsers.json");
  if (fs.existsSync(legacyBlacklistPath)) {
    try {
      const raw = fs.readFileSync(legacyBlacklistPath, "utf8");
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.blacklistedUsers)) {
        for (const uId of data.blacklistedUsers) {
          exportsModule.addBlacklistedUser(uId, "Migrated from BlacklistedUsers.json", "System");
        }
      }
      fs.renameSync(legacyBlacklistPath, legacyBlacklistPath + ".bak");
      console.log(`[Database] Legacy BlacklistedUsers.json successfully migrated and archived.`);
    } catch (e) {
      console.error("[Database] Failed to migrate BlacklistedUsers.json:", e);
    }
  }
}

// ----------------------------------------------------
// SQL Persistence Helpers
// ----------------------------------------------------
function persistTicket(ticketId) {
  const t = state.tickets[ticketId];
  if (!t) return;

  if (isMySQL && mysqlPool) {
    const sql = `
      INSERT INTO tickets (
        ticket_id, user_id, subject, description, department, priority, status,
        ai_mode_enabled, ai_channel_id, ai_type, ai_enabled_by, ai_enabled_at,
        question_answers, ticket_name, ticket_number, voice_channel_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        user_id=VALUES(user_id), subject=VALUES(subject), description=VALUES(description),
        department=VALUES(department), priority=VALUES(priority), status=VALUES(status),
        ai_mode_enabled=VALUES(ai_mode_enabled), ai_channel_id=VALUES(ai_channel_id),
        ai_type=VALUES(ai_type), ai_enabled_by=VALUES(ai_enabled_by), ai_enabled_at=VALUES(ai_enabled_at),
        question_answers=VALUES(question_answers), ticket_name=VALUES(ticket_name),
        ticket_number=VALUES(ticket_number), voice_channel_id=VALUES(voice_channel_id), updated_at=VALUES(updated_at);
    `;
    const params = [
      t.ticket_id,
      t.user_id || "",
      t.subject || "",
      t.description || "",
      t.department || "general",
      t.priority || "medium",
      t.status || "open",
      t.aiModeEnabled ? 1 : 0,
      t.aiChannelId || null,
      t.aiType || null,
      t.aiEnabledBy || null,
      t.aiEnabledAt || null,
      typeof t.questionAnswers === "string" ? t.questionAnswers : JSON.stringify(t.questionAnswers || []),
      t.ticketName || null,
      t.ticketNumber || null,
      t.voiceChannelId || null,
      t.created_at || Date.now(),
      t.updated_at || Date.now(),
    ];
    mysqlPool.query(sql, params, (err) => {
      if (err) console.error("[Database] MySQL persistTicket error:", err.message);
    });
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(`
      INSERT INTO tickets (
        ticket_id, user_id, subject, description, department, priority, status,
        ai_mode_enabled, ai_channel_id, ai_type, ai_enabled_by, ai_enabled_at,
        question_answers, ticket_name, ticket_number, voice_channel_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(ticket_id) DO UPDATE SET
        user_id=excluded.user_id, subject=excluded.subject, description=excluded.description,
        department=excluded.department, priority=excluded.priority, status=excluded.status,
        ai_mode_enabled=excluded.ai_mode_enabled, ai_channel_id=excluded.ai_channel_id,
        ai_type=excluded.ai_type, ai_enabled_by=excluded.ai_enabled_by, ai_enabled_at=excluded.ai_enabled_at,
        question_answers=excluded.question_answers, ticket_name=excluded.ticket_name,
        ticket_number=excluded.ticket_number, voice_channel_id=excluded.voice_channel_id, updated_at=excluded.updated_at;
    `);
    stmt.run(
      t.ticket_id,
      t.user_id || "",
      t.subject || "",
      t.description || "",
      t.department || "general",
      t.priority || "medium",
      t.status || "open",
      t.aiModeEnabled ? 1 : 0,
      t.aiChannelId || null,
      t.aiType || null,
      t.aiEnabledBy || null,
      t.aiEnabledAt || null,
      typeof t.questionAnswers === "string" ? t.questionAnswers : JSON.stringify(t.questionAnswers || []),
      t.ticketName || null,
      t.ticketNumber || null,
      t.voiceChannelId || null,
      t.created_at || Date.now(),
      t.updated_at || Date.now()
    );
  }
}

function persistPanel(panelRow) {
  if (isMySQL && mysqlPool) {
    mysqlPool.query(
      "INSERT INTO ticket_panels (id, message_id, channel_id, created_at) VALUES (?, ?, ?, ?)",
      [panelRow.id, panelRow.message_id, panelRow.channel_id, panelRow.created_at],
      (err) => {
        if (err) console.error("[Database] MySQL persistPanel error:", err.message);
      }
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare("INSERT INTO ticket_panels (id, message_id, channel_id, created_at) VALUES (?, ?, ?, ?)");
    stmt.run(panelRow.id, panelRow.message_id, panelRow.channel_id, panelRow.created_at);
  }
}

function persistTicketUser(ticketId, userId, action = "add") {
  if (action === "add") {
    if (isMySQL && mysqlPool) {
      mysqlPool.query("INSERT IGNORE INTO ticket_users (ticket_id, user_id) VALUES (?, ?)", [ticketId, userId], (err) => {
        if (err) console.error("[Database] MySQL persistTicketUser error:", err.message);
      });
    } else if (sqliteDb) {
      sqliteDb.prepare("INSERT OR IGNORE INTO ticket_users (ticket_id, user_id) VALUES (?, ?)").run(ticketId, userId);
    }
  } else {
    if (isMySQL && mysqlPool) {
      mysqlPool.query("DELETE FROM ticket_users WHERE ticket_id = ? AND user_id = ?", [ticketId, userId], (err) => {
        if (err) console.error("[Database] MySQL deleteTicketUser error:", err.message);
      });
    } else if (sqliteDb) {
      sqliteDb.prepare("DELETE FROM ticket_users WHERE ticket_id = ? AND user_id = ?").run(ticketId, userId);
    }
  }
}

function persistProfile(userId) {
  const p = state.profiles[userId];
  if (!p) return;

  if (isMySQL && mysqlPool) {
    const sql = `
      INSERT INTO profiles (user_id, bio, timezone, clocked_in) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE bio=VALUES(bio), timezone=VALUES(timezone), clocked_in=VALUES(clocked_in);
    `;
    mysqlPool.query(sql, [p.user_id, p.bio || "", p.timezone || "", p.clockedIn ? 1 : 0], (err) => {
      if (err) console.error("[Database] MySQL persistProfile error:", err.message);
    });
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(`
      INSERT INTO profiles (user_id, bio, timezone, clocked_in) VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET bio=excluded.bio, timezone=excluded.timezone, clocked_in=excluded.clocked_in;
    `);
    stmt.run(p.user_id, p.bio || "", p.timezone || "", p.clockedIn ? 1 : 0);
  }
}

function persistSettings() {
  const settingsObj = state.settings || {};
  for (const k of Object.keys(settingsObj)) {
    const val = JSON.stringify(settingsObj[k]);
    if (isMySQL && mysqlPool) {
      mysqlPool.query(
        "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)",
        [k, val],
        (err) => {
          if (err) console.error("[Database] MySQL persistSettings error:", err.message);
        }
      );
    } else if (sqliteDb) {
      sqliteDb.prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value").run(k, val);
    }
  }
}

function persistBlacklistedUser(userId, action = "add") {
  if (isMySQL && !mysqlReady) {
    mysqlWriteQueue.push(() => persistBlacklistedUser(userId, action));
    return;
  }
  const b = state.blacklisted_users[userId];
  if (action === "add" && b) {
    if (isMySQL && mysqlPool) {
      const sql = `
        INSERT INTO blacklisted_users (user_id, reason, added_by, created_at) VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE reason=VALUES(reason), added_by=VALUES(added_by), created_at=VALUES(created_at);
      `;
      mysqlPool.query(sql, [b.user_id, b.reason || "", b.added_by || "", b.created_at || Date.now()], (err) => {
        if (err) console.error("[Database] MySQL persistBlacklistedUser error:", err.message);
      });
    } else if (sqliteDb) {
      const stmt = sqliteDb.prepare(`
        INSERT INTO blacklisted_users (user_id, reason, added_by, created_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET reason=excluded.reason, added_by=excluded.added_by, created_at=excluded.created_at;
      `);
      stmt.run(b.user_id, b.reason || "", b.added_by || "", b.created_at || Date.now());
    }
  } else {
    if (isMySQL && mysqlPool) {
      mysqlPool.query("DELETE FROM blacklisted_users WHERE user_id = ?", [userId], (err) => {
        if (err) console.error("[Database] MySQL removeBlacklistedUser error:", err.message);
      });
    } else if (sqliteDb) {
      sqliteDb.prepare("DELETE FROM blacklisted_users WHERE user_id = ?").run(userId);
    }
  }
}

function ensureProfile(userId) {
  if (!state.profiles[userId]) {
    state.profiles[userId] = { user_id: userId, bio: "", timezone: "", clockedIn: 0 };
    persistProfile(userId);
  }
}

function normaliseTicketRow(row) {
  if (!row) return null;
  let questionAnswers = [];
  if (row.questionAnswers) {
    try {
      questionAnswers = typeof row.questionAnswers === "string" ? JSON.parse(row.questionAnswers) : row.questionAnswers;
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

const exportsModule = {
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

    persistTicket(id);

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
    persistTicket(ticketId);
  },

  updateTicketVoice(ticketId, voiceChannelId) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.voiceChannelId = voiceChannelId;
    t.updated_at = Date.now();
    persistTicket(ticketId);
  },

  updateTicketStatus(ticketId, status) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.status = status;
    t.updated_at = Date.now();
    persistTicket(ticketId);

    if (global.apiServer && status === "closed") {
      global.apiServer.broadcast("ticket_closed", { ticket_id: ticketId });
    }
  },

  updateTicketDepartment(ticketId, department) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.department = department;
    t.updated_at = Date.now();
    persistTicket(ticketId);
  },

  updateTicketPriority(ticketId, priority) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.priority = priority;
    t.updated_at = Date.now();
    persistTicket(ticketId);
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
    persistTicket(ticketId);
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
    persistTicket(ticketId);
  },

  disableTicketAI(ticketId) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.aiModeEnabled = 0;
    t.updated_at = Date.now();
    persistTicket(ticketId);
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
    const row = { id: Date.now(), message_id: messageId, channel_id: channelId, created_at: Date.now() };
    state.ticket_panel.push(row);
    persistPanel(row);
  },

  getTicketPanel() {
    const arr = state.ticket_panel;
    if (!arr || arr.length === 0) return null;
    return arr[arr.length - 1];
  },

  addUserToTicket(ticketId, userId) {
    state.ticket_users[ticketId] = state.ticket_users[ticketId] || [];
    if (!state.ticket_users[ticketId].includes(userId)) {
      state.ticket_users[ticketId].push(userId);
      persistTicketUser(ticketId, userId, "add");
    }
  },

  removeUserFromTicket(ticketId, userId) {
    if (state.ticket_users[ticketId]) {
      state.ticket_users[ticketId] = state.ticket_users[ticketId].filter((u) => u !== userId);
      persistTicketUser(ticketId, userId, "remove");
    }
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
    persistProfile(userId);
  },

  saveSettings(obj) {
    state.settings = obj || {};
    persistSettings();
  },

  addBlacklistedUser(userId, reason = "", addedBy = "") {
    state.blacklisted_users[userId] = {
      user_id: userId,
      reason,
      added_by: addedBy,
      created_at: Date.now(),
    };
    persistBlacklistedUser(userId, "add");
  },

  removeBlacklistedUser(userId) {
    if (state.blacklisted_users[userId]) {
      delete state.blacklisted_users[userId];
      persistBlacklistedUser(userId, "remove");
    }
  },

  isUserBlacklisted(userId) {
    return Boolean(state.blacklisted_users[userId]);
  },

  getBlacklistedUsers() {
    return Object.keys(state.blacklisted_users);
  },

  getBlacklistedUserDetails() {
    return Object.values(state.blacklisted_users);
  },

  getDatabaseInfo() {
    if (isMySQL) {
      const mysqlOpts = dbConfig.MySQL || {};
      return {
        driver: "MySQL",
        host: mysqlOpts.Host || "127.0.0.1",
        port: mysqlOpts.Port || 3306,
        database: mysqlOpts.Database || "supportbot",
        type: "mysql"
      };
    }
    const sqliteOpts = dbConfig.SQLite || {};
    return {
      driver: "SQLite",
      file: sqliteOpts.File || "./Data/supportbot.db",
      type: "sqlite"
    };
  },
};

// Initialize database on require
initDatabase();

module.exports = exportsModule;
