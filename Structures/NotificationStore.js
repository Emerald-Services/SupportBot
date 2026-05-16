const MAX_NOTIFICATIONS = 50;

/** @type {Map<string, object>} */
const byId = new Map();
/** @type {string[]} */
let order = [];

/**
 * @param {object} input
 * @param {string} [input.id] Stable id replaces existing (e.g. update-available)
 */
function add(input) {
  const id =
    input.id ||
    `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const item = {
    id,
    type: input.type || "info",
    title: input.title || "Notification",
    message: input.message || "",
    href: input.href || null,
    createdAt: input.createdAt || Date.now(),
    read: false,
  };

  if (byId.has(id)) {
    order = order.filter((x) => x !== id);
  }

  byId.set(id, item);
  order.unshift(id);

  while (order.length > MAX_NOTIFICATIONS) {
    const removed = order.pop();
    if (removed) byId.delete(removed);
  }

  return item;
}

function list() {
  return order.map((id) => byId.get(id)).filter(Boolean);
}

function unreadCount() {
  let n = 0;
  for (const item of byId.values()) {
    if (!item.read) n++;
  }
  return n;
}

function markRead(ids) {
  if (ids === "all") {
    for (const item of byId.values()) {
      item.read = true;
    }
    return;
  }
  for (const id of ids) {
    const item = byId.get(id);
    if (item) item.read = true;
  }
}

function dismiss(id) {
  if (!byId.has(id)) return false;
  byId.delete(id);
  order = order.filter((x) => x !== id);
  return true;
}

function clear() {
  byId.clear();
  order = [];
}

module.exports = {
  add,
  list,
  unreadCount,
  markRead,
  dismiss,
  clear,
};
