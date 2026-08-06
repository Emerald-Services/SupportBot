const fs = require("fs");
const path = require("path");
const {
  CONFIG_FILES,
  ROLES,
  fullPermissions,
  permissionsFromRole,
  normalizePermissions,
  hasPermission,
  canAccessConfig,
} = require("./DashboardPermissions.js");
const { discordAvatarUrl } = require("./DiscordOAuth.js");

const STORE_PATH = path.join(__dirname, "../Data/dashboard-users.json");

function ensureDataDir() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function emptyStore() {
  return { version: 1, users: {} };
}

function readStore() {
  ensureDataDir();
  if (!fs.existsSync(STORE_PATH)) return emptyStore();
  try {
    const raw = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    if (!raw.users || typeof raw.users !== "object") return emptyStore();
    return raw;
  } catch {
    return emptyStore();
  }
}

function writeStore(store) {
  ensureDataDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function getOwnerIds(oauth) {
  const owners = new Set();
  for (const id of oauth?.OwnerUserIds || []) owners.add(String(id));
  for (const id of oauth?.AllowedUserIds || []) owners.add(String(id));
  return owners;
}

function isYamlOwner(userId, oauth) {
  return getOwnerIds(oauth).has(String(userId));
}

function bootstrapFromOAuth(oauth) {
  const store = readStore();
  const owners = getOwnerIds(oauth);
  let changed = false;

  for (const id of owners) {
    if (!store.users[id]) {
      store.users[id] = {
        id,
        username: null,
        globalName: null,
        avatar: null,
        role: "owner",
        permissions: null,
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: "system",
      };
      changed = true;
    }
  }

  if (changed) writeStore(store);
  return store;
}

function syncDiscordProfile(userId, profile) {
  const store = readStore();
  const entry = store.users[userId];
  if (!entry) return;

  entry.username = profile.username ?? entry.username;
  entry.globalName = profile.globalName ?? entry.globalName;
  entry.avatar = profile.avatar ?? entry.avatar;
  entry.updatedAt = Date.now();
  writeStore(store);
}

const { getGroup } = require("./DashboardGroupStore.js");

function resolvePermissions(entry, oauth, userId) {
  if (isYamlOwner(userId, oauth)) {
    return { permissions: fullPermissions(), role: "owner", isOwner: true, groupId: "owner" };
  }
  if (!entry?.enabled) return null;

  const groupId = entry.groupId || entry.role || "support";
  const group = getGroup(groupId);

  if (entry.role === "custom" && entry.permissions) {
    return { permissions: normalizePermissions(entry.permissions), role: "custom", isOwner: false, groupId };
  }

  const permissions = group ? group.permissions : permissionsFromRole(entry.role || "viewer");
  return { permissions, role: entry.role || groupId, isOwner: false, groupId };
}

function getAccess(userId, oauth) {
  bootstrapFromOAuth(oauth);
  const store = readStore();
  const id = String(userId);

  if (isYamlOwner(id, oauth)) {
    const entry = store.users[id];
    return {
      entry: entry || { id, role: "owner" },
      permissions: fullPermissions(),
      role: "owner",
      isOwner: true,
      yamlOwner: true,
    };
  }

  const entry = store.users[id];
  const resolved = resolvePermissions(entry, oauth, id);
  if (!resolved) return null;

  return {
    entry,
    permissions: resolved.permissions,
    role: resolved.role,
    isOwner: false,
    yamlOwner: false,
  };
}

function canLogin(userId, oauth) {
  return Boolean(getAccess(userId, oauth));
}

function formatPublicUser(entry, access, discordProfile) {
  const id = String(entry?.id || discordProfile?.id);
  const avatarHash = entry?.avatar ?? discordProfile?.avatar ?? null;

  return {
    id,
    username: entry?.username || discordProfile?.username || "Unknown",
    globalName: entry?.globalName ?? discordProfile?.global_name ?? null,
    avatar: avatarHash
      ? discordAvatarUrl({ id, avatar: avatarHash })
      : discordProfile
        ? discordAvatarUrl(discordProfile)
        : discordAvatarUrl({ id, avatar: null }),
    role: access.role,
    isOwner: access.isOwner,
    permissions: access.permissions,
  };
}

function listUsers(oauth) {
  bootstrapFromOAuth(oauth);
  const store = readStore();
  const yamlOwners = getOwnerIds(oauth);

  return Object.values(store.users).map((entry) => {
    const access = resolvePermissions(entry, oauth, entry.id) || {
      permissions: permissionsFromRole("viewer"),
      role: entry.role,
      isOwner: false,
    };

    return {
      id: entry.id,
      username: entry.username,
      globalName: entry.globalName,
      avatar: entry.avatar
        ? discordAvatarUrl({ id: entry.id, avatar: entry.avatar })
        : discordAvatarUrl({ id: entry.id, avatar: null }),
      role: yamlOwners.has(String(entry.id)) ? "owner" : entry.role || entry.groupId || "support",
      groupId: entry.groupId || entry.role || "support",
      permissions:
        entry.role === "custom"
          ? normalizePermissions(entry.permissions)
          : access.permissions,
      enabled: entry.enabled !== false,
      isOwner: yamlOwners.has(String(entry.id)),
      yamlOwner: yamlOwners.has(String(entry.id)),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  });
}

function addUser(payload, actorId, oauth) {
  const id = String(payload.id || "").trim();
  if (!/^\d{17,20}$/.test(id)) {
    throw new Error("Invalid Discord user ID");
  }

  const role = payload.role || payload.groupId || "support";
  const groupId = payload.groupId || payload.role || "support";

  const store = readStore();
  if (store.users[id]) throw new Error("User already exists");

  store.users[id] = {
    id,
    username: payload.username || null,
    globalName: payload.globalName || null,
    avatar: null,
    role,
    groupId,
    permissions:
      role === "custom" ? normalizePermissions(payload.permissions) : null,
    enabled: payload.enabled !== false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: String(actorId),
  };

  writeStore(store);
  return listUsers(oauth).find((u) => u.id === id);
}

function updateUser(id, payload, actorId, oauth) {
  const store = readStore();
  const entry = store.users[String(id)];
  if (!entry) throw new Error("User not found");

  if (isYamlOwner(id, oauth) && payload.enabled === false) {
    throw new Error("Cannot disable an owner defined in api.yml");
  }

  if (payload.groupId) {
    entry.groupId = payload.groupId;
    if (!payload.role) entry.role = payload.groupId;
  }

  if (payload.role) {
    entry.role = payload.role;
    if (!payload.groupId) entry.groupId = payload.role;
  }

  if (payload.enabled !== undefined) entry.enabled = Boolean(payload.enabled);
  if (payload.username !== undefined) entry.username = payload.username;
  if (payload.globalName !== undefined) entry.globalName = payload.globalName;

  if (payload.permissions !== undefined) {
    entry.permissions = normalizePermissions(payload.permissions);
    if (entry.role !== "custom") entry.role = "custom";
  }

  if (entry.role === "custom" && payload.permissions === undefined && payload.role !== "custom") {
    entry.permissions = null;
  }

  entry.updatedAt = Date.now();
  writeStore(store);
  return listUsers(oauth).find((u) => u.id === String(id));
}

function removeUser(id, oauth) {
  if (isYamlOwner(id, oauth)) {
    throw new Error("Remove this user from OwnerUserIds in api.yml instead");
  }

  const store = readStore();
  if (!store.users[String(id)]) throw new Error("User not found");
  delete store.users[String(id)];
  writeStore(store);
}

module.exports = {
  CONFIG_FILES,
  STORE_PATH,
  getOwnerIds,
  isYamlOwner,
  bootstrapFromOAuth,
  syncDiscordProfile,
  getAccess,
  canLogin,
  formatPublicUser,
  listUsers,
  addUser,
  updateUser,
  removeUser,
  hasPermission,
  canAccessConfig,
  ROLES,
};
