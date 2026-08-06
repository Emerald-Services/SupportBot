const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../Data/ai-memory.json');

function load() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {
      ai_conversations: [],
      ai_summaries: [],
      ai_facts: [],
      ai_knowledge: [],
      ai_sessions: [],
    };
  }
}

function save(state) {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to persist ai-memory:', e);
  }
}

const state = load();

function nextId(arr) {
  return arr.length === 0 ? 1 : Math.max(...arr.map(a => a.id || 0)) + 1;
}

module.exports = {
  saveUserFact({ guildId, userId, factType, factKey, factValue }) {
    const existing = state.ai_facts.find(f => f.guild_id === (guildId || null) && f.user_id === (userId || null) && f.fact_type === factType && f.fact_key === factKey);
    if (existing) {
      existing.fact_value = factValue;
      existing.updated_at = Date.now();
      save(state);
      return;
    }

    const id = nextId(state.ai_facts);
    state.ai_facts.push({ id, guild_id: guildId || null, channel_id: null, user_id: userId || null, fact_type: factType, fact_key: factKey, fact_value: factValue, created_at: Date.now(), updated_at: Date.now() });
    save(state);
  },

  getUserFacts(guildId, userId) {
    return state.ai_facts.filter(f => f.guild_id === (guildId || null) && f.user_id === (userId || null)).sort((a,b) => b.updated_at - a.updated_at);
  },

  getUserFactsByScope({ guildId = null, userId = null, scope = "guild" }) {
    if (!userId) return [];
    if (scope === "global") {
      return state.ai_facts.filter(f => f.user_id === (userId || null)).sort((a,b) => b.updated_at - a.updated_at);
    }

    return state.ai_facts.filter(f => f.guild_id === (guildId || null) && f.user_id === (userId || null)).sort((a,b) => b.updated_at - a.updated_at);
  },

  addMessage({ guildId, channelId, userId, role, content }) {
    const id = nextId(state.ai_conversations);
    state.ai_conversations.push({ id, guild_id: guildId || null, channel_id: channelId || null, user_id: userId || null, role, content, created_at: Date.now() });
    save(state);
  },

  getRecentMessages(channelId, limit = 15) {
    const msgs = state.ai_conversations.filter(m => m.channel_id === channelId).sort((a,b) => b.created_at - a.created_at).slice(0, limit).reverse();
    return msgs;
  },

  getRecentMessagesByScope({ guildId = null, channelId = null, limit = 15, scope = "guild" }) {
    if (scope === "channel") {
      return state.ai_conversations.filter(m => m.channel_id === (channelId || null)).sort((a,b) => b.created_at - a.created_at).slice(0, limit).reverse();
    }

    if (scope === "global") {
      return state.ai_conversations.sort((a,b) => b.created_at - a.created_at).slice(0, limit).reverse();
    }

    return state.ai_conversations.filter(m => m.guild_id === (guildId || null)).sort((a,b) => b.created_at - a.created_at).slice(0, limit).reverse();
  },

  saveSummary({ guildId, channelId, summary }) {
    const existing = state.ai_summaries.find(s => s.guild_id === (guildId || null) && s.channel_id === (channelId || null));
    if (existing) {
      existing.summary = summary;
      existing.updated_at = Date.now();
      save(state);
      return;
    }
    const id = nextId(state.ai_summaries);
    state.ai_summaries.push({ id, guild_id: guildId || null, channel_id: channelId || null, summary, created_at: Date.now(), updated_at: Date.now() });
    save(state);
  },

  getLatestSummary(channelId) {
    const arr = state.ai_summaries.filter(s => s.channel_id === channelId).sort((a,b) => b.updated_at - a.updated_at);
    return arr.length ? arr[0] : null;
  },

  getLatestSummaryByScope({ guildId = null, channelId = null, scope = "guild" }) {
    if (scope === "channel") {
      const arr = state.ai_summaries.filter(s => s.channel_id === (channelId || null)).sort((a,b) => b.updated_at - a.updated_at);
      return arr.length ? arr[0] : null;
    }
    if (scope === "global") {
      const arr = state.ai_summaries.sort((a,b) => b.updated_at - a.updated_at);
      return arr.length ? arr[0] : null;
    }

    const arr = state.ai_summaries.filter(s => s.guild_id === (guildId || null)).sort((a,b) => b.updated_at - a.updated_at);
    return arr.length ? arr[0] : null;
  },

  saveFact({ guildId, channelId, factType, factKey, factValue }) {
    const existing = state.ai_facts.find(f => f.guild_id === (guildId || null) && f.channel_id === (channelId || null) && f.fact_type === factType && f.fact_key === factKey);
    if (existing) {
      existing.fact_value = factValue;
      existing.updated_at = Date.now();
      save(state);
      return;
    }
    const id = nextId(state.ai_facts);
    state.ai_facts.push({ id, guild_id: guildId || null, channel_id: channelId || null, user_id: null, fact_type: factType, fact_key: factKey, fact_value: factValue, created_at: Date.now(), updated_at: Date.now() });
    save(state);
  },

  getFacts(channelId) {
    return state.ai_facts.filter(f => f.channel_id === channelId).sort((a,b) => b.updated_at - a.updated_at);
  },

  getFactsByScope({ guildId = null, channelId = null, scope = "guild" }) {
    if (scope === "channel") {
      return state.ai_facts.filter(f => f.channel_id === (channelId || null) && f.user_id == null).sort((a,b) => b.updated_at - a.updated_at);
    }
    if (scope === "global") {
      return state.ai_facts.filter(f => f.user_id == null).sort((a,b) => b.updated_at - a.updated_at);
    }

    return state.ai_facts.filter(f => f.guild_id === (guildId || null) && f.user_id == null).sort((a,b) => b.updated_at - a.updated_at);
  },

  addKnowledge({ sourceType, sourceName, title, content }) {
    const id = nextId(state.ai_knowledge);
    state.ai_knowledge.push({ id, source_type: sourceType, source_name: sourceName, title, content, created_at: Date.now(), updated_at: Date.now() });
    save(state);
  },

  getKnowledge(limit = 25) {
    return state.ai_knowledge.sort((a,b) => b.updated_at - a.updated_at).slice(0, limit);
  },

  clearKnowledge() {
    state.ai_knowledge = [];
    save(state);
  },

  clearConversations(channelId) {
    if (!channelId) return;
    state.ai_conversations = state.ai_conversations.filter(c => c.channel_id !== channelId);
    save(state);
  },
};