const fs = require("fs");
const path = require("path");
const axios = require("axios");
const YAML = require("yaml");
const configStore = require("./ConfigStore.js");
const { CALLBACK_PATH } = require("./DiscordOAuth.js");

const DISCORD_API = "https://discord.com/api/v10";
const CONFIG_DIR = path.join(__dirname, "../Configs");
const API_FILE = path.join(CONFIG_DIR, "api.yml");
const SUPPORTBOT_FILE = path.join(CONFIG_DIR, "supportbot.yml");

const PLACEHOLDER_PATTERNS = [
  /DISCORD_CLIENT_ID/i,
  /DISCORD_CLIENT_SECRET/i,
  /YOUR_DISCORD_USER_ID/i,
  /CHANGE_ME/i,
  /BOT_TOKEN/i,
  /PUT_RANDOM_STRING/i,
];

function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return false;
  return String(value).trim() === "";
}

function isPlaceholder(value) {
  if (isEmpty(value)) return true;
  const s = String(value).trim();
  return PLACEHOLDER_PATTERNS.some((p) => p.test(s));
}

function isDiscordSnowflake(value) {
  return /^\d{17,20}$/.test(String(value).trim());
}

function isValidBotToken(value) {
  if (isPlaceholder(value)) return false;
  const s = String(value).trim();
  return s.length >= 50 && s.includes(".");
}

function isValidSecretKey(value) {
  if (isPlaceholder(value)) return false;
  return String(value).trim().length >= 16;
}

function readApiRoot() {
  if (!fs.existsSync(API_FILE)) return null;
  try {
    const raw = YAML.parse(fs.readFileSync(API_FILE, "utf8"));
    return raw?.API ?? raw ?? null;
  } catch {
    return null;
  }
}

function readSupportbotRoot() {
  if (!fs.existsSync(SUPPORTBOT_FILE)) return {};
  try {
    return YAML.parse(fs.readFileSync(SUPPORTBOT_FILE, "utf8")) || {};
  } catch {
    return {};
  }
}

function getOwnerIds(oauth) {
  const ids = [];
  for (const id of oauth?.OwnerUserIds || []) {
    const s = String(id).trim();
    if (s) ids.push(s);
  }
  if (ids.length === 0) {
    for (const id of oauth?.AllowedUserIds || []) {
      const s = String(id).trim();
      if (s) ids.push(s);
    }
  }
  return ids;
}

function buildSteps(apiRoot, supportbot) {
  const oauth = apiRoot?.OAuth || {};
  const token = supportbot?.General?.Token;

  return [
    {
      id: "botToken",
      title: "Bot token",
      description: "From the Discord Developer Portal → your application → Bot → Reset Token.",
      complete: isValidBotToken(token),
    },
    {
      id: "secretKey",
      title: "Dashboard session secret",
      description: "Random string used to sign login cookies. Keep it private.",
      complete: isValidSecretKey(apiRoot?.SecretKey),
    },
    {
      id: "oauth",
      title: "Discord OAuth app",
      description: "Same application as your bot — Client ID and Client Secret from OAuth2.",
      complete:
        !isPlaceholder(oauth.ClientId) &&
        !isPlaceholder(oauth.ClientSecret) &&
        isDiscordSnowflake(oauth.ClientId),
    },
    {
      id: "redirectUri",
      title: "OAuth redirect URL",
      description: `Add this exact URL under OAuth2 → Redirects in the Discord portal.`,
      complete: isValidRedirectUriConfigured(oauth.RedirectUri),
    },
    {
      id: "owners",
      title: "Dashboard owners",
      description: "Discord user IDs that can sign in and manage the dashboard (at least one).",
      complete: getOwnerIds(oauth).length > 0 && getOwnerIds(oauth).every(isDiscordSnowflake),
    },
    {
      id: "emeraldApi",
      title: "Emerald API",
      description: "Optional. Used for the one-click addon installer.",
      complete: true,
    },
  ];
}

function isValidRedirectUriConfigured(uri) {
  if (isPlaceholder(uri)) return false;
  try {
    const u = new URL(String(uri).trim());
    if (!["http:", "https:"].includes(u.protocol)) return false;
    return u.pathname.replace(/\/$/, "") === CALLBACK_PATH.replace(/\/$/, "");
  } catch {
    return false;
  }
}

function isSetupComplete() {
  const apiRoot = readApiRoot();
  if (!apiRoot?.Enabled) return false;
  const oauth = apiRoot.OAuth || {};
  if (!oauth.Enabled) return false;
  const steps = buildSteps(apiRoot, readSupportbotRoot());
  return steps.every((s) => s.complete);
}

function getSetupStatus(req) {
  const apiRoot = readApiRoot() || {};
  const steps = buildSteps(apiRoot, readSupportbotRoot());
  const complete = steps.every((s) => s.complete);

  let suggestedRedirectUri = null;
  if (req) {
    const proto =
      req.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      req.protocol ||
      "http";
    const host = req.get("x-forwarded-host")?.split(",")[0]?.trim() || req.get("host");
    if (host) {
      suggestedRedirectUri = `${proto}://${host}${CALLBACK_PATH}`;
    }
  }
  if (!suggestedRedirectUri) {
    suggestedRedirectUri = `http://localhost:${apiRoot.Port || 3000}${CALLBACK_PATH}`;
  }

  return {
    complete,
    steps,
    suggestedRedirectUri,
    oauthCallbackPath: CALLBACK_PATH,
  };
}

async function validateBotToken(token) {
  const trimmed = String(token || "").trim();
  if (!isValidBotToken(trimmed)) {
    return { ok: false, error: "Enter a valid bot token from the Discord Developer Portal." };
  }

  try {
    const [userRes, appRes] = await Promise.all([
      axios.get(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bot ${trimmed}` },
        timeout: 12_000,
      }),
      axios.get(`${DISCORD_API}/oauth2/applications/@me`, {
        headers: { Authorization: `Bot ${trimmed}` },
        timeout: 12_000,
      }),
    ]);

    return {
      ok: true,
      bot: {
        id: userRes.data.id,
        username: userRes.data.username,
        discriminator: userRes.data.discriminator,
      },
      applicationId: String(appRes.data.id),
    };
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) {
      return { ok: false, error: "Discord rejected this bot token (401 Unauthorized)." };
    }
    return {
      ok: false,
      error: err.response?.data?.message || err.message || "Could not verify bot token.",
    };
  }
}

async function validateOAuthCredentials(clientId, clientSecret, botToken) {
  const id = String(clientId || "").trim();
  const secret = String(clientSecret || "").trim();

  if (!isDiscordSnowflake(id)) {
    return { ok: false, error: "Client ID must be a numeric Discord application ID." };
  }
  if (isPlaceholder(secret) || secret.length < 20) {
    return { ok: false, error: "Enter the OAuth Client Secret from the Discord portal." };
  }

  if (botToken) {
    const botCheck = await validateBotToken(botToken);
    if (botCheck.ok && botCheck.applicationId && botCheck.applicationId !== id) {
      return {
        ok: false,
        error: `Client ID does not match the bot application (${botCheck.applicationId}). Use the same app's credentials.`,
      };
    }
  }

  try {
    await axios.post(
      `${DISCORD_API}/oauth2/token`,
      new URLSearchParams({ grant_type: "client_credentials", scope: "identify" }),
      {
        auth: { username: id, password: secret },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 12_000,
      },
    );
    return { ok: true, clientId: id };
  } catch (err) {
    const status = err.response?.status;
    if (botToken) {
      const botCheck = await validateBotToken(botToken);
      if (botCheck.ok && botCheck.applicationId === id) {
        return {
          ok: true,
          clientId: id,
          warning:
            "Could not verify the client secret with Discord (token endpoint). ID matches your bot — double-check the secret in the portal.",
        };
      }
    }
    if (status === 401 || status === 400) {
      return { ok: false, error: "Invalid Client ID or Client Secret." };
    }
    return {
      ok: false,
      error: err.response?.data?.error_description || err.message || "OAuth validation failed.",
    };
  }
}

function validateRedirectUri(uri) {
  const trimmed = String(uri || "").trim();
  if (!isValidRedirectUriConfigured(trimmed)) {
    return {
      ok: false,
      error: `Redirect URL must end with ${CALLBACK_PATH} and use http or https.`,
    };
  }
  return { ok: true, redirectUri: trimmed };
}

async function validateOwnerUserIds(ownerIds, botToken) {
  const ids = (Array.isArray(ownerIds) ? ownerIds : [ownerIds])
    .map((id) => String(id).trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return { ok: false, error: "Add at least one Discord user ID." };
  }

  const invalid = ids.filter((id) => !isDiscordSnowflake(id));
  if (invalid.length) {
    return { ok: false, error: `Invalid user ID: ${invalid[0]}` };
  }

  if (!botToken || !isValidBotToken(botToken)) {
    return { ok: true, ownerUserIds: ids, warning: "User IDs format OK (bot token not verified yet)." };
  }

  const users = [];
  try {
    for (const id of ids) {
      const res = await axios.get(`${DISCORD_API}/users/${id}`, {
        headers: { Authorization: `Bot ${String(botToken).trim()}` },
        timeout: 12_000,
      });
      users.push({
        id: res.data.id,
        username: res.data.username,
        globalName: res.data.global_name || null,
      });
    }
    return { ok: true, ownerUserIds: ids, users };
  } catch (err) {
    if (err.response?.status === 404) {
      return { ok: false, error: "One or more user IDs were not found. Check Developer Mode → Copy User ID." };
    }
    if (err.response?.status === 403) {
      return {
        ok: false,
        error: "Bot could not look up users. Ensure the bot is in a server with those users, or verify IDs manually.",
      };
    }
    return { ok: false, error: err.message || "Failed to verify owner user IDs." };
  }
}

function validateSecretKey(secretKey) {
  if (!isValidSecretKey(secretKey)) {
    return { ok: false, error: "Use at least 16 characters (not CHANGE_ME)." };
  }
  return { ok: true };
}

async function validateSetupPayload(payload) {
  const results = {};

  if (payload.botToken != null) {
    results.botToken = await validateBotToken(payload.botToken);
  }
  if (payload.secretKey != null) {
    results.secretKey = validateSecretKey(payload.secretKey);
  }
  if (payload.clientId != null && payload.clientSecret != null) {
    results.oauth = await validateOAuthCredentials(
      payload.clientId,
      payload.clientSecret,
      payload.botToken,
    );
  }
  if (payload.redirectUri != null) {
    results.redirectUri = validateRedirectUri(payload.redirectUri);
  }
  if (payload.ownerUserIds != null) {
    results.owners = await validateOwnerUserIds(payload.ownerUserIds, payload.botToken);
  }
  if (payload.emeraldApiKey != null) {
    const key = String(payload.emeraldApiKey).trim();
    if (key === "") {
      results.emeraldApi = { ok: true };
    } else if (key.length < 10) {
      results.emeraldApi = { ok: false, error: "Invalid API key." };
    } else {
      results.emeraldApi = { ok: true };
    }
  }

  const allOk = Object.values(results).every((r) => r?.ok);
  return { ok: allOk, results };
}

function ensureApiFile() {
  if (fs.existsSync(API_FILE)) return;
  const example = path.join(CONFIG_DIR, "api.yml.example");
  if (fs.existsSync(example)) {
    fs.copyFileSync(example, API_FILE);
    configStore.reloadFile("api");
  } else {
    throw new Error("Configs/api.yml is missing. Copy Configs/api.yml.example to api.yml.");
  }
}

function applySetup(payload) {
  ensureApiFile();

  const ownerIds = (Array.isArray(payload.ownerUserIds)
    ? payload.ownerUserIds
    : String(payload.ownerUserIds || "").split(/[\s,]+/)
  )
    .map((id) => String(id).trim())
    .filter(Boolean);

  const apiDoc = YAML.parseDocument(fs.readFileSync(API_FILE, "utf8"));
  if (!apiDoc.get("API")) apiDoc.set("API", {});

  apiDoc.setIn(["API", "Enabled"], true);
  apiDoc.setIn(["API", "SecretKey"], String(payload.secretKey).trim());
  if (payload.emeraldApiKey != null) {
    apiDoc.setIn(["API", "EmeraldAPIKey"], String(payload.emeraldApiKey).trim());
  }
  if (payload.port != null && payload.port !== "") {
    apiDoc.setIn(["API", "Port"], Number(payload.port) || 3000);
  }
  if (!apiDoc.getIn(["API", "OAuth"])) apiDoc.setIn(["API", "OAuth"], {});

  apiDoc.setIn(["API", "OAuth", "Enabled"], true);
  apiDoc.setIn(["API", "OAuth", "ClientId"], String(payload.clientId).trim());
  apiDoc.setIn(["API", "OAuth", "ClientSecret"], String(payload.clientSecret).trim());
  apiDoc.setIn(["API", "OAuth", "RedirectUri"], String(payload.redirectUri).trim());
  apiDoc.setIn(["API", "OAuth", "OwnerUserIds"], ownerIds);
  apiDoc.setIn(["API", "OAuth", "AllowedUserIds"], []);

  fs.writeFileSync(API_FILE, apiDoc.toString());

  const sbDoc = YAML.parseDocument(fs.readFileSync(SUPPORTBOT_FILE, "utf8"));
  sbDoc.setIn(["General", "Token"], String(payload.botToken).trim());
  fs.writeFileSync(SUPPORTBOT_FILE, sbDoc.toString());

  configStore.reloadFile("api");
  configStore.reloadFile("supportbot");

  return {
    ownerUserIds: ownerIds,
    api: configStore.api?.API || configStore.api,
  };
}

module.exports = {
  isSetupComplete,
  getSetupStatus,
  validateBotToken,
  validateOAuthCredentials,
  validateRedirectUri,
  validateOwnerUserIds,
  validateSecretKey,
  validateSetupPayload,
  applySetup,
};
