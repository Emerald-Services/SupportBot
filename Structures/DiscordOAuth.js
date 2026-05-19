const crypto = require("crypto");
const axios = require("axios");

const DISCORD_API = "https://discord.com/api";
const OAUTH_STATE_COOKIE = "sb_oauth_state";
const OAUTH_REDIRECT_COOKIE = "sb_oauth_redirect";
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;
const CALLBACK_PATH = "/api/auth/discord/callback";

function discordAvatarUrl(user) {
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
  }
  const index = Number((BigInt(user.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

function getTrustProxySetting(apiConfig) {
  if (apiConfig?.TrustProxy === false) return false;
  if (typeof apiConfig?.TrustProxy === "number") return apiConfig.TrustProxy;
  if (apiConfig?.TrustProxy === true) return 1;
  return false;
}

function getRequestProto(req, apiConfig) {
  if (apiConfig?.TrustProxy !== false) {
    const forwarded = req.get("x-forwarded-proto");
    if (forwarded) {
      return forwarded.split(",")[0].trim().toLowerCase();
    }
  }
  return (req.protocol || "http").toLowerCase();
}

function getRequestHost(req) {
  const forwarded = req.get("x-forwarded-host");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.get("host") || "";
}

function getRequestOrigin(req, apiConfig) {
  const proto = getRequestProto(req, apiConfig);
  const host = getRequestHost(req);
  if (!host) return null;
  return `${proto}://${host}`;
}

function normalizeRedirectUri(uri) {
  try {
    const u = new URL(uri);
    u.hash = "";
    u.search = "";
    return u.toString();
  } catch {
    return null;
  }
}

function redirectUriMatchesHostPath(a, b) {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    return ua.host === ub.host && ua.pathname === ub.pathname;
  } catch {
    return false;
  }
}

function collectConfiguredRedirectUris(oauth) {
  const list = [];
  if (oauth?.RedirectUri) {
    const normalized = normalizeRedirectUri(oauth.RedirectUri);
    if (normalized) list.push(normalized);
  }
  if (Array.isArray(oauth?.RedirectUris)) {
    for (const entry of oauth.RedirectUris) {
      const normalized = normalizeRedirectUri(entry);
      if (normalized && !list.includes(normalized)) {
        list.push(normalized);
      }
    }
  }
  return list;
}

/**
 * Pick the OAuth redirect_uri for this request. When UseRequestOrigin is enabled
 * (default), uses the same host/path as RedirectUri but the protocol the user
 * actually used (http vs https). Register every variant in the Discord portal.
 */
function resolveOAuthRedirectUri(req, oauth, apiConfig) {
  const configured = collectConfiguredRedirectUris(oauth);
  const fallback = configured[0] || oauth?.RedirectUri || "";

  const useRequestOrigin = oauth?.UseRequestOrigin !== false;
  if (!useRequestOrigin || !req) {
    return fallback;
  }

  const origin = getRequestOrigin(req, apiConfig);
  if (!origin) return fallback;

  const dynamic = `${origin}${CALLBACK_PATH}`;
  const normalizedDynamic = normalizeRedirectUri(dynamic);
  if (!normalizedDynamic) return fallback;

  if (configured.includes(normalizedDynamic)) {
    return normalizedDynamic;
  }

  const matchesConfigured = configured.some((uri) =>
    redirectUriMatchesHostPath(uri, normalizedDynamic),
  );
  if (matchesConfigured) {
    return normalizedDynamic;
  }

  return fallback;
}

function isSecureRequest(req, oauth, apiConfig) {
  if (oauth?.CookieSecure === true) return true;
  if (oauth?.CookieSecure === false) return false;
  if (req) {
    if (typeof req.secure === "boolean") return req.secure;
    return getRequestProto(req, apiConfig) === "https";
  }
  return process.env.NODE_ENV === "production";
}

function buildAuthorizeUrl(oauth, state, redirectUri) {
  const params = new URLSearchParams({
    client_id: oauth.ClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "none",
  });
  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

async function exchangeCode(oauth, code, redirectUri) {
  const body = new URLSearchParams({
    client_id: oauth.ClientId,
    client_secret: oauth.ClientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const { data } = await axios.post(`${DISCORD_API}/oauth2/token`, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 15000,
  });

  return data.access_token;
}

async function fetchDiscordUser(accessToken) {
  const { data } = await axios.get(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  });
  return data;
}

function createOAuthState() {
  return crypto.randomBytes(24).toString("hex");
}

function oauthStateCookieOptions(req, oauth, apiConfig) {
  return {
    httpOnly: true,
    secure: isSecureRequest(req, oauth, apiConfig),
    sameSite: "lax",
    maxAge: OAUTH_STATE_MAX_AGE_MS,
    path: "/",
  };
}

function oauthRedirectCookieOptions(req, oauth, apiConfig) {
  return oauthStateCookieOptions(req, oauth, apiConfig);
}

function isOAuthConfigured(oauth) {
  return Boolean(
    oauth?.Enabled &&
      oauth.ClientId &&
      oauth.ClientSecret &&
      oauth.RedirectUri,
  );
}

function isUserAllowed(userId, oauth) {
  const allowed = oauth?.AllowedUserIds;
  if (!Array.isArray(allowed) || allowed.length === 0) {
    return false;
  }
  return allowed.map(String).includes(String(userId));
}

function formatPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    globalName: user.global_name || null,
    avatar: discordAvatarUrl(user),
  };
}

module.exports = {
  OAUTH_STATE_COOKIE,
  OAUTH_REDIRECT_COOKIE,
  OAUTH_STATE_MAX_AGE_MS,
  CALLBACK_PATH,
  getTrustProxySetting,
  resolveOAuthRedirectUri,
  isSecureRequest,
  buildAuthorizeUrl,
  exchangeCode,
  fetchDiscordUser,
  createOAuthState,
  oauthStateCookieOptions,
  oauthRedirectCookieOptions,
  isOAuthConfigured,
  isUserAllowed,
  formatPublicUser,
  discordAvatarUrl,
};
