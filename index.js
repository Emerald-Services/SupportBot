//      ___                            _    ___        _
//    / __> _ _  ___  ___  ___  _ _ _| |_ | . > ___ _| |_
//     \__ \| | || . \| . \/ . \| '_> | |  | . \/ . \ | |
//     <___/`___||  _/|  _/\___/|_|   |_|  |___/\___/ |_|
//                |_|  |_|
//
//           SupportBot created by Emerald Services
//           Installed with MIT License
//
//           Discord Support: https://emeraldsrv.dev/discord
//           Community Resources: https://community.emeraldsrv.dev

const fs = require("fs");
const path = require("path");

const configStore = require("./Structures/ConfigStore.js");

const Client = require("./Structures/Client.js");
const client = new Client({
  intents: ["Guilds", "GuildMembers", "GuildMessages", "MessageContent"],
});

const { isSetupComplete } = require("./Structures/DashboardSetup.js");
const APIServer = require("./API/server.js");

const api = new APIServer(client);
client.apiServer = api;

const port = api.config?.Port || 25575;
if (api.config?.Enabled) {
  api.start(port);
  if (!isSetupComplete()) {
    console.log(`\n\x1b[33m\x1b[1m[Setup Required] Go to http://localhost:${port}/setup to set up your bot and dashboard.\x1b[0m\n`);
  }
} else {
  console.warn("[Dashboard] API disabled in Configs/api.yml");
}

const token = configStore.supportbot?.General?.Token;
const isPlaceholderToken = !token || token.includes("BOT_TOKEN") || token.includes("CHANGE_ME") || token.length < 30;

if (isPlaceholderToken) {
  console.warn(`\x1b[33m[SupportBot] Bot token is not configured yet. Complete setup at http://localhost:${port}/setup\x1b[0m`);
} else {
  client.start(token);
}

// SupportBot - New Logging System

const logTypes = ["Output", "Warn", "Error"];

if (!fs.existsSync("./Logs")) {
  fs.mkdirSync("./Logs");
}
logTypes.forEach((type) => {
  const dir = `./Logs/${type}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

function logToFile(type, data) {
  const date = new Date().toISOString().split("T")[0];
  const file = path.join(`./Logs/${type}`, `${type}-${date}.log`);
  const timestamp = new Date().toISOString();
  fs.appendFileSync(file, `[${timestamp}] ${data}\n`);

  if (global.apiServer) {
    global.apiServer.broadcast("log", {
      type,
      timestamp,
      message: String(data)
    });
  }
}

const origLog = console.log;
console.log = (...args) => {
  origLog(...args);
  logToFile("Output", args.join(" "));
};

const origWarn = console.warn;
console.warn = (...args) => {
  origWarn(...args);
  logToFile("Warn", args.join(" "));
};

const origError = console.error;
console.error = (...args) => {
  origError(...args);
  logToFile("Error", args.join(" "));
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
