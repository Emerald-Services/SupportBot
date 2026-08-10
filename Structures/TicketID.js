// SupportBot | Emerald Services
// Ticket ID Structure

const db = require("./Database");

class TicketNumberID {
  static async pad() {
    let num = await this.get();
    let n = num + "";
    await this.set(num + 1);
    return n.length >= 4 ? n : new Array(4 - n.length + 1).join("0") + n;
  }

  static async get() {
    const settings = db.getSettings ? db.getSettings() : {};
    if (typeof settings.ticket_counter === "number") {
      return settings.ticket_counter;
    }

    const row = db.getTicketPanel ? db.getTicketPanel() : null;
    if (row && typeof row.message_id === "string" && row.message_id.startsWith("panel-")) {
      const parsed = parseInt(row.message_id.replace("panel-", ""), 10);
      if (!isNaN(parsed)) return parsed;
    }

    if (row && typeof row.id === "number" && row.id < 1000000) {
      return row.id;
    }

    return 0;
  }

  static async set(value) {
    const settings = db.getSettings ? db.getSettings() : {};
    settings.ticket_counter = value;
    if (db.saveSettings) db.saveSettings(settings);
    if (db.saveTicketPanel) db.saveTicketPanel(`panel-${value}`, "none");
    return value;
  }

  static async reset() {
    return await this.set(0);
  }
}

module.exports = TicketNumberID;
