/**
 * Dashboard alert registry — server-side providers for actionable banners.
 *
 * Register a provider to surface new alerts anywhere in the dashboard:
 *
 *   const { dashboardAlerts } = require("./DashboardAlerts.js");
 *   dashboardAlerts.register("my-addon", (ctx) => {
 *     if (!ctx.configStore.myAddon?.Configured) {
 *       return [{
 *         id: "my-addon:setup",
 *         severity: "warning",
 *         category: "my-addon",
 *         title: "My addon needs setup",
 *         message: "Finish configuration to enable this feature.",
 *         action: { label: "Configure", href: "/configs?file=my-addon" },
 *       }];
 *     }
 *     return [];
 *   });
 */
const { evaluateGuildHealth } = require("./GuildManager.js");
const { evaluateAllModules } = require("./ModuleStatus.js");

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };

const MODULE_LINKS = {
  tickets: {
    title: "Ticket system",
    href: "/configs?file=ticket-panel",
  },
  supportbot: {
    title: "Core bot settings",
    href: "/configs?file=supportbot",
  },
  transcripts: {
    title: "Ticket transcripts",
    href: "/transcripts",
  },
  suggestions: {
    title: "Suggestions",
    href: "/configs?file=messages",
  },
  ai: {
    title: "AI assistant",
    href: "/configs?file=supportbot-ai",
  },
  commands: {
    title: "Commands",
    href: "/configs?file=commands",
  },
};

class DashboardAlertRegistry {
  constructor() {
    /** @type {Map<string, (ctx: DashboardAlertContext) => DashboardAlert[] | Promise<DashboardAlert[]>>} */
    this.providers = new Map();
  }

  /**
   * @param {string} id Unique provider id (used for debugging / overrides)
   * @param {(ctx: DashboardAlertContext) => DashboardAlert[] | Promise<DashboardAlert[]>} fn
   */
  register(id, fn) {
    this.providers.set(id, fn);
    return this;
  }

  unregister(id) {
    this.providers.delete(id);
  }

  /** @param {DashboardAlertContext} ctx */
  async evaluate(ctx) {
    const alerts = [];
    for (const fn of this.providers.values()) {
      const result = await fn(ctx);
      if (Array.isArray(result) && result.length) {
        alerts.push(...result);
      }
    }
    return sortAlerts(alerts);
  }
}

function sortAlerts(alerts) {
  return [...alerts].sort((a, b) => {
    const sa = SEVERITY_ORDER[a.severity] ?? 9;
    const sb = SEVERITY_ORDER[b.severity] ?? 9;
    if (sa !== sb) return sa - sb;
    return a.title.localeCompare(b.title);
  });
}

function guildSeverity(status) {
  if (status === "offline") return "error";
  return "warning";
}

function shouldSkipModuleAlert(moduleId, info) {
  if (info.status === "done") return true;
  if (moduleId === "ai" && info.subtitle === "AI is disabled in config") return true;
  // Transcripts are automatic — empty archive is normal, not a setup step.
  if (moduleId === "transcripts") return true;
  // Partially configured modules are tracked on Overview — only banner when nothing is done yet.
  if (info.status === "progress" && (info.passed ?? 0) > 0) return true;
  return false;
}

function moduleSeverity(moduleId, info) {
  if (info.status === "todo") {
    return moduleId === "tickets" || moduleId === "supportbot" ? "warning" : "info";
  }
  return "info";
}

function evaluateGuildAlerts(ctx) {
  const { client } = ctx;
  if (!client?.user) {
    return [
      {
        id: "guild:offline",
        severity: "error",
        category: "guild",
        title: "Bot offline",
        message: "The bot is not connected to Discord. Check your token and restart the server.",
        action: { label: "Bot config", href: "/configs?file=supportbot" },
        meta: { status: "offline" },
      },
    ];
  }

  const health = evaluateGuildHealth(client);
  if (health.status === "ok") return [];

  return [
    {
      id: "guild:health",
      severity: guildSeverity(health.status),
      category: "guild",
      title: "Server setup required",
      message: health.message,
      action: { label: "Bot config", href: "/configs?file=supportbot" },
      meta: {
        status: health.status,
        configuredGuildId: health.configuredGuildId,
        configuredGuild: health.configuredGuild,
        extraGuilds: health.extraGuilds,
      },
    },
  ];
}

function evaluateModuleAlerts(ctx) {
  const { configStore, transcriptCount = 0 } = ctx;
  const modules = evaluateAllModules(configStore, { transcriptCount });
  const alerts = [];

  for (const [moduleId, info] of Object.entries(modules)) {
    if (shouldSkipModuleAlert(moduleId, info)) continue;

    const link = MODULE_LINKS[moduleId] || {
      title: moduleId,
      href: "/configs",
    };

    const progress =
      info.total > 0 ? `${info.passed ?? 0} of ${info.total} checks complete` : null;

    alerts.push({
      id: `module:${moduleId}`,
      severity: moduleSeverity(moduleId, info),
      category: "modules",
      title:
        info.status === "todo"
          ? `${link.title} — setup required`
          : `${link.title} — in progress`,
      message: info.subtitle,
      action: { label: "Open module", href: link.href },
      meta: {
        moduleId,
        status: info.status,
        passed: info.passed,
        total: info.total,
        progress,
      },
    });
  }

  return alerts;
}

const dashboardAlerts = new DashboardAlertRegistry();
dashboardAlerts.register("guild", evaluateGuildAlerts);
dashboardAlerts.register("modules", evaluateModuleAlerts);

/**
 * @typedef {Object} DashboardAlertAction
 * @property {string} label
 * @property {string} href
 */

/**
 * @typedef {Object} DashboardAlert
 * @property {string} id
 * @property {"error"|"warning"|"info"} severity
 * @property {string} category
 * @property {string} title
 * @property {string} message
 * @property {DashboardAlertAction} [action]
 * @property {Record<string, unknown>} [meta]
 */

/**
 * @typedef {Object} DashboardAlertContext
 * @property {import("discord.js").Client} [client]
 * @property {import("./ConfigStore.js")} configStore
 * @property {number} [transcriptCount]
 */

async function evaluateDashboardAlerts(ctx) {
  return dashboardAlerts.evaluate(ctx);
}

module.exports = {
  dashboardAlerts,
  evaluateDashboardAlerts,
  sortAlerts,
  MODULE_LINKS,
};
