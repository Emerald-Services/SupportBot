const config = require('../../config.js');


class Util {
    constructor(client) {
        this.client = client;
        }
    
    async uploadToHastebin(body, options = { url: 'https://hastebin.com' }) {
        const res = await require('node-fetch')(`${options.url}/documents`, {
            body,
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            }
        });
        const json = await res.json();
        return {
            key: json.key,
            url: `${options.url}/${json.key}`
        }
    }
    
}

module.exports = Util;
