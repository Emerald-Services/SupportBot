const config = require('../../config.js');


class Util {
    constructor(client) {
        this.client = client;
        }
    parseFlags(str) {
        const flags = {}; let
            value;

        const withQuotes = /--(\w{2,})=("(\\"|[^"])*"|'(\\'|[^'])*')/gi;
        while ((value = withQuotes.exec(str))) {
            flags[value[1]] = value[2]
                .replace(/\\["']/g, (i) => i.slice(1))
                .slice(1, -1);
        }
        str = str.replace(withQuotes, '');

        const withoutQuotes = /--(\w{2,})(?:=(\S+))?/gi;
        while ((value = withoutQuotes.exec(str))) flags[value[1]] = value[2] || true;
        str = str.replace(withoutQuotes, '');

        const shortReg = /-([a-z]+)/gi;
        while ((value = shortReg.exec(str))) for (value of value[1]) flags[value] = true;
        str = str.replace(shortReg, '');

        return { flags, content: str };
    }
    duration(ms, opts = { days: false }) {
        let str = '';
        if (ms >= 86400000 && opts.days) (str += `${ms / 86400000 | 0}`.padStart(2, '0') + ':') && (ms -= (ms / 86400000 | 0) * 86400000);
        if (str || ms >= 3600000) (str += `${ms / 3600000 | 0}`.padStart(2, '0') + ':') && (ms -= (ms / 3600000 | 0) * 3600000);
        (str += `${ms / 60000 | 0}`.padStart(2, '0') + ':') && (ms -= (ms / 60000 | 0) * 60000);
        str += `${ms / 1000 | 0}`.padStart(2, '0');
        return str;
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