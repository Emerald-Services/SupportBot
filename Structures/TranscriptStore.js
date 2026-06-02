const fs = require('fs');
const path = require('path');

const TRANSCRIPT_DIR = path.join(__dirname, '../Data/Transcripts');
const SETTINGS_FILE = path.join(__dirname, '../Data/transcript-settings.json');

const DEFAULT_SETTINGS = {
    autoDelete: {
        enabled: false,
        afterDays: 30,
    },
    publicAccess: {
        enabled: false,
    },
};

let purgeTimer = null;

function ensureTranscriptDir() {
    if (!fs.existsSync(TRANSCRIPT_DIR)) {
        fs.mkdirSync(TRANSCRIPT_DIR, { recursive: true });
    }
}

function getSettings() {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) {
            return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        }
        const raw = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        const days = Number(raw?.autoDelete?.afterDays);
        return {
            autoDelete: {
                enabled: Boolean(raw?.autoDelete?.enabled),
                afterDays:
                    Number.isFinite(days) && days >= 1
                        ? Math.min(Math.floor(days), 3650)
                        : DEFAULT_SETTINGS.autoDelete.afterDays,
            },
            publicAccess: {
                enabled: Boolean(raw?.publicAccess?.enabled),
            },
        };
    } catch {
        return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }
}

function saveSettings(patch) {
    const current = getSettings();
    const next = {
        autoDelete: {
            enabled:
                patch?.autoDelete?.enabled !== undefined
                    ? Boolean(patch.autoDelete.enabled)
                    : current.autoDelete.enabled,
            afterDays:
                patch?.autoDelete?.afterDays !== undefined
                    ? Math.min(
                          Math.max(Math.floor(Number(patch.autoDelete.afterDays) || 1), 1),
                          3650,
                      )
                    : current.autoDelete.afterDays,
        },
        publicAccess: {
            enabled:
                patch?.publicAccess?.enabled !== undefined
                    ? Boolean(patch.publicAccess.enabled)
                    : current.publicAccess.enabled,
        },
    };

    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf8');
    return next;
}

function normalizeId(rawId) {
    return String(rawId).replace(/[^0-9]/g, '');
}

function readTranscriptFile(rawId) {
    const id = normalizeId(rawId);
    if (!id) return null;
    ensureTranscriptDir();
    const filePath = path.join(TRANSCRIPT_DIR, `${id}-transcript.html`);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    const titleMatch = content.match(/<title>\s*Transcript\s*-\s*([^<]+)\s*<\/title>/i);
    return {
        id,
        filePath,
        filename: `${id}-transcript.html`,
        content,
        ticketName: titleMatch ? titleMatch[1].trim() : null,
    };
}

function listTranscripts() {
    ensureTranscriptDir();
    if (!fs.existsSync(TRANSCRIPT_DIR)) {
        return [];
    }
    return fs
        .readdirSync(TRANSCRIPT_DIR)
        .filter((f) => f.endsWith('-transcript.html'))
        .map((f) => {
            const id = f.replace('-transcript.html', '');
            const stats = fs.statSync(path.join(TRANSCRIPT_DIR, f));
            const parsed = readTranscriptFile(id);
            return {
                id,
                filename: f,
                createdAt: stats.mtime.toISOString(),
                size: stats.size,
                ticketName: parsed?.ticketName ?? null,
            };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function deleteTranscript(rawId) {
    const id = normalizeId(rawId);
    if (!id) return false;
    const filePath = path.join(TRANSCRIPT_DIR, `${id}-transcript.html`);
    if (!fs.existsSync(filePath)) return false;
    fs.unlinkSync(filePath);
    return true;
}

function purgeExpiredTranscripts() {
    const settings = getSettings();
    if (!settings.autoDelete.enabled) {
        return { deleted: 0, skipped: true };
    }

    ensureTranscriptDir();
    const maxAgeMs = settings.autoDelete.afterDays * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - maxAgeMs;
    let deleted = 0;

    for (const f of fs.readdirSync(TRANSCRIPT_DIR)) {
        if (!f.endsWith('-transcript.html')) continue;
        const filePath = path.join(TRANSCRIPT_DIR, f);
        const stats = fs.statSync(filePath);
        if (stats.mtime.getTime() < cutoff) {
            fs.unlinkSync(filePath);
            deleted += 1;
        }
    }

    return { deleted, skipped: false };
}

function notFoundHtml(message = 'Transcript not found') {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Transcript</title>
<style>body{font-family:system-ui,sans-serif;padding:2rem;background:#0b0f14;color:#e6edf3;margin:0}</style></head>
<body><h1>${message}</h1></body></html>`;
}

function servePublicTranscript(req, res) {
    const settings = getSettings();
    if (!settings.publicAccess.enabled) {
        return res.status(404).type('html').send(notFoundHtml('Transcript not found'));
    }

    const transcript = readTranscriptFile(req.params.id);
    if (!transcript) {
        return res.status(404).type('html').send(notFoundHtml('Transcript not found'));
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=120');
    return res.send(transcript.content);
}

function startAutoDeleteScheduler(intervalMs = 60 * 60 * 1000) {
    if (purgeTimer) return;

    const run = () => {
        try {
            const result = purgeExpiredTranscripts();
            if (result.deleted > 0) {
                console.log(
                    `[Transcripts] Auto-deleted ${result.deleted} transcript(s) older than ${getSettings().autoDelete.afterDays} day(s)`,
                );
            }
        } catch (err) {
            console.error('[Transcripts] Auto-delete failed:', err.message);
        }
    };

    run();
    purgeTimer = setInterval(run, intervalMs);
    if (typeof purgeTimer.unref === 'function') {
        purgeTimer.unref();
    }
}

function getPublicUrl(req, id) {
    const settings = getSettings();
    if (!settings.publicAccess.enabled) return null;
    const host = req.get('host');
    const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
    return `${proto}://${host}/transcripts/${id}`;
}

module.exports = {
    TRANSCRIPT_DIR,
    DEFAULT_SETTINGS,
    getSettings,
    saveSettings,
    readTranscriptFile,
    listTranscripts,
    deleteTranscript,
    purgeExpiredTranscripts,
    servePublicTranscript,
    startAutoDeleteScheduler,
    getPublicUrl,
};
