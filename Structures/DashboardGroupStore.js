// SupportBot | Emerald Services
const fs = require("fs");
const path = require("path");
const { fullPermissions, normalizePermissions } = require("./DashboardPermissions.js");

const GROUPS_FILE = path.join(__dirname, "../Data/dashboard-groups.json");

const DEFAULT_GROUPS = [
  {
    id: "owner",
    name: "Owner",
    description: "Full system owner access to all features and configs",
    color: "#10B981", // Emerald Green
    discordRoleId: null,
    isSystem: true,
    permissions: fullPermissions(),
  },
  {
    id: "admin",
    name: "Admin",
    description: "Full administrative access including user and group management",
    color: "#3B82F6", // Blue
    discordRoleId: null,
    isSystem: true,
    permissions: fullPermissions(false, false),
  },
  {
    id: "support",
    name: "Support Staff",
    description: "Access to Overview, Live Tickets, and Transcripts",
    color: "#8B5CF6", // Purple
    discordRoleId: null,
    isSystem: false,
    permissions: {
      overview: true,
      tickets: true,
      logs: false,
      transcripts: true,
      settings: { view: false, update: false },
      configs: {
        supportbot: { view: false, edit: false },
        "ticket-panel": { view: false, edit: false },
        commands: { view: false, edit: false },
        messages: { view: false, edit: false },
        "supportbot-ai": { view: false, edit: false },
        api: { view: false, edit: false },
      },
      users: { view: false, manage: false },
    },
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "Read-only access to dashboard and logs",
    color: "#6B7280", // Gray
    discordRoleId: null,
    isSystem: false,
    permissions: {
      overview: true,
      tickets: true,
      logs: true,
      transcripts: true,
      settings: { view: true, update: false },
      configs: {
        supportbot: { view: true, edit: false },
        "ticket-panel": { view: true, edit: false },
        commands: { view: true, edit: false },
        messages: { view: true, edit: false },
        "supportbot-ai": { view: true, edit: false },
        api: { view: true, edit: false },
      },
      users: { view: false, manage: false },
    },
  },
];

function ensureStorage() {
  const dir = path.dirname(GROUPS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(GROUPS_FILE)) {
    const initialData = {
      version: 1,
      groups: DEFAULT_GROUPS,
    };
    fs.writeFileSync(GROUPS_FILE, JSON.stringify(initialData, null, 2), "utf8");
  }
}

function loadStore() {
  ensureStorage();
  try {
    const raw = fs.readFileSync(GROUPS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.groups)) {
      return parsed.groups;
    }
  } catch (err) {
    console.error("[GroupStore] Error loading groups file:", err.message);
  }
  return DEFAULT_GROUPS;
}

function saveStore(groups) {
  ensureStorage();
  const payload = {
    version: 1,
    groups,
    updatedAt: Date.now(),
  };
  fs.writeFileSync(GROUPS_FILE, JSON.stringify(payload, null, 2), "utf8");
}

function listGroups() {
  return loadStore();
}

function getGroup(id) {
  const groups = loadStore();
  return groups.find((g) => g.id === id) || null;
}

function createGroup(payload = {}) {
  const groups = loadStore();
  const name = (payload.name || "New Group").trim();
  const slug = name.toLowerCase().replace(/[^a-z0-9_-]+/g, "_");
  let newId = slug || `group_${Date.now()}`;

  let counter = 1;
  while (groups.some((g) => g.id === newId)) {
    newId = `${slug}_${counter++}`;
  }

  const newGroup = {
    id: newId,
    name,
    description: (payload.description || "").trim(),
    color: payload.color || "#10B981",
    discordRoleId: payload.discordRoleId ? String(payload.discordRoleId).trim() : null,
    isSystem: false,
    permissions: normalizePermissions(payload.permissions),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  groups.push(newGroup);
  saveStore(groups);
  return newGroup;
}

function updateGroup(id, payload = {}) {
  if (id === "owner") {
    throw new Error('System group "Owner" cannot be modified.');
  }
  const groups = loadStore();
  const index = groups.findIndex((g) => g.id === id);
  if (index === -1) {
    throw new Error(`Group with ID "${id}" not found.`);
  }

  const existing = groups[index];
  const updatedGroup = {
    ...existing,
    name: payload.name !== undefined ? payload.name.trim() : existing.name,
    description: payload.description !== undefined ? payload.description.trim() : existing.description,
    color: payload.color || existing.color,
    discordRoleId: payload.discordRoleId !== undefined ? (payload.discordRoleId ? String(payload.discordRoleId).trim() : null) : existing.discordRoleId,
    permissions: payload.permissions ? normalizePermissions(payload.permissions) : existing.permissions,
    updatedAt: Date.now(),
  };

  groups[index] = updatedGroup;
  saveStore(groups);
  return updatedGroup;
}

function deleteGroup(id) {
  const groups = loadStore();
  const group = groups.find((g) => g.id === id);
  if (!group) {
    throw new Error(`Group with ID "${id}" not found.`);
  }

  if (group.isSystem) {
    throw new Error(`System group "${group.name}" cannot be deleted.`);
  }

  const filtered = groups.filter((g) => g.id !== id);
  saveStore(filtered);
  return true;
}

module.exports = {
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  DEFAULT_GROUPS,
};
