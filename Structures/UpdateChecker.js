const fs = require("fs");
const path = require("path");

const UPDATE_REPO = "C-h-a-r/SupportBot-Dashboard";
const UPDATE_BRANCH = "release";

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
  const current = currentPkg.version;

  const remoteRes = await axios.get(
    `https://raw.githubusercontent.com/${UPDATE_REPO}/${UPDATE_BRANCH}/package.json`,
    {
      timeout: 15000,
      headers: { "User-Agent": "SupportBot-Dashboard" },
    },
  );

  const latest = remoteRes.data?.version || current;
  const updateAvailable = compareVersions(latest, current) > 0;

  return {
    current,
    latest,
    updateAvailable,
    repository: `https://github.com/${UPDATE_REPO}`,
    branch: UPDATE_BRANCH,
    zipUrl: `https://github.com/${UPDATE_REPO}/archive/refs/heads/${UPDATE_BRANCH}.zip`,
  };
}

module.exports = {
  compareVersions,
  fetchUpdateInfo,
  UPDATE_REPO,
  UPDATE_BRANCH,
};
