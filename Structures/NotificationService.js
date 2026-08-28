const notificationStore = require("./NotificationStore.js");
const { fetchUpdateInfo } = require("./UpdateChecker.js");

function notifyBotRestart(success, errorMessage) {
  if (success) {
    return notificationStore.add({
      type: "bot",
      title: "Bot restarted",
      message:
        "Discord bot reconnected with your latest config. API and dashboard stayed online.",
    });
  }

  return notificationStore.add({
    type: "error",
    title: "Bot failed to restart",
    message: errorMessage || "Check the logs for details.",
    href: "/logs",
  });
}

function notifyUpdateAvailable(info) {
  return notificationStore.add({
    id: "update-available",
    type: "update",
    title: "Update available",
    message: `Version ${info.latest} is ready (you are on ${info.current}).`,
    href: "/settings",
  });
}

function notifyUpdateInstalled(message) {
  return notificationStore.add({
    type: "update",
    title: "Update installed",
    message:
      message ||
      "Files were updated. Restart your server (npm start) to finish applying changes.",
    href: "/settings",
  });
}

function clearUpdateAvailable() {
  notificationStore.dismiss("update-available");
}

async function runUpdateCheck() {
  const info = await fetchUpdateInfo();
  if (info.updateAvailable) {
    notifyUpdateAvailable(info);
  } else {
    clearUpdateAvailable();
  }
  return info;
}

module.exports = {
  notifyBotRestart,
  notifyUpdateAvailable,
  notifyUpdateInstalled,
  clearUpdateAvailable,
  runUpdateCheck,
};
