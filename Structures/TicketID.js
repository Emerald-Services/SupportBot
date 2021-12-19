// SupportBot | Emerald Services
// Ticket ID Structure

const fs = require("fs");

class TicketNumberID {
  static async pad() {
    let num = await this.get();
    let n = num + "";
    await this.set(num + 1);
    return n.length >= 4 ? n : new Array(4 - n.length + 1).join("0") + n;
  }

  static async get() {
    let ticketnumberID = await JSON.parse(
      fs.readFileSync("./Data/ticket-panel-id.json", "utf8")
    );
    if (!ticketnumberID.id) {
      return this.set(0);
    } else {
      return ticketnumberID.id;
    }
  }

  static async set(value) {
    let ticketnumberID = await JSON.parse(
      fs.readFileSync("./Data/ticket-panel-id.json", "utf8")
    );

    ticketnumberID.id = value;
    fs.writeFileSync(
      "./Data/ticket-panel-id.json",
      JSON.stringify(ticketnumberID, null, 4),
      (err) => {
        if (err) console.error(err);
      }
    );

    return value;
  }

  static async reset() {
    return await this.set(0);
  }
}

module.exports = TicketNumberID;
