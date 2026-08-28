// Live config objects — reload mutates in place so existing references stay valid.
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const CONFIG_DIR = path.join(__dirname, "../Configs");

const FILE_KEYS = [
  "supportbot",
  "commands",
  "messages",
  "ticket-panel",
  "supportbot-ai",
  "api",
];

function readConfig(name) {
  return yaml.load(fs.readFileSync(path.join(CONFIG_DIR, `${name}.yml`), "utf8"));
}

function deepAssign(target, source) {
  if (!target || typeof target !== "object" || Array.isArray(target)) {
    return source;
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return source;
  }

  for (const key of Object.keys(source)) {
    const next = source[key];
    if (
      next &&
      typeof next === "object" &&
      !Array.isArray(next) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      deepAssign(target[key], next);
    } else {
      target[key] = next;
    }
  }

  for (const key of Object.keys(target)) {
    if (!(key in source)) {
      delete target[key];
    }
  }

  return target;
}

const store = {};
for (const name of FILE_KEYS) {
  store[name] = readConfig(name);
}

function reloadFile(fileKey) {
  if (!FILE_KEYS.includes(fileKey)) {
    throw new Error(`Unknown config: ${fileKey}`);
  }
  const fresh = readConfig(fileKey);
  deepAssign(store[fileKey], fresh);
  return store[fileKey];
}

function reloadBotConfigs() {
  const reloaded = [];
  for (const name of FILE_KEYS) {
    if (name === "api") continue;
    reloadFile(name);
    reloaded.push(name);
  }
  return reloaded;
}

module.exports = {
  supportbot: store.supportbot,
  commands: store.commands,
  messages: store.messages,
  ticketPanel: store["ticket-panel"],
  supportbotAi: store["supportbot-ai"],
  api: store.api,
  store,
  reloadFile,
  reloadBotConfigs,
  readConfig,
};
