const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { withTimeout } = require("./asyncTimeout.js");
const AdmZip = require("adm-zip");
const yaml = require("js-yaml");

const EMERALD_API = "https://emeraldsrv.dev/api/v1";

function getApiKey() {
  try {
    if (fs.existsSync("./Configs/api.yml")) {
      const config = yaml.load(fs.readFileSync("./Configs/api.yml", "utf8"));
      return config?.API?.EmeraldAPIKey || "";
    }
  } catch (e) {
    console.error("Failed to read api.yml:", e);
  }
  return "";
}

function ensureAddonDirs() {
  if (!fs.existsSync("./Addons")) {
    fs.mkdirSync("./Addons", { recursive: true });
  }
  if (!fs.existsSync("./Addons/Configs")) {
    fs.mkdirSync("./Addons/Configs", { recursive: true });
  }
}

async function listCatalogAddons() {
  const key = getApiKey();
  if (!key) throw new Error("EmeraldAPIKey not configured in api.yml");

  const res = await withTimeout(
    axios.get(`${EMERALD_API}/resources`, {
      headers: { Authorization: `Bearer ${key}` },
      timeout: 15_000,
    }),
    18_000,
    "Emerald API request timed out",
  );

  if (res.data.status !== "success") {
    throw new Error(res.data.message || "Failed to fetch catalog");
  }

  return res.data.data.map(item => ({
    id: item.id.toString(),
    name: item.title,
    slug: item.slug,
    description: `Emerald Services Resource - ${item.slug}`,
    price: item.price,
    is_external: item.is_external,
    external_store: item.external_store,
    repositoryUrl: item.external_url || `https://emeraldsrv.dev`,
    jsFiles: [],
    configFiles: []
  })).sort((a, b) => a.name.localeCompare(b.name));
}

async function downloadFile(id) {
  const key = getApiKey();
  const res = await withTimeout(
    axios.get(`${EMERALD_API}/download?id=${id}`, {
      headers: { Authorization: `Bearer ${key}` },
      responseType: "arraybuffer", 
      timeout: 30_000 
    }),
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
  return localJs.some(f => f.includes(catalogEntry.slug) || f.includes(catalogEntry.id.toString()) || f.includes(catalogEntry.name.replace(/ /g, '')));
}

async function listInstalledAddons(catalog) {
  const localJs = listLocalAddonJs();
  const installed = [];

  for (const file of localJs) {
    const name = file.replace(/\.js$/, "");
    const match = catalog.find(c => c.slug === name || c.id.toString() === name || c.name.replace(/ /g, '') === name);
    
    installed.push({
      id: match ? match.id : name,
      name: match ? match.name : name,
      jsFiles: [file],
      configFiles: listLocalAddonConfigs().filter(f => f.startsWith(name)),
      custom: !match
    });
  }
  return installed;
}

async function installAddonFromCatalog(addonId) {
  const catalog = await listCatalogAddons();
  const addon = catalog.find(c => c.id === addonId.toString());
  
  if (!addon) {
    throw new Error(`Addon not found in catalog`);
  }

  ensureAddonDirs();
  const content = await downloadFile(addon.id);
  
  const zip = new AdmZip(content);
  zip.extractAllTo("./Addons", true);

  return {
    addon: addon,
    filesWritten: [],
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
  listCatalogAddons,
  listInstalledAddons,
  isAddonInstalled,
  installAddonFromCatalog,
  listLocalAddonConfigs,
  readAddonConfig,
  writeAddonConfig,
};
