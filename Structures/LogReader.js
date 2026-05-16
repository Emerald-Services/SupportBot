const fs = require("fs");
const path = require("path");

const LOG_ROOT = path.resolve(__dirname, "../Logs");
const LOG_TYPES = ["Output", "Warn", "Error"];

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

function getLogPath(type, date = todayDate()) {
  return path.join(LOG_ROOT, type, `${type}-${date}.log`);
}

/** Prefer today's file; fall back to the newest log in the folder. */
function resolveLogPath(type) {
  const todayPath = getLogPath(type);
  if (fs.existsSync(todayPath)) return todayPath;

  const dir = path.join(LOG_ROOT, type);
  if (!fs.existsSync(dir)) return todayPath;

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".log"))
    .sort()
    .reverse();

  if (!files.length) return todayPath;
  return path.join(dir, files[0]);
}

function stripAnsi(text) {
  return String(text).replace(/\x1b\[[0-9;]*m/g, "");
}

function parseLogLine(line, type) {
  const trimmed = line.trimEnd();
  if (!trimmed) return null;

  const match = trimmed.match(/^\[([^\]]+)\]\s?(.*)$/);
  if (match) {
    return {
      type,
      timestamp: match[1],
      message: stripAnsi(match[2]),
    };
  }

  return {
    type,
    timestamp: null,
    message: stripAnsi(trimmed),
  };
}

function readFromByte(filePath, fromByte) {
  if (!fs.existsSync(filePath)) {
    return { lines: [], position: 0 };
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    return { lines: [], position: 0 };
  }

  const start = Math.max(0, Math.min(fromByte, stat.size));
  if (start >= stat.size) {
    return { lines: [], position: stat.size };
  }

  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(stat.size - start);
  fs.readSync(fd, buffer, 0, buffer.length, start);
  fs.closeSync(fd);

  const text = buffer.toString("utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);

  return { lines, position: stat.size };
}

function readLastLines(filePath, maxLines) {
  if (!fs.existsSync(filePath)) {
    return { lines: [], position: 0 };
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    return { lines: [], position: 0 };
  }

  const chunkSize = Math.min(stat.size, 512 * 1024);
  const start = Math.max(0, stat.size - chunkSize);
  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(chunkSize);
  fs.readSync(fd, buffer, 0, chunkSize, start);
  fs.closeSync(fd);

  const lines = buffer
    .toString("utf8")
    .split(/\r?\n/)
    .filter((l) => l.length > 0);
  const slice = lines.slice(-maxLines);

  return { lines: slice, position: stat.size };
}

/**
 * @param {string[]} types
 * @param {Record<string, number>} cursor byte offsets per type
 * @param {number} initialLines lines to load when cursor is empty
 */
function fetchLogs(types, cursor = {}, initialLines = 300) {
  const validTypes = types.filter((t) => LOG_TYPES.includes(t));
  const entries = [];
  const nextCursor = { ...cursor };

  for (const type of validTypes) {
    const filePath = resolveLogPath(type);
    const prevPos = cursor[type] ?? 0;
    let lines = [];
    let position = 0;

    if (!fs.existsSync(filePath)) {
      nextCursor[type] = 0;
      continue;
    }

    if (prevPos === 0 && initialLines > 0) {
      const tail = readLastLines(filePath, initialLines);
      lines = tail.lines;
      position = tail.position;
    } else if (prevPos > 0) {
      const chunk = readFromByte(filePath, prevPos);
      lines = chunk.lines;
      position = chunk.position;
    } else {
      // No tail requested and no cursor — skip content, anchor at EOF
      position = fs.statSync(filePath).size;
    }

    nextCursor[type] = position;

    for (const line of lines) {
      const entry = parseLogLine(line, type);
      if (entry) entries.push(entry);
    }
  }

  entries.sort((a, b) => {
    const ta = a.timestamp ? Date.parse(a.timestamp) : 0;
    const tb = b.timestamp ? Date.parse(b.timestamp) : 0;
    return ta - tb;
  });

  return { entries, cursor: nextCursor };
}

function getLogMeta() {
  const date = todayDate();
  return LOG_TYPES.map((type) => {
    const filePath = resolveLogPath(type);
    const exists = fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
    return {
      type,
      date,
      file: exists ? path.basename(filePath) : null,
      size: exists ? fs.statSync(filePath).size : 0,
    };
  });
}

module.exports = {
  LOG_ROOT,
  LOG_TYPES,
  fetchLogs,
  getLogMeta,
  getLogPath,
  resolveLogPath,
};
