const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "../Data/ai-memory.db"));

db.pragma("journal_mode = WAL");

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS ai_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    channel_id TEXT,
    user_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS ai_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    channel_id TEXT,
    summary TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS ai_facts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    channel_id TEXT,
    user_id TEXT,
    fact_type TEXT NOT NULL,
    fact_key TEXT NOT NULL,
    fact_value TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS ai_knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type TEXT NOT NULL,
    source_name TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS ai_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    channel_id TEXT,
    user_id TEXT,
    model TEXT,
    mode TEXT,
    last_message_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`,
).run();

try {
  db.prepare(`ALTER TABLE ai_facts ADD COLUMN user_id TEXT`).run();
} catch (e) {
  if (!String(e).includes("duplicate column name")) throw e;
}

module.exports = {
  saveUserFact({ guildId, userId, factType, factKey, factValue }) {
    const existing = db
      .prepare(
        `
      SELECT id FROM ai_facts
      WHERE guild_id IS ? AND user_id IS ? AND fact_type = ? AND fact_key = ?
      LIMIT 1
    `,
      )
      .get(guildId || null, userId || null, factType, factKey);

    if (existing) {
      db.prepare(
        `
        UPDATE ai_facts
        SET fact_value = ?, updated_at = ?
        WHERE id = ?
      `,
      ).run(factValue, Date.now(), existing.id);
      return;
    }

    db.prepare(
      `
      INSERT INTO ai_facts (
        guild_id, channel_id, user_id, fact_type, fact_key, fact_value, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      guildId || null,
      null,
      userId || null,
      factType,
      factKey,
      factValue,
      Date.now(),
      Date.now(),
    );
  },

  getUserFacts(guildId, userId) {
    return db
      .prepare(
        `
      SELECT * FROM ai_facts
      WHERE guild_id IS ? AND user_id IS ?
      ORDER BY updated_at DESC
    `,
      )
      .all(guildId || null, userId || null);
  },

  getUserFactsByScope({ guildId = null, userId = null, scope = "guild" }) {
    if (!userId) return [];

    if (scope === "global") {
      return db
        .prepare(
          `
        SELECT * FROM ai_facts
        WHERE user_id IS ?
        ORDER BY updated_at DESC
      `,
        )
        .all(userId || null);
    }

    return db
      .prepare(
        `
      SELECT * FROM ai_facts
      WHERE guild_id IS ? AND user_id IS ?
      ORDER BY updated_at DESC
    `,
      )
      .all(guildId || null, userId || null);
  },

  addMessage({ guildId, channelId, userId, role, content }) {
    db.prepare(
      `
      INSERT INTO ai_conversations (
        guild_id, channel_id, user_id, role, content, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `,
    ).run(
      guildId || null,
      channelId || null,
      userId || null,
      role,
      content,
      Date.now(),
    );
  },

  getRecentMessages(channelId, limit = 15) {
    return db
      .prepare(
        `
      SELECT * FROM ai_conversations
      WHERE channel_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `,
      )
      .all(channelId, limit)
      .reverse();
  },

  getRecentMessagesByScope({ guildId = null, channelId = null, limit = 15, scope = "guild" }) {
    if (scope === "channel") {
      return db
        .prepare(
          `
        SELECT * FROM ai_conversations
        WHERE channel_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `,
        )
        .all(channelId || null, limit)
        .reverse();
    }

    if (scope === "global") {
      return db
        .prepare(
          `
        SELECT * FROM ai_conversations
        ORDER BY created_at DESC
        LIMIT ?
      `,
        )
        .all(limit)
        .reverse();
    }

    return db
      .prepare(
        `
      SELECT * FROM ai_conversations
      WHERE guild_id IS ?
      ORDER BY created_at DESC
      LIMIT ?
    `,
      )
      .all(guildId || null, limit)
      .reverse();
  },

  saveSummary({ guildId, channelId, summary }) {
    const existing = db
      .prepare(
        `
      SELECT id FROM ai_summaries
      WHERE guild_id IS ? AND channel_id IS ?
      ORDER BY updated_at DESC
      LIMIT 1
    `,
      )
      .get(guildId || null, channelId || null);

    if (existing) {
      db.prepare(
        `
        UPDATE ai_summaries
        SET summary = ?, updated_at = ?
        WHERE id = ?
      `,
      ).run(summary, Date.now(), existing.id);
      return;
    }

    db.prepare(
      `
      INSERT INTO ai_summaries (
        guild_id, channel_id, summary, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
    `,
    ).run(guildId || null, channelId || null, summary, Date.now(), Date.now());
  },

  getLatestSummary(channelId) {
    return db
      .prepare(
        `
      SELECT * FROM ai_summaries
      WHERE channel_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `,
      )
      .get(channelId);
  },

  getLatestSummaryByScope({ guildId = null, channelId = null, scope = "guild" }) {
    if (scope === "channel") {
      return db
        .prepare(
          `
        SELECT * FROM ai_summaries
        WHERE channel_id = ?
        ORDER BY updated_at DESC
        LIMIT 1
      `,
        )
        .get(channelId || null);
    }

    if (scope === "global") {
      return db
        .prepare(
          `
        SELECT * FROM ai_summaries
        ORDER BY updated_at DESC
        LIMIT 1
      `,
        )
        .get();
    }

    return db
      .prepare(
        `
      SELECT * FROM ai_summaries
      WHERE guild_id IS ?
      ORDER BY updated_at DESC
      LIMIT 1
    `,
      )
      .get(guildId || null);
  },

  saveFact({ guildId, channelId, factType, factKey, factValue }) {
    const existing = db
      .prepare(
        `
      SELECT id FROM ai_facts
      WHERE guild_id IS ? AND channel_id IS ? AND fact_type = ? AND fact_key = ?
      LIMIT 1
    `,
      )
      .get(guildId || null, channelId || null, factType, factKey);

    if (existing) {
      db.prepare(
        `
        UPDATE ai_facts
        SET fact_value = ?, updated_at = ?
        WHERE id = ?
      `,
      ).run(factValue, Date.now(), existing.id);
      return;
    }

    db.prepare(
      `
      INSERT INTO ai_facts (
        guild_id, channel_id, fact_type, fact_key, fact_value, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      guildId || null,
      channelId || null,
      factType,
      factKey,
      factValue,
      Date.now(),
      Date.now(),
    );
  },

  getFacts(channelId) {
    return db
      .prepare(
        `
      SELECT * FROM ai_facts
      WHERE channel_id = ?
      ORDER BY updated_at DESC
    `,
      )
      .all(channelId);
  },

  getFactsByScope({ guildId = null, channelId = null, scope = "guild" }) {
    if (scope === "channel") {
      return db
        .prepare(
          `
        SELECT * FROM ai_facts
        WHERE channel_id = ? AND user_id IS NULL
        ORDER BY updated_at DESC
      `,
        )
        .all(channelId || null);
    }

    if (scope === "global") {
      return db
        .prepare(
          `
        SELECT * FROM ai_facts
        WHERE user_id IS NULL
        ORDER BY updated_at DESC
      `,
        )
        .all();
    }

    return db
      .prepare(
        `
      SELECT * FROM ai_facts
      WHERE guild_id IS ? AND user_id IS NULL
      ORDER BY updated_at DESC
    `,
      )
      .all(guildId || null);
  },

  addKnowledge({ sourceType, sourceName, title, content }) {
    db.prepare(
      `
      INSERT INTO ai_knowledge (
        source_type, source_name, title, content, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `,
    ).run(sourceType, sourceName, title, content, Date.now(), Date.now());
  },

  getKnowledge(limit = 25) {
    return db
      .prepare(
        `
      SELECT * FROM ai_knowledge
      ORDER BY updated_at DESC
      LIMIT ?
    `,
      )
      .all(limit);
  },

  clearKnowledge() {
    db.prepare(`DELETE FROM ai_knowledge`).run();
  },

  clearConversations(channelId) {
    if (!channelId) return;
    db.prepare(`DELETE FROM ai_conversations WHERE channel_id = ?`).run(channelId);
  },
};