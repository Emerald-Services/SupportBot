const CONFIG_FILES = [
  "supportbot",
  "ticket-panel",
  "commands",
  "messages",
  "supportbot-ai",
  "api",
];

const ROLES = ["owner", "admin", "moderator", "editor", "viewer", "custom"];

function configMap(view, edit) {
  const configs = {};
  for (const file of CONFIG_FILES) {
    configs[file] = { view: Boolean(view), edit: Boolean(edit) };
  }
  return configs;
}

function fullPermissions() {
  return {
    overview: true,
    logs: true,
    transcripts: true,
    settings: { view: true, update: true },
    configs: configMap(true, true),
    users: { view: true, manage: true },
  };
}

function permissionsFromRole(role, customPermissions) {
  switch (role) {
    case "owner":
    case "admin":
      return fullPermissions();
    case "moderator":
      return {
        overview: true,
        logs: true,
        transcripts: true,
        settings: { view: true, update: false },
        configs: configMap(true, false),
        users: { view: false, manage: false },
      };
    case "editor":
      return {
        overview: true,
        logs: true,
        transcripts: false,
        settings: { view: true, update: false },
        configs: configMap(true, true),
        users: { view: false, manage: false },
      };
    case "viewer":
      return {
        overview: true,
        logs: true,
        transcripts: true,
        settings: { view: true, update: false },
        configs: configMap(true, false),
        users: { view: false, manage: false },
      };
    case "custom":
      return normalizePermissions(customPermissions);
    default:
      return permissionsFromRole("viewer");
  }
}

function normalizePermissions(input) {
  const base = permissionsFromRole("viewer");
  if (!input || typeof input !== "object") return base;

  return {
    overview: input.overview ?? base.overview,
    logs: input.logs ?? base.logs,
    transcripts: input.transcripts ?? base.transcripts,
    settings: {
      view: input.settings?.view ?? base.settings.view,
      update: input.settings?.update ?? base.settings.update,
    },
    configs: CONFIG_FILES.reduce((acc, file) => {
      acc[file] = {
        view: input.configs?.[file]?.view ?? base.configs[file].view,
        edit: input.configs?.[file]?.edit ?? base.configs[file].edit,
      };
      return acc;
    }, {}),
    users: {
      view: input.users?.view ?? base.users.view,
      manage: input.users?.manage ?? base.users.manage,
    },
  };
}

function hasPermission(permissions, check) {
  if (!permissions) return false;

  if (check === "overview") return Boolean(permissions.overview);
  if (check === "logs") return Boolean(permissions.logs);
  if (check === "transcripts") return Boolean(permissions.transcripts);
  if (check === "settings.view") return Boolean(permissions.settings?.view);
  if (check === "settings.update") return Boolean(permissions.settings?.update);
  if (check === "users.view") return Boolean(permissions.users?.view);
  if (check === "users.manage") return Boolean(permissions.users?.manage);

  const configView = check.match(/^configs\.([a-z0-9-]+)\.view$/);
  if (configView) {
    const file = configView[1];
    return Boolean(permissions.configs?.[file]?.view);
  }

  const configEdit = check.match(/^configs\.([a-z0-9-]+)\.edit$/);
  if (configEdit) {
    const file = configEdit[1];
    return Boolean(permissions.configs?.[file]?.edit);
  }

  return false;
}

function canAccessConfig(permissions, file, mode = "view") {
  if (!CONFIG_FILES.includes(file)) return false;
  return hasPermission(permissions, `configs.${file}.${mode}`);
}

module.exports = {
  CONFIG_FILES,
  ROLES,
  fullPermissions,
  permissionsFromRole,
  normalizePermissions,
  hasPermission,
  canAccessConfig,
};
