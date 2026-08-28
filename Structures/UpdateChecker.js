const fs = require("fs");
const path = require("path");

const REPOSITORIES = [
  { id: "bot", name: "SupportBot", repo: "Emerald-Services/SupportBot", branch: "release" },
  { id: "dashboard", name: "SupportBot Dashboard", repo: "Emerald-Services/SupportBot-Dashboard", branch: "release" }
];

function compareVersions(a, b) {
  const pa = String(a)
    .replace(/^v/i, "")
    .split(".")
    .map((n) => parseInt(n, 10) || 0);
  const pb = String(b)
    .replace(/^v/i, "")
    .split(".")
    .map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

async function fetchUpdateInfo() {
  const axios = require("axios");
  const pkgPath = path.join(__dirname, "../package.json");
  const currentPkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const currentVersion = currentPkg.version;

  const checks = [];

  for (const target of REPOSITORIES) {
    let installedVersion = target.id === "bot" ? currentPkg.version : (currentPkg.dashboardVersion || "1.0.0");
    let latest = installedVersion;
    try {
      const pkgUrl = target.id === 'dashboard' 
        ? `https://raw.githubusercontent.com/${target.repo}/${target.branch}/dashboard/package.json`
        : `https://raw.githubusercontent.com/${target.repo}/${target.branch}/package.json`;
        
      const remoteRes = await axios.get(pkgUrl, {
        timeout: 15000,
        headers: { "User-Agent": "SupportBot-Updater" },
      });
      if (remoteRes.data && remoteRes.data.version) {
        latest = remoteRes.data.version;
      }
    } catch (e) {
      console.warn(`[Updater] Failed to check ${target.repo} for updates.`);
    }

    const updateAvailable = compareVersions(latest, installedVersion) > 0;

    checks.push({
      id: target.id,
      name: target.name,
      current: installedVersion,
      latest,
      updateAvailable,
      repository: `https://github.com/${target.repo}`,
      branch: target.branch,
      zipUrl: `https://github.com/${target.repo}/archive/refs/heads/${target.branch}.zip`,
    });
  }

  return checks;
}

module.exports = {
  compareVersions,
  fetchUpdateInfo,
  REPOSITORIES,
};
