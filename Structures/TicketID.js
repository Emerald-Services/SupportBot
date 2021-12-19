// SupportBot | Emerald Services
// Ticket ID Structure

const fs = require("fs");

class TicketNumberID {
  static async pad() {
    let n = this.get() + "";
    let z = "0";
    let width = 4;
    await this.set(this.get() + 1);
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

  static get() {
    let ticketnumberID = JSON.parse(
      fs.readFileSync("./Data/TicketData.json", "utf8")
    );

    if (!ticketnumberID.id) {
      ticketnumberID.id = 0;

      fs.writeFileSync(
        "./Data/TicketData.json",
        JSON.stringify(ticketnumberID, null, 4),
        (err) => {
          if (err) console.error(err);
        }
      );

      return 0;
    } else {
      return ticketnumberID.id;
    }
  }

  static set(value) {
    let ticketnumberID = JSON.parse(
      fs.readFileSync("./Data/TicketData.json", "utf8")
    );

    ticketnumberID.id = value;

    fs.writeFileSync(
      "./Data/TicketData.json",
      JSON.stringify(ticketnumberID, null, 4),
      (err) => {
        if (err) console.error(err);
      }
    );

    return value;
  }

  static reset() {
    let ticketnumberID = JSON.parse(
      fs.readFileSync("./Data/TicketData.json", "utf8")
    );

    ticketnumberID.id = 0;

    fs.writeFileSync(
      "./Data/TicketData.json",
      JSON.stringify(ticketnumberID, null, 4),
      (err) => {
        if (err) console.error(err);
      }
    );

    return 0;
  }
}

module.exports = TicketNumberID;
