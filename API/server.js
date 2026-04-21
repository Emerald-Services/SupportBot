const express = require('express');
const cors = require('cors');
const fs = require('fs');
const os = require('os');
const yaml = require('js-yaml');
const YAML = require('yaml'); 
const db = require('../Structures/Database.js');

class APIServer {
    constructor(client) {
        this.client = client;
        this.app = express();

        try {
            const apiCfg = yaml.load(fs.readFileSync('./Configs/api.yml', 'utf8')).API;
            this.config = apiCfg;
        } catch (e) {
            console.error('[API] Failed to load api.yml, defaulting to disabled.');
            this.config = { Enabled: false };
        }

        if (!this.config.Enabled) return;

        this.app.use(cors());
        this.app.use(express.json());

        this.app.use((req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || authHeader !== `Bearer ${this.config.SecretKey}`) {
                return res.status(401).json({ error: 'Unauthorized. Invalid Secret Key.' });
            }
            next();
        });

        this.setupRoutes();
    }

    start(port) {
        const listenPort = port || this.config.Port || 3000;
        this.app.listen(listenPort, () => {
            console.log(`[API] Server running on port ${listenPort}`);
        });
    }

    setupRoutes() {
        this.app.get('/api/stats', async (req, res) => {
            try {
                if (!this.client.user) {
                    return res.json({ success: false, error: 'Bot is still starting up.' });
                }

                let userCount = 0;
                this.client.guilds.cache.forEach(guild => {
                    userCount += guild.memberCount;
                });

                const allTickets = db.getAllTickets() || [];
                const openTickets = allTickets.filter(t => t.open).length;
                const closedTickets = allTickets.filter(t => !t.open).length;

                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const ramPercent = Math.round((usedMem / totalMem) * 100);
                const cpuLoad = os.loadavg()[0].toFixed(2);

                res.json({
                    success: true,
                    data: {
                        bot: {
                            username: this.client.user.username,
                            id: this.client.user.id,
                            avatar: this.client.user.displayAvatarURL(),
                            version: require('../package.json').version,
                            ping: this.client.ws.ping,
                            uptime: process.uptime(),
                        },
                        servers: this.client.guilds.cache.size,
                        users: userCount,
                        tickets: {
                            total: allTickets.length,
                            open: openTickets,
                            closed: closedTickets
                        },
                        hosting: {
                            ram_used: (usedMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                            ram_total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                            ram_percent: ramPercent,
                            cpu_load: cpuLoad,
                            uptime: Math.floor(os.uptime() / 86400) + ' Days'
                        }
                    }
                });
            } catch (err) {
                console.error('[API] Error fetching stats:', err);
                res.status(500).json({ success: false, error: 'Internal Server Error' });
            }
        });

        this.app.get('/api/configs/:file', (req, res) => {
            const validFiles = ['supportbot', 'ticket-panel', 'commands', 'messages', 'supportbot-ai'];
            const file = req.params.file;
            if (!validFiles.includes(file)) return res.status(400).json({ success: false, error: 'Invalid file' });
            try {
                const configData = fs.readFileSync(`./Configs/${file}.yml`, 'utf8');
                res.json({ success: true, data: configData });
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to read config' });
            }
        });

        this.app.put('/api/configs/raw', (req, res) => {
            const validFiles = ['supportbot', 'ticket-panel', 'commands', 'messages', 'supportbot-ai'];
            const file = req.body.filename;
            const content = req.body.content;
            if (!validFiles.includes(file)) return res.status(400).json({ success: false, error: 'Invalid file' });
            try {
                fs.writeFileSync(`./Configs/${file}.yml`, content);
                res.json({ success: true });
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to write config' });
            }
        });

        this.app.get('/api/configs/json/:file', (req, res) => {
            const validFiles = ['supportbot', 'ticket-panel', 'commands', 'messages', 'supportbot-ai'];
            const file = req.params.file;
            if (!validFiles.includes(file)) return res.status(400).json({ success: false, error: 'Invalid file' });
            try {
                const configData = yaml.load(fs.readFileSync(`./Configs/${file}.yml`, 'utf8'));
                res.json({ success: true, data: configData });
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to parse config' });
            }
        });

        this.app.post('/api/configs/update-fields/multi', (req, res) => {
            const updates = req.body;
            if (!updates || typeof updates !== 'object') return res.status(400).json({ success: false, error: 'Invalid updates' });
            try {
                for (const [keyPath, value] of Object.entries(updates)) {
                    const [fileName, path] = keyPath.split(':');
                    const fileContent = fs.readFileSync(`./Configs/${fileName}.yml`, 'utf8');
                    const doc = YAML.parseDocument(fileContent);
                    const keys = path.split('.');
                    doc.setIn(keys, value);
                    fs.writeFileSync(`./Configs/${fileName}.yml`, doc.toString());
                }
                res.json({ success: true });
            } catch (err) {
                console.error('[API] Update failed:', err);
                res.status(500).json({ success: false, error: err.message });
            }
        });

        this.app.post('/api/addons/install', async (req, res) => {
            const { url, filename } = req.body;
            if (!url || !filename) return res.status(400).json({ success: false, error: 'Missing url or filename' });

            try {
                const axios = require('axios');
                const response = await axios({
                    method: 'get',
                    url: url,
                    responseType: 'stream'
                });

                // Ensure Addons directory exists
                if (!fs.existsSync('./Addons')) {
                    fs.mkdirSync('./Addons');
                }

                const writer = fs.createWriteStream(`./Addons/${filename}`);
                response.data.pipe(writer);

                writer.on('finish', () => {
                    res.json({ success: true, message: `Addon ${filename} installed successfully.` });
                });

                writer.on('error', (err) => {
                    console.error('[API] Download failed:', err);
                    res.status(500).json({ success: false, error: 'Failed to write addon file' });
                });

            } catch (err) {
                console.error('[API] Addon install failed:', err);
                res.status(500).json({ success: false, error: 'Failed to download addon' });
            }
        });

        this.app.post('/api/addons/push', (req, res) => {
            const { filename, content } = req.body;
            if (!filename || !content) return res.status(400).json({ success: false, error: 'Missing filename or content' });
            
            const sanitizedFilename = filename.replace(/[^a-z0-9_.-]/gi, '_');
            
            try {
                if (!fs.existsSync('./Addons')) {
                    fs.mkdirSync('./Addons');
                }
                fs.writeFileSync(`./Addons/${sanitizedFilename}`, content);
                res.json({ success: true, message: `Addon ${sanitizedFilename} deployed successfully.` });
            } catch (err) {
                console.error('[API] Push failed:', err);
                res.status(500).json({ success: false, error: 'Failed to write addon file' });
            }
        });

        // --- Nexus Updater API ---
        this.app.post('/api/system/update', async (req, res) => {
            const { url, version } = req.body;
            if (!url) return res.status(400).json({ success: false, error: 'Missing update URL' });

            try {
                const axios = require('axios');
                const { execSync } = require('child_process');
                const path = require('path');

                console.log(`[Updater] Starting update to ${version || 'latest'}...`);

                // 1. Download
                const tempZip = `./update_${Date.now()}.zip`;
                const response = await axios({ method: 'get', url: url, responseType: 'stream' });
                const writer = fs.createWriteStream(tempZip);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                // 2. Extract to temp dir
                const tempDir = `./temp_update_${Date.now()}`;
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

                const isWindows = process.platform === 'win32';
                try {
                    if (isWindows) {
                        execSync(`powershell -Command "Expand-Archive -Path '${tempZip}' -DestinationPath '${tempDir}' -Force"`);
                    } else {
                        execSync(`unzip -o "${tempZip}" -d "${tempDir}"`);
                    }
                } catch (e) {
                    throw new Error(`Extraction failed. Ensure ${isWindows ? 'PowerShell' : 'unzip'} is installed. ${e.message}`);
                }

                // Identify inner directory (sometimes zips contain a root folder)
                let sourcePath = tempDir;
                const items = fs.readdirSync(tempDir);
                if (items.length === 1 && fs.statSync(path.join(tempDir, items[0])).isDirectory()) {
                    sourcePath = path.join(tempDir, items[0]);
                }

                // 3. Smart Config Merge
                const configFiles = ['supportbot', 'commands', 'messages', 'ticket-panel', 'supportbot-ai'];
                configFiles.forEach(cf => {
                    const currentPath = `./Configs/${cf}.yml`;
                    const newPath = path.join(sourcePath, 'Configs', `${cf}.yml`);

                    if (fs.existsSync(currentPath) && fs.existsSync(newPath)) {
                        const currentCfg = yaml.load(fs.readFileSync(currentPath, 'utf8'));
                        const newCfg = yaml.load(fs.readFileSync(newPath, 'utf8'));

                        const merge = (target, source) => {
                            for (const key of Object.keys(source)) {
                                if (source[key] instanceof Object && !Array.isArray(source[key]) && target[key]) {
                                    merge(target[key], source[key]);
                                } else if (target[key] === undefined) {
                                    target[key] = source[key];
                                    console.log(`[Updater] Added missing key: ${key} to ${cf}.yml`);
                                }
                            }
                        };
                        merge(currentCfg, newCfg);
                        fs.writeFileSync(currentPath, YAML.stringify(currentCfg));
                    }
                });

                // 4. Overwrite Core Folders
                const coreFolders = ['API', 'Commands', 'Events', 'Structures'];
                coreFolders.forEach(folder => {
                    const src = path.join(sourcePath, folder);
                    if (fs.existsSync(src)) {
                        if (isWindows) {
                            execSync(`xcopy "${src}" ".\\${folder}" /E /I /Y`);
                        } else {
                            execSync(`cp -R "${src}/"* "./${folder}/"`);
                        }
                    }
                });

                // 5. Update package.json (version only)
                const newPkgPath = path.join(sourcePath, 'package.json');
                if (fs.existsSync(newPkgPath)) {
                    const currentPkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
                    const newPkg = JSON.parse(fs.readFileSync(newPkgPath, 'utf8'));
                    currentPkg.version = newPkg.version;
                    fs.writeFileSync('./package.json', JSON.stringify(currentPkg, null, 2));
                }

                fs.unlinkSync(tempZip);
                if (isWindows) {
                    execSync(`rmdir /s /q "${tempDir}"`);
                } else {
                    execSync(`rm -rf "${tempDir}"`);
                }

                res.json({ success: true, message: 'Update installed successfully. Bot is restarting...' });
                
                // Reboot
                setTimeout(() => process.exit(0), 1000);

            } catch (err) {
                console.error('[Updater] Update failed:', err);
                res.status(500).json({ success: false, error: err.message });
            }
        });

        // --- Transcript API ---
        this.app.get('/api/system/transcripts', (req, res) => {
            const transcriptDir = './Data/Transcripts';
            try {
                if (!fs.existsSync(transcriptDir)) {
                    return res.json({ success: true, data: [] });
                }
                const files = fs.readdirSync(transcriptDir);
                const transcripts = files
                    .filter(f => f.endsWith('-transcript.html'))
                    .map(f => {
                        const stats = fs.statSync(`${transcriptDir}/${f}`);
                        return {
                            id: f.replace('-transcript.html', ''),
                            filename: f,
                            createdAt: stats.mtime
                        };
                    })
                    .sort((a, b) => b.createdAt - a.createdAt);
                res.json({ success: true, data: transcripts });
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to list transcripts' });
            }
        });

        this.app.get('/api/system/transcripts/:id', (req, res) => {
            const id = req.params.id.replace(/[^0-9]/g, ''); // Sanitize ID
            const filePath = `./Data/Transcripts/${id}-transcript.html`;
            try {
                if (!fs.existsSync(filePath)) {
                    return res.status(404).json({ success: false, error: 'Transcript not found' });
                }
                const content = fs.readFileSync(filePath, 'utf8');
                res.json({ success: true, data: content });
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to read transcript' });
            }
        });
    }
}

module.exports = APIServer;
