// SupportBot Utility
// Ticket Numbers

const discord = require("discord.js")
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

class TicketNumberID {
    
        static pad(guildId) {
            let n = this.get(guildId) + '';
            let z = '0';
            let width = 4;
            setTimeout(() => {
                this.set(guildId, this.get(guildId) + 1);
            }, 50);
            return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }
    
    static get(guildId) {
    
        let ticketnumberID = JSON.parse(fs.readFileSync("./storage/tickets.json", "utf8"));

        if (!ticketnumberID[guildId]) {
            ticketnumberID[guildId] = {
                id: 0
            }

            fs.writeFileSync("./storage/tickets.json", JSON.stringify(ticketnumberID, null, 4), err => {
                if (err) console.log(err);
            });

            return 0;
    
            
        } else {
            return ticketnumberID[guildId].id;
        }
    }
    
    static set(guildId, value) {
        let ticketnumberID = JSON.parse(fs.readFileSync("./storage/tickets.json", "utf8"));
        
        ticketnumberID[guildId] = {
            id: value
        }

        fs.writeFileSync("./storage/tickets.json", JSON.stringify(ticketnumberID, null, 4), err => {
            if (err) console.log(err);
        });

        return value;
    }
    
    static reset(guildId) {
        let ticketnumberID = JSON.parse(fs.readFileSync("./storage/tickets.json", "utf8"));
        
        ticketnumberID[guildId] = {
            id: 0
        }

        fs.writeFileSync("./storage/tickets.json", JSON.stringify(ticketnumberID, null, 4), err => {
            if (err) console.log(err);
        });

        return 0;
    }
}

module.exports = TicketNumberID;
