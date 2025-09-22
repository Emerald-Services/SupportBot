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

const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);

const Client = require("./Structures/Client.js");
const client = new Client({
  intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent']
});

client.start(supportbot.General.Token);

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
  const file = path.join(`./logs/${type}`, `${type}-${date}.log`);
  fs.appendFileSync(file, `[${new Date().toISOString()}] ${data}\n`);
}

const origLog = console.log;
console.log = (...args) => {
  origLog(...args);
  logToFile("output", args.join(" "));
};

const origWarn = console.warn;
console.warn = (...args) => {
  origWarn(...args);
  logToFile("warn", args.join(" "));
};

const origError = console.error;
console.error = (...args) => {
  origError(...args);
  logToFile("error", args.join(" "));
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});











