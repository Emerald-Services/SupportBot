const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { withTimeout } = require("./asyncTimeout.js");

const ADDONS_REPO = "Emerald-Services/Addons";
const ADDONS_BRANCH = "main";
const GITHUB_API = `https://api.github.com/repos/${ADDONS_REPO}/contents`;
const GITHUB_RAW = `https://raw.githubusercontent.com/${ADDONS_REPO}/${ADDONS_BRANCH}`;

const README_PATTERN = /^readme\.md$/i;

function ensureAddonDirs() {
  if (!fs.existsSync("./Addons")) {
    fs.mkdirSync("./Addons", { recursive: true });
  }
  if (!fs.existsSync("./Addons/Configs")) {
    fs.mkdirSync("./Addons/Configs", { recursive: true });
  }
}

async function githubList(dirPath = "") {
  const url = dirPath
    ? `${GITHUB_API}/${encodeURIComponent(dirPath)}?ref=${ADDONS_BRANCH}`
    : `${GITHUB_API}?ref=${ADDONS_BRANCH}`;

  const res = await withTimeout(
    axios.get(url, {
      headers: { Accept: "application/vnd.github+json" },
      timeout: 15_000,
    }),
    18_000,
    "GitHub API request timed out",
  );

  return res.data;
}

async function listCatalogAddons() {
  const root = await githubList("");
  const dirs = root.filter((entry) => entry.type === "dir");

  const addons = [];
  for (const dir of dirs) {
    const summary = await summarizeAddon(dir.name);
    if (summary) addons.push(summary);
  }

  return addons.sort((a, b) => a.name.localeCompare(b.name));
}

async function summarizeAddon(name) {
  const files = await listAddonRepoFiles(name);
  const jsFiles = files.filter((f) => f.name.endsWith(".js"));
  if (jsFiles.length === 0) return null;

  const configFiles = files
    .filter((f) => f.relativePath.startsWith("Configs/"))
    .map((f) => f.name);

  const readme = files.find((f) => README_PATTERN.test(f.name));

  return {
    id: name,
    name,
    description: readme
      ? `Community addon from Emerald-Services/Addons`
      : `Addon from ${name}`,
    repositoryUrl: `https://github.com/${ADDONS_REPO}/tree/${ADDONS_BRANCH}/${name}`,
    jsFiles: jsFiles.map((f) => f.name),
    configFiles,
    fileCount: files.length,
  };
}

async function listAddonRepoFiles(addonName) {
  const files = [];
  const queue = [addonName];

  while (queue.length) {
    const dir = queue.shift();
    const entries = await githubList(dir);

    for (const entry of entries) {
      if (entry.type === "dir") {
        queue.push(entry.path);
        continue;
      }
      if (entry.type !== "file") continue;
      if (README_PATTERN.test(entry.name)) continue;

      const relativePath = entry.path.slice(`${addonName}/`.length);
      files.push({
        name: entry.name,
        path: entry.path,
        relativePath,
        downloadUrl: entry.download_url,
        size: entry.size,
      });
    }
  }

  return files;
}

function mapRepoFileToLocal(addonName, relativePath) {
  const parts = relativePath.split("/").filter(Boolean);
  if (parts[0] === "Configs") {
    return path.join("Addons", "Configs", ...parts.slice(1));
  }
  if (parts.length === 1 && parts[0].endsWith(".js")) {
    return path.join("Addons", parts[0]);
  }
  return path.join("Addons", ...parts);
}

async function downloadFile(url) {
  const res = await withTimeout(
    axios.get(url, { responseType: "arraybuffer", timeout: 30_000 }),
    35_000,
    "Addon file download timed out",
  );
  return Buffer.from(res.data);
}

function listLocalAddonJs() {
  ensureAddonDirs();
  return fs
    .readdirSync("./Addons")
    .filter((f) => f.endsWith(".js") && f !== "addon.js");
}

function listLocalAddonConfigs() {
  ensureAddonDirs();
  const dir = "./Addons/Configs";
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml") || f.endsWith(".json"));
}

function isAddonInstalled(catalogEntry) {
  const localJs = listLocalAddonJs();
  return catalogEntry.jsFiles.every((file) => localJs.includes(file));
}

async function listInstalledAddons(catalog) {
  const localJs = listLocalAddonJs();
  const installed = [];

  for (const entry of catalog) {
    const allPresent = entry.jsFiles.every((file) => localJs.includes(file));
    if (allPresent) {
      installed.push({
        id: entry.id,
        name: entry.name,
        jsFiles: entry.jsFiles,
        configFiles: entry.configFiles.filter((f) => {
          const local = listLocalAddonConfigs();
          return local.includes(f);
        }),
      });
    }
  }

  const orphanJs = localJs.filter(
    (file) => !installed.some((a) => a.jsFiles.includes(file)),
  );
  for (const file of orphanJs) {
    installed.push({
      id: file.replace(/\.js$/, ""),
      name: file.replace(/\.js$/, ""),
      jsFiles: [file],
      configFiles: [],
      custom: true,
    });
  }

  return installed;
}

async function installAddonFromCatalog(addonName) {
  const safeName = String(addonName).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeName) {
    throw new Error("Invalid addon name");
  }

  const summary = await summarizeAddon(safeName);
  if (!summary) {
    throw new Error(`Addon "${safeName}" was not found in the catalog`);
  }

  const files = await listAddonRepoFiles(safeName);
  if (files.length === 0) {
    throw new Error(`Addon "${safeName}" has no installable files`);
  }

  ensureAddonDirs();
  const written = [];

  for (const file of files) {
    const localPath = mapRepoFileToLocal(safeName, file.relativePath);
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const content = await downloadFile(file.downloadUrl);
    fs.writeFileSync(localPath, content);
    written.push(localPath.replace(/\\/g, "/"));
  }

  return {
    addon: summary,
    filesWritten: written,
  };
}

function readAddonConfig(filename) {
  const safe = path.basename(filename);
  if (!/^[a-zA-Z0-9_.-]+\.(yml|yaml|json)$/.test(safe)) {
    throw new Error("Invalid config filename");
  }

  const filePath = path.join("./Addons/Configs", safe);
  if (!fs.existsSync(filePath)) {
    throw new Error("Addon config not found");
  }

  const raw = fs.readFileSync(filePath, "utf8");
  if (safe.endsWith(".json")) {
    return { filename: safe, format: "json", data: JSON.parse(raw), raw };
  }

  const yaml = require("js-yaml");
  return { filename: safe, format: "yaml", data: yaml.load(raw) || {}, raw };
}

function writeAddonConfig(filename, data) {
  const safe = path.basename(filename);
  if (!/^[a-zA-Z0-9_.-]+\.(yml|yaml|json)$/.test(safe)) {
    throw new Error("Invalid config filename");
  }

  ensureAddonDirs();
  const filePath = path.join("./Addons/Configs", safe);
  let content;

  if (safe.endsWith(".json")) {
    content = `${JSON.stringify(data, null, 2)}\n`;
  } else {
    const yaml = require("js-yaml");
    content = yaml.dump(data, { lineWidth: 120, noRefs: true });
  }

  fs.writeFileSync(filePath, content);
  return { filename: safe, path: filePath.replace(/\\/g, "/") };
}

module.exports = {
  ADDONS_REPO,
  listCatalogAddons,
  listInstalledAddons,
  isAddonInstalled,
  installAddonFromCatalog,
  listLocalAddonConfigs,
  readAddonConfig,
  writeAddonConfig,
  mapRepoFileToLocal,
};
