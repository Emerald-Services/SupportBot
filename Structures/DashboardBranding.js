const fs = require('fs');
const path = require('path');

const BRANDING_DIR = path.join(__dirname, '../Data/branding');
const BRANDING_FILE = path.join(BRANDING_DIR, 'branding.json');
const FAVICON_BASENAME = 'favicon';

const DEFAULTS = {
    title: 'SupportBot',
    pageTitle: 'SupportBot Dashboard',
    faviconFile: null,
    faviconMime: null,
    updatedAt: null,
};

const ALLOWED_MIME = new Set([
    'image/png',
    'image/jpeg',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/svg+xml',
    'image/webp',
]);

const MIME_EXT = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/x-icon': '.ico',
    'image/vnd.microsoft.icon': '.ico',
    'image/svg+xml': '.svg',
    'image/webp': '.webp',
};

function ensureDir() {
    if (!fs.existsSync(BRANDING_DIR)) {
        fs.mkdirSync(BRANDING_DIR, { recursive: true });
    }
}

function readBranding() {
    ensureDir();
    if (!fs.existsSync(BRANDING_FILE)) {
        return { ...DEFAULTS };
    }
    try {
        const raw = JSON.parse(fs.readFileSync(BRANDING_FILE, 'utf8'));
        return {
            title: String(raw.title || DEFAULTS.title).slice(0, 64),
            pageTitle: String(raw.pageTitle || DEFAULTS.pageTitle).slice(0, 80),
            faviconFile: raw.faviconFile || null,
            faviconMime: raw.faviconMime || null,
            updatedAt: raw.updatedAt || null,
        };
    } catch {
        return { ...DEFAULTS };
    }
}

function writeBranding(data) {
    ensureDir();
    const next = {
        title: String(data.title || DEFAULTS.title).slice(0, 64),
        pageTitle: String(data.pageTitle || DEFAULTS.pageTitle).slice(0, 80),
        faviconFile: data.faviconFile ?? null,
        faviconMime: data.faviconMime ?? null,
        updatedAt: Date.now(),
    };
    fs.writeFileSync(BRANDING_FILE, JSON.stringify(next, null, 2), 'utf8');
    return next;
}

function publicPayload(branding) {
    const hasFavicon = Boolean(branding.faviconFile);
    return {
        title: branding.title,
        pageTitle: branding.pageTitle,
        hasFavicon,
        faviconUrl: hasFavicon ? '/api/branding/favicon' : null,
        updatedAt: branding.updatedAt,
    };
}

function updateBranding({ title, pageTitle }) {
    const current = readBranding();
    return writeBranding({
        ...current,
        title: title !== undefined ? title : current.title,
        pageTitle: pageTitle !== undefined ? pageTitle : current.pageTitle,
    });
}

function removeExistingFavicons() {
    if (!fs.existsSync(BRANDING_DIR)) return;
    for (const file of fs.readdirSync(BRANDING_DIR)) {
        if (file.startsWith(`${FAVICON_BASENAME}.`)) {
            fs.unlinkSync(path.join(BRANDING_DIR, file));
        }
    }
}

function saveFaviconFromBase64(dataUrl) {
    const match = String(dataUrl || '').match(
        /^data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)$/,
    );
    if (!match) {
        throw new Error('Invalid image data. Upload a PNG, ICO, SVG, or WebP file.');
    }

    const mime = match[1];
    if (!ALLOWED_MIME.has(mime)) {
        throw new Error('Unsupported image type. Use PNG, ICO, SVG, JPEG, or WebP.');
    }

    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 512 * 1024) {
        throw new Error('Favicon must be 512 KB or smaller.');
    }

    ensureDir();
    removeExistingFavicons();

    const ext = MIME_EXT[mime] || '.png';
    const filename = `${FAVICON_BASENAME}${ext}`;
    const filePath = path.join(BRANDING_DIR, filename);
    fs.writeFileSync(filePath, buffer);

    const current = readBranding();
    return writeBranding({
        ...current,
        faviconFile: filename,
        faviconMime: mime,
    });
}

function clearFavicon() {
    removeExistingFavicons();
    const current = readBranding();
    return writeBranding({
        ...current,
        faviconFile: null,
        faviconMime: null,
    });
}

function getFaviconPath() {
    const branding = readBranding();
    if (!branding.faviconFile) return null;
    const filePath = path.join(BRANDING_DIR, branding.faviconFile);
    if (!fs.existsSync(filePath)) return null;
    return { filePath, mime: branding.faviconMime || 'image/png' };
}

function resetBranding() {
    clearFavicon();
    return writeBranding({ ...DEFAULTS });
}

module.exports = {
    readBranding,
    writeBranding,
    publicPayload,
    updateBranding,
    saveFaviconFromBase64,
    clearFavicon,
    getFaviconPath,
    resetBranding,
    DEFAULTS,
};
