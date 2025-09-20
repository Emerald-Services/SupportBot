// SupportBot | Emerald Services
// Ticket ID Structure

const db = require("./Database")

class TicketNumberID {
  static async pad() {
    let num = await this.get()
    let n = num + ""
    await this.set(num + 1)
    return n.length >= 4 ? n : new Array(4 - n.length + 1).join("0") + n
  }

  static async get() {
    const row = db.getTicketPanel()
    if (!row) return await this.set(0)
    return row.id
  }

  static async set(value) {
    db.saveTicketPanel(`panel-${value}`, "none")
    return value
  }

  static async reset() {
    return await this.set(0)
  }
}

module.exports = TicketNumberID
