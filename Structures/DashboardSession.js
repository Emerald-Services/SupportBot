const crypto = require("crypto");

const SESSION_COOKIE = "sb_dashboard";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function signSession(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

function verifySession(token, secret) {
  if (!token || typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url");

  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    );
    if (!payload?.userId || !payload?.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function createSessionPayload(user) {
  return {
    userId: user.id,
    username: user.username,
    globalName: user.global_name || null,
    avatar: user.avatar || null,
    exp: Date.now() + SESSION_MAX_AGE_MS,
  };
}

function sessionCookieOptions(maxAgeMs = SESSION_MAX_AGE_MS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: maxAgeMs,
    path: "/",
  };
}

module.exports = {
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  signSession,
  verifySession,
  createSessionPayload,
  sessionCookieOptions,
};
