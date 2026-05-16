const crypto = require("crypto");
const axios = require("axios");

const DISCORD_API = "https://discord.com/api";
const OAUTH_STATE_COOKIE = "sb_oauth_state";
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

function discordAvatarUrl(user) {
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
  }
  const index = Number((BigInt(user.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

function buildAuthorizeUrl(oauth, state) {
  const params = new URLSearchParams({
    client_id: oauth.ClientId,
    redirect_uri: oauth.RedirectUri,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "none",
  });
  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

async function exchangeCode(oauth, code) {
  const body = new URLSearchParams({
    client_id: oauth.ClientId,
    client_secret: oauth.ClientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: oauth.RedirectUri,
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

function oauthStateCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OAUTH_STATE_MAX_AGE_MS,
    path: "/",
  };
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
  OAUTH_STATE_MAX_AGE_MS,
  buildAuthorizeUrl,
  exchangeCode,
  fetchDiscordUser,
  createOAuthState,
  oauthStateCookieOptions,
  isOAuthConfigured,
  isUserAllowed,
  formatPublicUser,
  discordAvatarUrl,
};
