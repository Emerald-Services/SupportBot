// SupportBot Utility
// Ticket Numbers

const discord = require("discord.js")
const fs = require("fs");

const yaml = require('js-yaml');
const supportbot = yaml.load(fs.readFileSync('./supportbot-config.yml', 'utf8'));

class TicketId {
    
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
    
        let ticketIds = JSON.parse(fs.readFileSync("./storage/tickets.json", "utf8"));

        if (!ticketIds[guildId]) {
            ticketIds[guildId] = {
                id: 0
            }

            fs.writeFileSync("./storage/tickets.json", JSON.stringify(ticketIds, null, 4), err => {
                if (err) console.log(err);
            });

            return 0;
    
            
        } else {
            return ticketIds[guildId].id;
        }
    }
    
    static set(guildId, value) {
        let ticketIds = JSON.parse(fs.readFileSync("./storage/tickets.json", "utf8"));
        
        ticketIds[guildId] = {
            id: value
        }

        fs.writeFileSync("./storage/tickets.json", JSON.stringify(ticketIds, null, 4), err => {
            if (err) console.log(err);
        });

        return value;
    }
    
    static reset(guildId) {
        let ticketIds = JSON.parse(fs.readFileSync("./storage/tickets.json", "utf8"));
        
        ticketIds[guildId] = {
            id: 0
        }

        fs.writeFileSync("./storage/tickets.json", JSON.stringify(ticketIds, null, 4), err => {
            if (err) console.log(err);
        });

        return 0;
    }
}

module.exports = TicketId;
