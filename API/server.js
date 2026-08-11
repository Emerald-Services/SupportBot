const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');
const YAML = require('yaml');
const db = require('../Structures/Database.js');
const configStore = require('../Structures/ConfigStore.js');
const { reloadBot, restartDiscordBot } = require('../Structures/BotReload.js');
const { LOG_TYPES, fetchLogs, getLogMeta } = require('../Structures/LogReader.js');
const { evaluateAllModules } = require('../Structures/ModuleStatus.js');
const { evaluateDashboardAlerts } = require('../Structures/DashboardAlerts.js');
const { getBotInviteUrl } = require('../Structures/BotInvite.js');
const notificationStore = require('../Structures/NotificationStore.js');
const {
    notifyBotRestart,
    notifyUpdateInstalled,
    runUpdateCheck,
} = require('../Structures/NotificationService.js');
const {
    SESSION_COOKIE,
    signSession,
    verifySession,
    createSessionPayload,
    sessionCookieOptions,
} = require('../Structures/DashboardSession.js');
const {
    OAUTH_STATE_COOKIE,
    OAUTH_REDIRECT_COOKIE,
    getTrustProxySetting,
    resolveOAuthRedirectUri,
    isSecureRequest,
    buildAuthorizeUrl,
    exchangeCode,
    fetchDiscordUser,
    createOAuthState,
    oauthStateCookieOptions,
    oauthRedirectCookieOptions,
    isOAuthConfigured,
    discordAvatarUrl,
} = require('../Structures/DiscordOAuth.js');
const {
    bootstrapFromOAuth,
    getAccess,
    canLogin,
    formatPublicUser,
    syncDiscordProfile,
    listUsers,
    addUser,
    updateUser,
    removeUser,
    hasPermission,
    canAccessConfig,
    ROLES,
    CONFIG_FILES,
} = require('../Structures/DashboardUserStore.js');
const {
    grantServiceAccess,
    forbid,
    assertConfigFilesEditable,
    fullPermissions,
} = require('../Structures/DashboardAuth.js');
const {
    syncGuildHealth,
    leaveGuild,
    fetchGuildResources,
    clearGuildResourcesCache,
} = require('../Structures/GuildManager.js');
const { withTimeout } = require('../Structures/asyncTimeout.js');
const transcriptTemplate = require('../Structures/TranscriptTemplate.js');
const transcriptStore = require('../Structures/TranscriptStore.js');
const { refreshSlashCommands } = require('../Structures/BotReload.js');
const {
    isSetupComplete,
    getSetupStatus,
    validateSetupPayload,
    applySetup,
} = require('../Structures/DashboardSetup.js');
const dashboardBranding = require('../Structures/DashboardBranding.js');
const {
    listCatalogAddons,
    listInstalledAddons,
    installAddonFromCatalog,
    listLocalAddonConfigs,
    readAddonConfig,
    writeAddonConfig,
} = require('../Structures/AddonCatalog.js');

const DASHBOARD_DIR = path.join(__dirname, '../public/dashboard');
const UPDATE_REPO = 'Emerald-Services/SupportBot-Dashboard';
const UPDATE_BRANCH = 'release';
const UPDATE_ZIP_URL = `https://github.com/${UPDATE_REPO}/archive/refs/heads/${UPDATE_BRANCH}.zip`;

class APIServer {
    constructor(client) {
        this.client = client;
        this.app = express();

        this.sseClients = new Set();
        global.apiServer = this;

        try {
            const apiCfg = yaml.load(fs.readFileSync('./Configs/api.yml', 'utf8')).API;
            this.config = apiCfg;
        } catch (e) {
            console.error('[API] Failed to load api.yml, defaulting to disabled.');
            this.config = { Enabled: false };
        }

        if (!this.config.Enabled) return;

        this.oauth = this.config.OAuth || {};
        bootstrapFromOAuth(this.oauth);

        const trustProxy = getTrustProxySetting(this.config);
        if (trustProxy !== false) {
            this.app.set('trust proxy', trustProxy);
        }

        this.app.use(cors({ origin: true, credentials: true }));
        this.app.use(cookieParser());
        this.app.use(express.json({ limit: '2mb' }));

        this.app.get('/api/branding', (req, res) => {
            try {
                const branding = dashboardBranding.readBranding();
                res.json({
                    success: true,
                    data: dashboardBranding.publicPayload(branding),
                });
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to load branding' });
            }
        });

        this.app.get('/api/branding/favicon', (req, res) => {
            try {
                const favicon = dashboardBranding.getFaviconPath();
                if (!favicon) {
                    return res.status(404).end();
                }
                res.setHeader('Cache-Control', 'public, max-age=300');
                res.type(favicon.mime);
                return res.sendFile(favicon.filePath);
            } catch (err) {
                return res.status(500).end();
            }
        });

        this.app.get('/api/health', (req, res) => {
            const guild =
                this.client?.user ? syncGuildHealth(this.client) : null;
            res.json({
                success: true,
                dashboard: fs.existsSync(DASHBOARD_DIR),
                botReady: Boolean(this.client?.user) && !this.client?.__restarting,
                botRestarting: Boolean(this.client?.__restarting),
                oauthEnabled: isOAuthConfigured(this.oauth),
                setupComplete: isSetupComplete(),
                guild,
            });
        });

        this.setupOnboardingRoutes();
        this.setupAuthRoutes();

        this.app.get('/transcripts/:id', (req, res) => {
            transcriptStore.servePublicTranscript(req, res);
        });

        const api = express.Router();
        api.use((req, res, next) => this.authenticate(req, res, next));
        this.apiRouter = api;
        this.setupRoutes();
        this.app.use('/api', api);

        this.setupDashboard();

        this.app.use((err, req, res, next) => {
            if (res.headersSent) return next(err);
            console.error('[API] Unhandled error:', err);
            res.status(500).json({
                success: false,
                error: err.message || 'Internal server error',
            });
        });
    }

    authenticate(req, res, next) {
        const secret = this.config.SecretKey;
        const session = verifySession(req.cookies?.[SESSION_COOKIE], secret);

        if (session?.userId) {
            const access = getAccess(session.userId, this.oauth);
            if (access) {
                req.dashboardUser = session;
                req.dashboardPermissions = access.permissions;
                req.dashboardRole = access.role;
                req.dashboardIsOwner = access.isOwner;

                // --- Impersonation / View as Group Mode ---
                const impersonateGroupId = req.headers['x-impersonate-group'];
                if (impersonateGroupId && (access.isOwner || hasPermission(access.permissions, 'users.manage'))) {
                    const groupStore = require('../Structures/DashboardGroupStore.js');
                    const group = groupStore.getGroup(impersonateGroupId);
                    if (group) {
                        req.dashboardPermissions = group.permissions;
                        req.dashboardImpersonatingGroup = group;
                    }
                }

                return next();
            }
        }

        const authHeader = req.headers.authorization;
        const tokenQuery = req.query.token;
        if (authHeader === `Bearer ${secret}` || (tokenQuery && tokenQuery === secret)) {
            grantServiceAccess(req);
            return next();
        }

        return res.status(401).json({
            error: 'Unauthorized. Sign in with Discord.',
        });
    }

    broadcast(event, data) {
        if (!this.sseClients || this.sseClients.size === 0) return;
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        for (const clientRes of this.sseClients) {
            try {
                clientRes.write(payload);
            } catch (e) {
                this.sseClients.delete(clientRes);
            }
        }
    }

    requirePermission(permission) {
        return (req, res, next) => {
            if (req.dashboardService) return next();
            if (req.dashboardIsOwner && !req.dashboardImpersonatingGroup) return next();
            if (hasPermission(req.dashboardPermissions, permission)) return next();
            return forbid(res);
        };
    }

    requireConfigAccess(mode = 'view') {
        return (req, res, next) => {
            if (req.dashboardService) return next();
            if (req.dashboardIsOwner && !req.dashboardImpersonatingGroup) return next();
            const file = req.params?.file || req.body?.filename;
            if (!file) return next();
            if (!canAccessConfig(req.dashboardPermissions, file, mode)) {
                return forbid(res);
            }
            return next();
        };
    }

    respondAuthUser(req, res, session) {
        const access = getAccess(session.userId, this.oauth);
        if (!access) {
            return res.status(401).json({ success: false, error: 'Not signed in' });
        }

        return res.json({
            success: true,
            data: formatPublicUser(
                access.entry,
                access,
                {
                    id: session.userId,
                    username: session.username,
                    global_name: session.globalName,
                    avatar: session.avatar,
                },
            ),
        });
    }

    setupOnboardingRoutes() {
        this.app.get('/api/setup/status', (req, res) => {
            try {
                res.json({ success: true, data: getSetupStatus(req) });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message });
            }
        });

        this.app.post('/api/setup/validate', async (req, res) => {
            if (isSetupComplete()) {
                return res.status(403).json({
                    success: false,
                    error: 'Setup is already complete.',
                });
            }
            try {
                const data = await validateSetupPayload(req.body || {});
                res.json({ success: true, data });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message });
            }
        });

        this.app.post('/api/setup/complete', async (req, res) => {
            if (isSetupComplete()) {
                return res.status(403).json({
                    success: false,
                    error: 'Setup is already complete.',
                });
            }

            try {
                const body = req.body || {};
                const validation = await validateSetupPayload(body);
                if (!validation.ok) {
                    return res.status(400).json({
                        success: false,
                        error: 'Fix validation errors before saving.',
                        data: validation,
                    });
                }

                applySetup(body);
                this.config = configStore.api?.API || configStore.api;
                this.oauth = this.config.OAuth || {};
                bootstrapFromOAuth(this.oauth);

                let botRestart = { success: false, error: 'Bot client not available' };
                if (this.client) {
                    try {
                        botRestart = await restartDiscordBot(this.client);
                    } catch (restartErr) {
                        botRestart = { success: false, error: restartErr.message };
                    }
                }

                res.json({
                    success: true,
                    message: 'Setup saved. Restart the server for changes to take effect, then sign in with Discord.',
                    data: { setupComplete: true, botRestart },
                });
            } catch (err) {
                console.error('[API] Setup failed:', err);
                res.status(400).json({ success: false, error: err.message });
            }
        });
    }

    setupAuthRoutes() {
        const secret = this.config.SecretKey;
        const oauth = this.oauth;
        const apiConfig = this.config;

        this.app.get('/api/auth/discord', (req, res) => {
            if (!isSetupComplete() || !isOAuthConfigured(oauth)) {
                return res.redirect('/setup');
            }

            const redirectUri = resolveOAuthRedirectUri(req, oauth, apiConfig);
            const state = createOAuthState();
            const cookieOpts = oauthStateCookieOptions(req, oauth, apiConfig);

            res.cookie(OAUTH_STATE_COOKIE, state, cookieOpts);
            res.cookie(OAUTH_REDIRECT_COOKIE, redirectUri, oauthRedirectCookieOptions(req, oauth, apiConfig));
            res.redirect(buildAuthorizeUrl(oauth, state, redirectUri));
        });

        this.app.get('/api/auth/discord/callback', async (req, res) => {
            if (!isSetupComplete() || !isOAuthConfigured(oauth)) {
                return res.redirect('/setup');
            }

            const { code, state, error } = req.query;
            if (error) {
                return res.redirect(`/login?error=${encodeURIComponent(String(error))}`);
            }
            if (!code || !state) {
                return res.redirect('/login?error=missing_code');
            }

            const savedState = req.cookies?.[OAUTH_STATE_COOKIE];
            const savedRedirect = req.cookies?.[OAUTH_REDIRECT_COOKIE];
            const cookieOpts = oauthStateCookieOptions(req, oauth, apiConfig);

            res.clearCookie(OAUTH_STATE_COOKIE, { path: '/', secure: cookieOpts.secure });
            res.clearCookie(OAUTH_REDIRECT_COOKIE, { path: '/', secure: cookieOpts.secure });

            if (!savedState || savedState !== state) {
                return res.redirect('/login?error=invalid_state');
            }

            const redirectUri =
                savedRedirect || resolveOAuthRedirectUri(req, oauth, apiConfig);

            try {
                const accessToken = await exchangeCode(oauth, String(code), redirectUri);
                const user = await fetchDiscordUser(accessToken);

                if (!canLogin(user.id, oauth)) {
                    return res.redirect('/login?error=not_allowed');
                }

                syncDiscordProfile(user.id, {
                    username: user.username,
                    globalName: user.global_name || null,
                    avatar: user.avatar || null,
                });

                const payload = createSessionPayload(user);
                const token = signSession(payload, secret);
                res.cookie(
                    SESSION_COOKIE,
                    token,
                    sessionCookieOptions(undefined, {
                        secure: isSecureRequest(req, oauth, apiConfig),
                    }),
                );
                res.redirect('/');
            } catch (err) {
                console.error('[API] Discord OAuth callback failed:', err.message);
                res.redirect('/login?error=oauth_failed');
            }
        });

        this.app.get('/api/auth/me', (req, res) => {
            const session = verifySession(req.cookies?.[SESSION_COOKIE], secret);
            if (!session?.userId) {
                return res.status(401).json({ success: false, error: 'Not signed in' });
            }
            return this.respondAuthUser(req, res, session);
        });

        this.app.post('/api/auth/logout', (req, res) => {
            res.clearCookie(SESSION_COOKIE, { path: '/' });
            res.json({ success: true });
        });
    }

    resolveDashboardDir() {
        const candidates = [
            DASHBOARD_DIR,
            path.join(process.cwd(), 'public', 'dashboard'),
        ];
        for (const dir of candidates) {
            if (fs.existsSync(path.join(dir, 'index.html'))) {
                return dir;
            }
        }
        return null;
    }

    setupDashboard() {
        const dashboardDir = this.resolveDashboardDir();
        const port = this.config.Port || 3000;

        if (!dashboardDir) {
            console.warn(
                '[API] Dashboard UI missing — add the public/dashboard/ folder from the repository (index.html + assets/).',
            );
            this.app.get('/', (req, res) => {
                res.status(503).type('html').send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>SupportBot Dashboard</title>
<style>body{font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;color:#e8e8f0;background:#0c0c10}
h1{font-size:1.25rem}a{color:#a78bfa}</style></head><body>
<h1>Dashboard files not found</h1>
<p>The API is running, but <code>public/dashboard/</code> is missing from this install (no <code>index.html</code>).</p>
<p>Clone or download the repo including <strong>public/dashboard/</strong>, then restart the bot.</p>
<p><a href="/api/health">Check API health</a></p>
</body></html>`);
            });
            return;
        }

        console.log(`[API] Serving dashboard from ${dashboardDir}`);

        this.app.use(
            express.static(dashboardDir, {
                index: 'index.html',
                fallthrough: true,
            }),
        );

        this.app.use((req, res, next) => {
            if (req.method !== 'GET' && req.method !== 'HEAD') return next();
            if (req.path.startsWith('/api')) return next();
            res.sendFile(path.join(dashboardDir, 'index.html'), (err) => {
                if (err) next(err);
            });
        });

        console.log('[API] Dashboard available at http://localhost:' + port);
    }

    start(port) {
        if (this._httpServer) {
            return this._httpServer;
        }

        const listenPort = port || this.config.Port || 3000;
        transcriptStore.startAutoDeleteScheduler();
        this._httpServer = this.app.listen(listenPort, () => {
            console.log(`[API] Server running on port ${listenPort}`);
            this.startNotificationJobs();
        });

        // Periodic system metrics broadcast every 2 seconds to SSE clients
        setInterval(() => {
            if (!this.sseClients || this.sseClients.size === 0) return;
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const ramPercent = Math.round((usedMem / totalMem) * 100);
            const cpuLoad = parseFloat(os.loadavg()[0].toFixed(2));

            this.broadcast('metrics', {
                timestamp: Date.now(),
                ping: this.client?.ws?.ping ?? 0,
                ram_percent: ramPercent,
                ram_used_mb: Math.round(usedMem / 1024 / 1024),
                ram_total_mb: Math.round(totalMem / 1024 / 1024),
                cpu_load: cpuLoad,
                uptime: process.uptime()
            });
        }, 2000);

        this._httpServer.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(
                    `[API] Port ${listenPort} is already in use. Change Port in Configs/api.yml.`,
                );
            } else {
                console.error('[API] Server error:', err);
            }
        });

        return this._httpServer;
    }

    async restartBotAfterConfigSave() {
        if (!this.client) {
            return { success: false, error: 'Bot client not available' };
        }
        if (this.client.__restarting) {
            return {
                success: false,
                error: 'Bot restart already in progress. Try again in a moment.',
            };
        }

        try {
            const result = await withTimeout(
                restartDiscordBot(this.client),
                90_000,
                'Bot restart timed out after 90 seconds',
            );
            clearGuildResourcesCache();
            return {
                success: true,
                commands: result.commands?.count ?? 0,
            };
        } catch (err) {
            console.error('[API] Bot restart failed:', err);
            return { success: false, error: err.message };
        }
    }

    startNotificationJobs() {
        const FIRST_MS = 60 * 1000;
        const INTERVAL_MS = 6 * 60 * 60 * 1000;

        const run = async () => {
            try {
                await runUpdateCheck();
            } catch (err) {
                console.warn('[Notifications] Update check failed:', err.message);
            }
        };

        this._notificationTimers = [
            setTimeout(run, FIRST_MS),
            setInterval(run, INTERVAL_MS),
        ];
    }

    setupRoutes() {
        const app = this.apiRouter;
        const oauth = this.oauth;
        const p = (permission) => this.requirePermission(permission);
        const cv = (mode) => this.requireConfigAccess(mode);

        // --- Real-time SSE Stream ---
        app.get('/stream', (req, res) => {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });
            res.write('event: connected\ndata: {"connected": true}\n\n');
            this.sseClients.add(res);

            req.on('close', () => {
                this.sseClients.delete(res);
            });
        });

        // --- Ticket Chat & Management API ---
        app.get('/system/tickets/open', p('tickets'), async (req, res) => {
            try {
                const allTickets = db.getAllTickets() || [];
                const openTickets = allTickets.filter(t => t.status === 'open' || t.status === undefined || t.open);
                const guildId = this.client?.guilds?.cache?.first()?.id || "";

                res.json({
                    success: true,
                    data: {
                        guildId,
                        tickets: openTickets.map(t => ({
                            ticket_id: t.ticket_id,
                            user_id: t.user_id,
                            subject: t.subject || t.reason || 'Untitled Ticket',
                            description: t.description || '',
                            department: t.department || 'general',
                            priority: t.priority || 'medium',
                            created_at: t.created_at
                        }))
                    }
                });
            } catch (err) {
                console.error('[API] Error fetching open tickets:', err);
                res.status(500).json({ success: false, error: 'Failed to fetch open tickets' });
            }
        });

        app.post('/system/tickets/create', p('tickets'), async (req, res) => {
            try {
                const { department, subject, reason, userId } = req.body;
                if (!this.client?.user) {
                    return res.status(503).json({ success: false, error: 'Bot is not connected to Discord.' });
                }

                const guild = this.client.guilds.cache.first();
                if (!guild) {
                    return res.status(404).json({ success: false, error: 'No connected Discord server found.' });
                }

                const supportbot = configStore.supportbot;
                const cmdconfig = configStore.commands;

                const deptKey = department || supportbot?.Ticket?.DepartmentSystem?.DefaultDepartment || 'general';
                const deptConfig = supportbot?.Ticket?.DepartmentSystem?.Departments?.[deptKey];
                if (deptConfig && deptConfig.Enabled === false) {
                    return res.status(400).json({ success: false, error: `Ticket department '${deptKey}' is currently disabled.` });
                }

                const targetUserId = userId || req.dashboardUser?.id || guild.ownerId;
                let targetUser = await this.client.users.fetch(targetUserId).catch(() => null);
                if (!targetUser) {
                    targetUser = this.client.user;
                }

                const openCmd = this.client.commands.get(cmdconfig?.OpenTicket?.Command || "new");
                if (!openCmd) {
                    return res.status(500).json({ success: false, error: 'Open ticket command not found in bot.' });
                }

                const fakeInteraction = {
                    client: this.client,
                    guild,
                    user: targetUser,
                    member: await guild.members.fetch(targetUser.id).catch(() => null),
                    channel: guild.channels.cache.first(),
                    department: deptKey,
                    reason: subject || reason || "Opened via Web Dashboard",
                    priority: deptConfig?.DefaultPriority || supportbot?.Ticket?.PrioritySystem?.DefaultPriority || "medium",
                    options: {
                        getString: (name) => {
                            if (name === "department") return deptKey;
                            if (name === "reason") return subject || reason || "Opened via Web Dashboard";
                            if (name === "priority") return deptConfig?.DefaultPriority || supportbot?.Ticket?.PrioritySystem?.DefaultPriority || "medium";
                            return null;
                        }
                    },
                    isCommand: () => false,
                    isChatInputCommand: () => false,
                    isButton: () => false,
                    isStringSelectMenu: () => false,
                    isModalSubmit: () => false,
                    deferred: false,
                    replied: false,
                    deferReply: async () => {},
                    reply: async (payload) => { fakeInteraction.repliedPayload = payload; },
                    followUp: async (payload) => { fakeInteraction.followUpPayload = payload; },
                    editReply: async (payload) => { fakeInteraction.editReplyPayload = payload; }
                };

                await openCmd.run(fakeInteraction);

                res.json({
                    success: true,
                    message: `Ticket successfully created for department: ${deptConfig?.Name || deptKey}!`,
                });
            } catch (err) {
                console.error('[API] Error creating ticket:', err);
                res.status(500).json({ success: false, error: err.message || 'Failed to create ticket' });
            }
        });

        app.get('/system/tickets/:ticketId/messages', p('tickets'), async (req, res) => {
            const { ticketId } = req.params;
            try {
                const channel = await this.client.channels.fetch(ticketId).catch(() => null);
                if (!channel || !channel.isTextBased()) {
                    return res.status(404).json({ success: false, error: 'Ticket channel not found or inactive.' });
                }

                const fetchedMessages = await channel.messages.fetch({ limit: 50 });
                const messages = Array.from(fetchedMessages.values())
                    .reverse()
                    .map(m => ({
                        id: m.id,
                        author: {
                            id: m.author.id,
                            username: m.author.username,
                            globalName: m.author.globalName || m.author.username,
                            avatar: m.author.displayAvatarURL({ extension: 'png', size: 64 }),
                            bot: m.author.bot
                        },
                        content: (() => {
                            if (m.content && m.content.trim()) return m.content;
                            if (Array.isArray(m.components) && m.components.length > 0) {
                                const texts = [];
                                for (const comp of m.components) {
                                    const data = typeof comp.toJSON === 'function' ? comp.toJSON() : comp;
                                    if (data.content) texts.push(data.content);
                                    if (Array.isArray(data.components)) {
                                        for (const child of data.components) {
                                            const childData = typeof child.toJSON === 'function' ? child.toJSON() : child;
                                            if (childData.content) texts.push(childData.content);
                                            if (childData.label && (childData.type === 10 || childData.type === 'TEXT_DISPLAY')) {
                                                texts.push(childData.label);
                                            }
                                        }
                                    }
                                }
                                if (texts.length > 0) return texts.join('\n');
                            }
                            return m.content || '';
                        })(),
                        containerColor: (() => {
                            if (Array.isArray(m.components)) {
                                for (const comp of m.components) {
                                    const data = typeof comp.toJSON === 'function' ? comp.toJSON() : comp;
                                    if (data.accent_color) {
                                        return `#${data.accent_color.toString(16).padStart(6, '0')}`;
                                    }
                                }
                            }
                            return null;
                        })(),
                        embeds: m.embeds.map(e => ({
                            title: e.title || null,
                            description: e.description || null,
                            color: e.color ? `#${e.color.toString(16).padStart(6, '0')}` : '#5865F2',
                            author: e.author ? { name: e.author.name, iconURL: e.author.iconURL } : null,
                            fields: (e.fields || []).map(f => ({ name: f.name, value: f.value, inline: f.inline })),
                            footer: e.footer ? { text: e.footer.text, iconURL: e.footer.iconURL } : null,
                            thumbnail: e.thumbnail?.url ? { url: e.thumbnail.url } : null,
                            image: e.image?.url ? { url: e.image.url } : null,
                            timestamp: e.timestamp || null
                        })),
                        components: (m.components || []).map(c => {
                            const data = typeof c.toJSON === 'function' ? c.toJSON() : c;
                            return {
                                type: data.type,
                                components: (data.components || []).map(sub => {
                                    const subData = typeof sub.toJSON === 'function' ? sub.toJSON() : sub;
                                    return {
                                        type: subData.type,
                                        label: subData.label || subData.content || null,
                                        style: subData.style || null,
                                        url: subData.url || null,
                                        customId: subData.custom_id || subData.customId || null,
                                        emoji: subData.emoji ? (subData.emoji.name || subData.emoji.id) : null
                                    };
                                })
                            };
                        }),
                        attachments: Array.from(m.attachments.values()).map(a => ({
                            id: a.id,
                            name: a.name,
                            url: a.url,
                            contentType: a.contentType
                        })),
                        createdAt: m.createdTimestamp
                    }));

                res.json({ success: true, data: { ticketId, messages } });
            } catch (err) {
                console.error('[API] Error fetching ticket messages:', err);
                res.status(500).json({ success: false, error: 'Failed to fetch ticket messages' });
            }
        });

        app.post('/system/tickets/:ticketId/reply', p('tickets'), async (req, res) => {
            const { ticketId } = req.params;
            const { message, staffName, attachments } = req.body;

            const hasText = message && message.trim();
            const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

            if (!hasText && !hasAttachments) {
                return res.status(400).json({ success: false, error: 'Message content or attachment is required.' });
            }

            try {
                const channel = await this.client.channels.fetch(ticketId).catch(() => null);
                if (!channel || !channel.isTextBased()) {
                    return res.status(404).json({ success: false, error: 'Ticket channel not found or inactive.' });
                }

                const { AttachmentBuilder } = require('discord.js');
                const files = (attachments || []).map(att => {
                    const base64Data = att.data.includes(',') ? att.data.split(',')[1] : att.data;
                    const buffer = Buffer.from(base64Data, 'base64');
                    return new AttachmentBuilder(buffer, { name: att.filename || 'attachment.png' });
                });

                const apiConfig = require('../Structures/ConfigStore').api;
                const liveChatMode = (apiConfig?.API?.LiveChat?.Mode || 'webhook').toLowerCase();

                const staffTag = staffName ? staffName.trim() : (req.dashboardUser?.username || 'Staff');
                const contentText = hasText ? message.trim() : '';

                let sentMsg;
                if (liveChatMode === 'webhook') {
                    let webhook;
                    try {
                        const webhooks = await channel.fetchWebhooks();
                        webhook = webhooks.find(wh => wh.name === 'SupportBot WebChat' || wh.owner?.id === this.client.user.id);
                        if (!webhook) {
                            webhook = await channel.createWebhook({
                                name: 'SupportBot WebChat',
                                avatar: this.client.user.displayAvatarURL()
                            });
                        }
                    } catch (whErr) {
                        console.warn('[API] Could not fetch/create webhook for channel, falling back to bot send:', whErr.message);
                    }

                    if (webhook) {
                        let avatarURL = this.client.user.displayAvatarURL({ extension: 'png' });

                        if (req.dashboardUser?.id && req.dashboardUser?.avatar) {
                            avatarURL = `https://cdn.discordapp.com/avatars/${req.dashboardUser.id}/${req.dashboardUser.avatar}.png`;
                        } else {
                            try {
                                const guild = channel.guild;
                                if (guild) {
                                    const members = await guild.members.fetch().catch(() => null);
                                    const member = members?.find(m =>
                                        m.user.username.toLowerCase() === staffTag.toLowerCase() ||
                                        m.displayName.toLowerCase() === staffTag.toLowerCase() ||
                                        m.user.tag.toLowerCase() === staffTag.toLowerCase()
                                    );
                                    if (member) {
                                        avatarURL = member.displayAvatarURL({ extension: 'png', size: 256 });
                                    }
                                }
                            } catch (e) {
                                // fallback to bot avatar
                            }
                        }

                        sentMsg = await webhook.send({
                            content: contentText || undefined,
                            username: staffTag,
                            avatarURL,
                            files
                        });
                    } else {
                        const formattedContent = contentText ? `**[${staffTag}]** ${contentText}` : `**[${staffTag}]**`;
                        sentMsg = await channel.send({ content: formattedContent, files });
                    }
                } else if (liveChatMode === 'bot_noprefix' || liveChatMode === 'bot_no_prefix' || liveChatMode === 'noprefix') {
                    // Bot mode without [Username] prefix
                    sentMsg = await channel.send({ content: contentText || undefined, files });
                } else {
                    // Bot mode with [Username] prefix
                    const formattedContent = contentText ? `**[${staffTag}]** ${contentText}` : `**[${staffTag}]**`;
                    sentMsg = await channel.send({ content: formattedContent, files });
                }

                const sentAttachments = Array.from(sentMsg.attachments.values()).map(a => ({
                    id: a.id,
                    name: a.name,
                    url: a.url,
                    contentType: a.contentType
                }));

                const messageData = {
                    id: sentMsg.id,
                    author: {
                        id: sentMsg.author.id,
                        username: staffTag,
                        globalName: `${staffTag} (via Dashboard)`,
                        avatar: sentMsg.author.displayAvatarURL({ extension: 'png', size: 64 }),
                        bot: false,
                        isDashboard: true
                    },
                    content: contentText,
                    embeds: [],
                    attachments: sentAttachments,
                    createdAt: sentMsg.createdTimestamp
                };

                this.broadcast('ticket_message', {
                    ticketId,
                    message: messageData
                });

                res.json({ success: true, data: messageData });
            } catch (err) {
                console.error('[API] Error sending ticket reply:', err);
                res.status(500).json({ success: false, error: 'Failed to send message to Discord.' });
            }
        });

        app.delete('/system/tickets/:ticketId/messages/:messageId', p('tickets'), async (req, res) => {
            const { ticketId, messageId } = req.params;
            try {
                const channel = await this.client.channels.fetch(ticketId).catch(() => null);
                if (!channel || !channel.isTextBased()) {
                    return res.status(404).json({ success: false, error: 'Ticket channel not found.' });
                }

                const targetMsg = await channel.messages.fetch(messageId).catch(() => null);
                if (!targetMsg) {
                    return res.status(404).json({ success: false, error: 'Message not found in Discord.' });
                }

                await targetMsg.delete();

                this.broadcast('ticket_message_deleted', {
                    ticketId,
                    messageId
                });

                res.json({ success: true, message: 'Message deleted successfully.' });
            } catch (err) {
                console.error('[API] Error deleting message:', err);
                res.status(500).json({ success: false, error: 'Failed to delete message in Discord.' });
            }
        });

        app.patch('/system/tickets/:ticketId/messages/:messageId', p('tickets'), async (req, res) => {
            const { ticketId, messageId } = req.params;
            const { content } = req.body;
            if (!content || !content.trim()) {
                return res.status(400).json({ success: false, error: 'Content cannot be empty.' });
            }

            try {
                const channel = await this.client.channels.fetch(ticketId).catch(() => null);
                if (!channel || !channel.isTextBased()) {
                    return res.status(404).json({ success: false, error: 'Ticket channel not found.' });
                }

                const targetMsg = await channel.messages.fetch(messageId).catch(() => null);
                if (!targetMsg) {
                    return res.status(404).json({ success: false, error: 'Message not found in Discord.' });
                }

                const updatedMsg = await targetMsg.edit({ content: content.trim() });

                this.broadcast('ticket_message_updated', {
                    ticketId,
                    messageId,
                    content: content.trim()
                });

                res.json({ success: true, data: { id: updatedMsg.id, content: content.trim() } });
            } catch (err) {
                console.error('[API] Error editing message:', err);
                res.status(500).json({ success: false, error: 'Failed to edit message in Discord.' });
            }
        });

        app.post('/system/tickets/:ticketId/close', p('tickets'), async (req, res) => {
            const { ticketId } = req.params;
            const { reason } = req.body || {};
            const staffTag = req.dashboardUser?.username || 'Staff';

            try {
                const channel = await this.client.channels.fetch(ticketId).catch(() => null);
                if (!channel || !channel.isTextBased()) {
                    db.updateTicketStatus(ticketId, 'closed');
                    this.broadcast('ticket_closed', { ticket_id: ticketId });
                    return res.json({ success: true, message: 'Ticket marked as closed.' });
                }

                try {
                    const ticketManager = require('../Structures/TicketManager');
                    if (typeof ticketManager.createTranscript === 'function') {
                        const fakeInteraction = {
                            channel,
                            guild: channel.guild,
                            user: {
                                id: req.dashboardUser?.id || this.client.user.id,
                                tag: staffTag,
                                displayAvatarURL: () => this.client.user.displayAvatarURL()
                            },
                            client: this.client
                        };
                        await ticketManager.createTranscript(fakeInteraction, reason || 'Closed via Web Dashboard').catch(() => null);
                    }
                } catch (trErr) {
                    console.warn('[API] Transcript generation on close skipped:', trErr.message);
                }

                db.updateTicketStatus(ticketId, 'closed');
                this.broadcast('ticket_closed', { ticket_id: ticketId });

                setTimeout(async () => {
                    await channel.delete(`Ticket closed by ${staffTag} via Web Dashboard`).catch(() => null);
                }, 1500);

                res.json({ success: true, message: 'Ticket closed successfully.' });
            } catch (err) {
                console.error('[API] Error closing ticket:', err);
                res.status(500).json({ success: false, error: 'Failed to close ticket.' });
            }
        });

        app.put('/branding', p('settings.update'), (req, res) => {
            try {
                const branding = dashboardBranding.updateBranding({
                    title: req.body?.title,
                    pageTitle: req.body?.pageTitle,
                });
                res.json({
                    success: true,
                    data: dashboardBranding.publicPayload(branding),
                    message: 'Branding saved.',
                });
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });

        app.post('/branding/favicon', p('settings.update'), (req, res) => {
            try {
                const branding = dashboardBranding.saveFaviconFromBase64(req.body?.dataUrl);
                res.json({
                    success: true,
                    data: dashboardBranding.publicPayload(branding),
                    message: 'Favicon updated.',
                });
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });

        app.delete('/branding/favicon', p('settings.update'), (req, res) => {
            try {
                const branding = dashboardBranding.clearFavicon();
                res.json({
                    success: true,
                    data: dashboardBranding.publicPayload(branding),
                    message: 'Favicon removed.',
                });
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });

        app.post('/branding/reset', p('settings.update'), (req, res) => {
            try {
                const branding = dashboardBranding.resetBranding();
                res.json({
                    success: true,
                    data: dashboardBranding.publicPayload(branding),
                    message: 'Branding reset to defaults.',
                });
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });

        app.post('/setup/reset', p('settings.update'), (req, res) => {
            try {
                const apiPath = path.join(__dirname, '../Configs/api.yml');
                if (fs.existsSync(apiPath)) {
                    const raw = fs.readFileSync(apiPath, 'utf8');
                    const parsed = yaml.load(raw) || {};
                    if (parsed.API && parsed.API.OAuth) {
                        parsed.API.OAuth.Enabled = false;
                        parsed.API.OAuth.ClientId = 'YOUR_CLIENT_ID';
                        parsed.API.OAuth.ClientSecret = 'YOUR_CLIENT_SECRET';
                        parsed.API.OAuth.OwnerUserIds = [];
                        const doc = new YAML.Document(parsed);
                        fs.writeFileSync(apiPath, doc.toString(), 'utf8');
                        configStore.reloadFile('api');
                    }
                }
                res.json({
                    success: true,
                    message: 'Dashboard reset to setup mode. Restarting...',
                    restartRequired: true
                });
                
                setTimeout(() => restartDiscordBot(), 500);
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });

        app.get('/dashboard-users', p('users.view'), (req, res) => {
            try {
                res.json({
                    success: true,
                    data: {
                        users: listUsers(oauth, this.client),
                        roles: ROLES,
                        configFiles: CONFIG_FILES,
                    },
                });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message });
            }
        });

        app.post('/dashboard-users', p('users.manage'), (req, res) => {
            try {
                const actorId = req.dashboardUser?.userId || 'service';
                const user = addUser(req.body, actorId, oauth);
                res.json({ success: true, data: user });
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });

        app.patch('/dashboard-users/:id', p('users.manage'), (req, res) => {
            try {
                const actorId = req.dashboardUser?.userId || 'service';
                const user = updateUser(req.params.id, req.body, actorId, oauth);
                res.json({ success: true, data: user });
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });

        app.delete('/dashboard-users/:id', p('users.manage'), (req, res) => {
            try {
                removeUser(req.params.id, oauth);
                res.json({ success: true });
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });

        // --- Custom Dashboard Groups API ---
        const groupStore = require('../Structures/DashboardGroupStore.js');

        app.get('/dashboard-groups', p('users.view'), (req, res) => {
            try {
                res.json({
                    success: true,
                    data: {
                        groups: groupStore.listGroups(),
                    },
                });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message });
            }
        });

        app.post('/dashboard-groups', p('users.manage'), (req, res) => {
            try {
                const group = groupStore.createGroup(req.body);
                res.json({ success: true, data: group });
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });

        app.put('/dashboard-groups/:id', p('users.manage'), (req, res) => {
            try {
                const group = groupStore.updateGroup(req.params.id, req.body);
                res.json({ success: true, data: group });
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });

        app.delete('/dashboard-groups/:id', p('users.manage'), (req, res) => {
            try {
                groupStore.deleteGroup(req.params.id);
                res.json({ success: true });
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });

        app.get('/guild/status', p('overview'), (req, res) => {
            try {
                if (!this.client?.user) {
                    return res.json({
                        success: true,
                        data: {
                            status: 'offline',
                            configuredGuildId: null,
                            message: 'Bot is not connected to Discord.',
                            configuredGuild: null,
                            extraGuilds: [],
                        },
                    });
                }
                res.json({
                    success: true,
                    data: syncGuildHealth(this.client),
                });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message });
            }
        });

        app.get('/alerts', p('overview'), async (req, res) => {
            try {
                const transcriptDir = path.join(__dirname, '../Data/Transcripts');
                let transcriptCount = 0;
                if (fs.existsSync(transcriptDir)) {
                    transcriptCount = fs
                        .readdirSync(transcriptDir)
                        .filter((f) => f.endsWith('-transcript.html')).length;
                }

                const data = await evaluateDashboardAlerts({
                    client: this.client,
                    configStore,
                    transcriptCount,
                });

                res.json({ success: true, data });
            } catch (err) {
                console.error('[API] Error fetching alerts:', err);
                res.status(500).json({ success: false, error: err.message });
            }
        });

        app.get('/guild/resources', (req, res, next) => {
            if (req.dashboardService) return next();
            const canAny = CONFIG_FILES.some((f) =>
                canAccessConfig(req.dashboardPermissions, f, 'view'),
            );
            if (!canAny && !hasPermission(req.dashboardPermissions, 'overview')) {
                return forbid(res);
            }
            return next();
        }, async (req, res) => {
            try {
                if (this.client?.__restarting) {
                    return res.status(503).json({
                        success: false,
                        error: 'Bot is restarting. Channel and role lists will be back shortly.',
                    });
                }
                if (!this.client?.user) {
                    return res.status(503).json({
                        success: false,
                        error: 'Bot is not connected.',
                    });
                }
                if (req.query.refresh === '1') {
                    clearGuildResourcesCache();
                }
                const data = await fetchGuildResources(this.client);
                if (!data) {
                    return res.status(400).json({
                        success: false,
                        error: 'Bot is not in the configured server. Set General.GuildId and invite the bot.',
                    });
                }
                res.json({ success: true, data });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message });
            }
        });

        app.post('/guild/:guildId/leave', p('settings.update'), async (req, res) => {
            try {
                if (!this.client?.user) {
                    return res.status(503).json({
                        success: false,
                        error: 'Bot is not connected.',
                    });
                }
                const health = await leaveGuild(this.client, req.params.guildId);
                res.json({ success: true, data: health });
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });

        app.get('/stats', p('overview'), async (req, res) => {
            try {
                if (this.client.__restarting) {
                    return res.json({
                        success: false,
                        error: 'Bot is restarting after a config change. Try again shortly.',
                    });
                }
                if (!this.client.user) {
                    return res.json({ success: false, error: 'Bot is still starting up.' });
                }

                let userCount = 0;
                this.client.guilds.cache.forEach(guild => {
                    userCount += guild.memberCount;
                });

                const allTickets = db.getAllTickets() || [];
                const openTickets = allTickets.filter(t => t.status === 'open').length;
                const closedTickets = allTickets.filter(t => t.status !== 'open').length;

                const transcriptDir = path.join(__dirname, '../Data/Transcripts');
                let transcriptCount = 0;
                if (fs.existsSync(transcriptDir)) {
                    transcriptCount = fs
                        .readdirSync(transcriptDir)
                        .filter((f) => f.endsWith('-transcript.html')).length;
                }

                const modules = evaluateAllModules(configStore, {
                    transcriptCount,
                });

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
                            inviteUrl: getBotInviteUrl(this.client.user.id),
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
                        modules,
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

        app.get('/configs/:file', cv('view'), (req, res) => {
            const validFiles = ['supportbot', 'ticket-panel', 'commands', 'messages', 'supportbot-ai', 'api'];
            const file = req.params.file;
            if (!validFiles.includes(file)) return res.status(400).json({ success: false, error: 'Invalid file' });
            try {
                const configData = fs.readFileSync(`./Configs/${file}.yml`, 'utf8');
                res.json({ success: true, data: configData });
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to read config' });
            }
        });

        app.put('/configs/raw', cv('edit'), async (req, res) => {
            if (!hasPermission(req.dashboardUser?.permissions, 'configs.raw_yaml')) {
                return res.status(403).json({ success: false, error: 'Forbidden: Raw YAML editing requires the Raw YAML Editor permission.' });
            }
            const validFiles = ['supportbot', 'ticket-panel', 'commands', 'messages', 'supportbot-ai', 'api'];
            const file = req.body.filename;
            let content = req.body.content;
            if (!validFiles.includes(file)) return res.status(400).json({ success: false, error: 'Invalid file' });
            try {
                if (file === 'supportbot' && /^\s*Token:\s*["']BOT_TOKEN["']/m.test(content)) {
                    const currentPath = `./Configs/${file}.yml`;
                    if (fs.existsSync(currentPath)) {
                        const current = fs.readFileSync(currentPath, 'utf8');
                        const tokenMatch = current.match(/^(\s*Token:\s*)["']([^"']+)["']/m);
                        if (tokenMatch && tokenMatch[2] !== 'BOT_TOKEN') {
                            content = content.replace(
                                /^(\s*Token:\s*)["']BOT_TOKEN["']/m,
                                `$1"${tokenMatch[2]}"`,
                            );
                        }
                    }
                }
                fs.writeFileSync(`./Configs/${file}.yml`, content);
                configStore.reloadFile(file);

                let botRestart = { success: false, error: 'Bot client not available' };
                if (this.client) {
                    botRestart = await this.restartBotAfterConfigSave();
                    notifyBotRestart(botRestart.success, botRestart.error);
                }

                res.json({
                    success: true,
                    botRestart,
                    message: botRestart.success
                        ? 'Config saved and bot restarted. API and dashboard stayed online.'
                        : 'Config saved but the bot could not restart. Check server logs.',
                });
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to write config' });
            }
        });

        app.get('/configs/json/:file', cv('view'), (req, res) => {
            const validFiles = ['supportbot', 'ticket-panel', 'commands', 'messages', 'supportbot-ai', 'api'];
            const file = req.params.file;
            if (!validFiles.includes(file)) return res.status(400).json({ success: false, error: 'Invalid file' });
            try {
                const configData = yaml.load(fs.readFileSync(`./Configs/${file}.yml`, 'utf8'));
                res.json({ success: true, data: configData });
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to parse config' });
            }
        });

        app.post('/configs/update-fields/multi', async (req, res) => {
            const updates = req.body;
            if (!updates || typeof updates !== 'object') return res.status(400).json({ success: false, error: 'Invalid updates' });

            const touchedFiles = new Set();
            for (const keyPath of Object.keys(updates)) {
                touchedFiles.add(keyPath.split(':')[0]);
            }
            if (!req.dashboardService) {
                const denied = assertConfigFilesEditable(
                    req.dashboardPermissions,
                    [...touchedFiles],
                    res,
                );
                if (denied) return;
            }

            try {
                const touched = new Set();
                for (const [keyPath, value] of Object.entries(updates)) {
                    const [fileName, fieldPath] = keyPath.split(':');
                    const fileContent = fs.readFileSync(`./Configs/${fileName}.yml`, 'utf8');
                    const doc = YAML.parseDocument(fileContent);
                    const keys = fieldPath.split('.');
                    doc.setIn(keys, value);
                    fs.writeFileSync(`./Configs/${fileName}.yml`, doc.toString());
                    touched.add(fileName);
                }

                const reloadFiles = [...touched].filter((f) => f !== 'api');

                let botRestart = { success: false, error: 'Bot client not available' };
                if (reloadFiles.length && this.client) {
                    botRestart = await this.restartBotAfterConfigSave();
                    notifyBotRestart(botRestart.success, botRestart.error);
                }

                res.json({
                    success: true,
                    reloaded: reloadFiles,
                    botRestart,
                    message: botRestart.success
                        ? 'Config saved and bot restarted. API and dashboard stayed online.'
                        : 'Config saved but the bot could not restart. Check server logs.',
                });
            } catch (err) {
                console.error('[API] Update failed:', err);
                res.status(500).json({ success: false, error: err.message });
            }
        });

        app.get('/notifications', p('overview'), (req, res) => {
            res.json({
                success: true,
                data: {
                    items: notificationStore.list(),
                    unreadCount: notificationStore.unreadCount(),
                },
            });
        });

        app.post('/notifications/read', p('overview'), (req, res) => {
            const { ids } = req.body || {};
            if (ids === 'all') {
                notificationStore.markRead('all');
            } else if (Array.isArray(ids)) {
                notificationStore.markRead(ids);
            } else if (typeof ids === 'string') {
                notificationStore.markRead([ids]);
            }
            res.json({
                success: true,
                data: { unreadCount: notificationStore.unreadCount() },
            });
        });

        app.delete('/notifications/:id', p('overview'), (req, res) => {
            notificationStore.dismiss(req.params.id);
            res.json({
                success: true,
                data: { unreadCount: notificationStore.unreadCount() },
            });
        });

        app.post('/system/reload-configs', p('settings.update'), async (req, res) => {
            try {
                const file = req.body?.file;
                const valid = ['supportbot', 'ticket-panel', 'commands', 'messages', 'supportbot-ai'];
                if (file && !valid.includes(file)) {
                    return res.status(400).json({ success: false, error: 'Invalid config file' });
                }
                const result = await reloadBot(this.client, {
                    fileKey: file || null,
                    refreshCommands: !file || file === 'commands',
                });
                res.json({
                    success: true,
                    reloaded: result.reloaded,
                    commands: result.commands,
                });
            } catch (err) {
                console.error('[API] Reload failed:', err);
                res.status(500).json({ success: false, error: err.message });
            }
        });

        app.get('/system/logs/meta', p('logs'), (req, res) => {
            try {
                res.json({ success: true, data: { types: LOG_TYPES, files: getLogMeta() } });
            } catch (err) {
                console.error('[API] Log meta failed:', err);
                res.status(500).json({ success: false, error: err.message });
            }
        });

        app.get('/system/logs', p('logs'), (req, res) => {
            try {
                const typesParam = req.query.types;
                const types = typesParam
                    ? String(typesParam).split(',').map((t) => t.trim())
                    : LOG_TYPES;

                let cursor = {};
                if (req.query.cursor) {
                    try {
                        cursor = JSON.parse(String(req.query.cursor));
                    } catch {
                        return res.status(400).json({ success: false, error: 'Invalid cursor' });
                    }
                }

                const hasCursor = Object.keys(cursor).length > 0;
                const tailParam = req.query.tail;
                const initialLines = hasCursor
                    ? 0
                    : Math.min(
                        1000,
                        Math.max(0, parseInt(tailParam, 10) || 400),
                    );

                const { entries, cursor: nextCursor } = fetchLogs(types, cursor, initialLines);

                res.json({
                    success: true,
                    data: {
                        entries,
                        cursor: nextCursor,
                    },
                });
            } catch (err) {
                console.error('[API] Logs fetch failed:', err);
                res.status(500).json({ success: false, error: err.message });
            }
        });

        app.get('/system/update-check', p('settings.view'), async (req, res) => {
            try {
                const info = await runUpdateCheck();
                res.json({ success: true, data: info });
            } catch (err) {
                console.error('[API] Update check failed:', err);
                res.status(500).json({ success: false, error: 'Could not check for updates. Try again later.' });
            }
        });

        app.get('/addons/catalog', p('settings.view'), async (req, res) => {
            try {
                const catalog = await listCatalogAddons();
                const installed = await listInstalledAddons(catalog);
                const installedIds = new Set(installed.map((a) => a.id));
                res.json({
                    success: true,
                    data: {
                        repository: `https://emeraldsrv.dev`,
                        addons: catalog.map((addon) => ({
                            ...addon,
                            installed: installedIds.has(addon.id),
                        })),
                    },
                });
            } catch (err) {
                console.error('[API] Addon catalog failed:', err);
                res.status(500).json({
                    success: false,
                    error: err.message || 'Could not load addon catalog from Emerald API',
                });
            }
        });

        app.get('/addons/installed', p('settings.view'), async (req, res) => {
            try {
                let catalog = [];
                try {
                    catalog = await listCatalogAddons();
                } catch {
                    catalog = [];
                }
                const installed = await listInstalledAddons(catalog);
                const configs = listLocalAddonConfigs();
                res.json({ success: true, data: { installed, configs } });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message });
            }
        });

        app.post('/addons/install', p('settings.update'), async (req, res) => {
            const name = req.body?.name || req.body?.id;
            if (!name) {
                return res.status(400).json({ success: false, error: 'Missing addon name' });
            }

            try {
                const result = await installAddonFromCatalog(name);
                let botRestart = { success: false, error: 'Bot client not available' };
                if (this.client) {
                    botRestart = await this.restartBotAfterConfigSave();
                    notifyBotRestart(botRestart.success, botRestart.error);
                }

                res.json({
                    success: true,
                    data: result,
                    botRestart,
                    message: botRestart.success
                        ? `${result.addon.name} installed and bot restarted. Enable addons in Bot config if needed.`
                        : `${result.addon.name} installed but the bot could not restart. Check server logs.`,
                });
            } catch (err) {
                console.error('[API] Addon install failed:', err);
                res.status(500).json({ success: false, error: err.message });
            }
        });

        app.post('/addons/build', p('settings.update'), async (req, res) => {
            try {
                const { name, description, permission, embed } = req.body;
                if (!name || !name.match(/^[a-z0-9_-]+$/i)) {
                    return res.status(400).json({ success: false, error: "Invalid addon name" });
                }

                const safeName = name.toLowerCase();
                const addonPath = path.join(process.cwd(), 'Addons', `${safeName}.js`);

                if (fs.existsSync(addonPath)) {
                    return res.status(400).json({ success: false, error: "An addon with this name already exists" });
                }

                const jsContent = `const Discord = require("discord.js");
const { Command } = require('../Structures/Addon.js');
const supportbot = require("../Structures/ConfigStore").supportbot;

module.exports = new Command({
    name: "${safeName}",
    description: ${JSON.stringify(description || "Custom command")},
    options: [],
    permissions: ${permission && permission !== "none" ? `["${permission}"]` : "[]"},
  
    async run(interaction) {
      const CustomEmbed = new Discord.EmbedBuilder()
        ${embed?.title ? `.setTitle(${JSON.stringify(embed.title)})` : ""}
        .setDescription(${JSON.stringify(embed?.description || "Hello!")})
        .setColor(supportbot.Embed.Colours.${embed?.color || "General"});
  
      interaction.reply({
        embeds: [CustomEmbed],
      });
    },
});
`;
                if (!fs.existsSync(path.join(process.cwd(), 'Addons'))) {
                    fs.mkdirSync(path.join(process.cwd(), 'Addons'), { recursive: true });
                }

                fs.writeFileSync(addonPath, jsContent);
                
                let botRestart = { success: false, error: 'Bot client not available' };
                if (this.client) {
                    botRestart = await this.restartBotAfterConfigSave();
                    notifyBotRestart(botRestart.success, botRestart.error);
                }
                
                res.json({
                    success: true,
                    message: botRestart.success ? "Bot restarted automatically to load your new addon." : "Restart the bot to load your new command.",
                    botRestart
                });
            } catch (err) {
                console.error("[API] Addon build failed:", err);
                res.status(500).json({ success: false, error: "Failed to build addon" });
            }
        });

        app.get('/addons/configs', p('settings.view'), (req, res) => {
            try {
                const files = listLocalAddonConfigs();
                res.json({ success: true, data: files });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message });
            }
        });

        app.get('/addons/configs/json/:file', (req, res, next) => {
            if (req.dashboardService) return next();
            if (!canAccessConfig(req.dashboardPermissions, 'supportbot', 'view')) {
                return forbid(res);
            }
            return next();
        }, (req, res) => {
            try {
                const parsed = readAddonConfig(req.params.file);
                res.json({ success: true, data: parsed.data, filename: parsed.filename });
            } catch (err) {
                res.status(404).json({ success: false, error: err.message });
            }
        });

        app.put('/addons/configs', (req, res, next) => {
            if (req.dashboardService) return next();
            if (!canAccessConfig(req.dashboardPermissions, 'supportbot', 'edit')) {
                return forbid(res);
            }
            return next();
        }, async (req, res) => {
            const { filename, data } = req.body || {};
            if (!filename || !data || typeof data !== 'object') {
                return res.status(400).json({ success: false, error: 'Missing filename or data' });
            }

            try {
                writeAddonConfig(filename, data);
                let botRestart = { success: false, error: 'Bot client not available' };
                if (this.client) {
                    botRestart = await this.restartBotAfterConfigSave();
                    notifyBotRestart(botRestart.success, botRestart.error);
                }
                res.json({
                    success: true,
                    botRestart,
                    message: botRestart.success
                        ? 'Addon config saved and bot restarted.'
                        : 'Addon config saved but the bot could not restart.',
                });
            } catch (err) {
                console.error('[API] Addon config save failed:', err);
                res.status(500).json({ success: false, error: err.message });
            }
        });

        // --- Nexus Updater API ---
        app.post('/system/update', p('settings.update'), async (req, res) => {
            const { url, version } = req.body;
            const downloadUrl = url || UPDATE_ZIP_URL;

            try {
                const axios = require('axios');
                const { execSync } = require('child_process');
                const path = require('path');

                console.log(`[Updater] Starting update to ${version || 'latest'}...`);

                // 1. Download
                const tempZip = `./update_${Date.now()}.zip`;
                const response = await axios({ method: 'get', url: downloadUrl, responseType: 'stream' });
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

                // 4. Overwrite core folders (keep Configs + Data)
                const coreFolders = ['API', 'Commands', 'Events', 'Structures', 'public'];
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
                const reqRepoId = req.body.repoId;
                let newPkgPath = path.join(sourcePath, 'package.json');
                if (reqRepoId === 'dashboard') {
                    newPkgPath = path.join(sourcePath, 'dashboard', 'package.json');
                }
                
                if (fs.existsSync(newPkgPath)) {
                    const currentPkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
                    const newPkg = JSON.parse(fs.readFileSync(newPkgPath, 'utf8'));
                    if (reqRepoId === 'dashboard') {
                        currentPkg.dashboardVersion = newPkg.version;
                    } else {
                        currentPkg.version = newPkg.version;
                    }
                    fs.writeFileSync('./package.json', JSON.stringify(currentPkg, null, 2));
                }

                fs.unlinkSync(tempZip);
                if (isWindows) {
                    execSync(`rmdir /s /q "${tempDir}"`);
                } else {
                    execSync(`rm -rf "${tempDir}"`);
                }

                if (fs.existsSync(path.join(sourcePath, 'index.js'))) {
                    fs.copyFileSync(path.join(sourcePath, 'index.js'), './index.js');
                }

                configStore.reloadBotConfigs();
                if (this.client) {
                    await reloadBot(this.client, { refreshCommands: true });
                }

                const updateMessage =
                    'Update installed. Please restart your server (stop and run npm start again) to apply all file changes.';
                notifyUpdateInstalled(updateMessage);

                res.json({
                    success: true,
                    message: updateMessage,
                    restartRequired: true,
                });

            } catch (err) {
                console.error('[Updater] Update failed:', err);
                notificationStore.add({
                    type: 'error',
                    title: 'Update failed',
                    message: err.message,
                    href: '/settings',
                });
                res.status(500).json({ success: false, error: err.message });
            }
        });

        // --- Transcript API ---
        const canManageTranscripts = (req) => {
            if (req.dashboardService) return true;
            if (!hasPermission(req.dashboardPermissions, 'transcripts')) return false;
            if (req.dashboardRole === 'viewer') return false;
            return true;
        };

        const canEditTranscriptTemplate = (req) => {
            if (req.dashboardService) return true;
            if (!hasPermission(req.dashboardPermissions, 'transcripts')) return false;
            if (req.dashboardRole === 'viewer') return false;
            return true;
        };

        app.get('/system/transcript-template', p('transcripts'), (req, res) => {
            try {
                res.json({ success: true, data: transcriptTemplate.getTemplate() });
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to load transcript template' });
            }
        });

        app.put('/system/transcript-template', p('transcripts'), (req, res) => {
            if (!canEditTranscriptTemplate(req)) {
                return forbid(res);
            }
            try {
                const saved = transcriptTemplate.saveTemplate(req.body);
                res.json({
                    success: true,
                    data: saved,
                    message: 'Transcript appearance saved. New transcripts will use this design.',
                });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message || 'Failed to save template' });
            }
        });

        app.post('/system/transcript-template/preview', p('transcripts'), (req, res) => {
            try {
                const html = transcriptTemplate.renderPreview(req.body);
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('Cache-Control', 'no-store');
                res.send(html);
            } catch (err) {
                res.status(500).type('html').send('<!DOCTYPE html><body><h1>Preview failed</h1></body>');
            }
        });

        app.get('/system/transcript-settings', p('transcripts'), (req, res) => {
            try {
                const settings = transcriptStore.getSettings();
                res.json({
                    success: true,
                    data: {
                        ...settings,
                        publicBasePath: '/transcripts',
                    },
                });
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to load transcript settings' });
            }
        });

        app.put('/system/transcript-settings', p('transcripts'), (req, res) => {
            if (!canManageTranscripts(req)) {
                return forbid(res);
            }
            try {
                const saved = transcriptStore.saveSettings(req.body);
                res.json({
                    success: true,
                    data: {
                        ...saved,
                        publicBasePath: '/transcripts',
                    },
                    message: 'Transcript settings saved.',
                });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message || 'Failed to save settings' });
            }
        });

        app.post('/system/transcripts/purge', p('transcripts'), (req, res) => {
            if (!canManageTranscripts(req)) {
                return forbid(res);
            }
            try {
                const result = transcriptStore.purgeExpiredTranscripts();
                res.json({
                    success: true,
                    data: result,
                    message: result.skipped
                        ? 'Auto-delete is disabled. Enable it in settings to purge old transcripts.'
                        : `Removed ${result.deleted} transcript(s).`,
                });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message || 'Purge failed' });
            }
        });

        app.get('/system/transcripts', p('transcripts'), (req, res) => {
            try {
                transcriptStore.purgeExpiredTranscripts();
                const transcripts = transcriptStore.listTranscripts();
                res.json({ success: true, data: transcripts });
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to list transcripts' });
            }
        });

        app.delete('/system/transcripts/:id', p('transcripts'), (req, res) => {
            if (!canManageTranscripts(req)) {
                return forbid(res);
            }
            try {
                const removed = transcriptStore.deleteTranscript(req.params.id);
                if (!removed) {
                    return res.status(404).json({ success: false, error: 'Transcript not found' });
                }
                res.json({ success: true, message: 'Transcript deleted.' });
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to delete transcript' });
            }
        });

        app.get('/system/transcripts/:id', p('transcripts'), (req, res) => {
            try {
                const transcript = transcriptStore.readTranscriptFile(req.params.id);
                if (!transcript) {
                    return res.status(404).json({ success: false, error: 'Transcript not found' });
                }
                res.json({ success: true, data: transcript.content });
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to read transcript' });
            }
        });

        app.get('/system/transcripts/:id/view', p('transcripts'), (req, res) => {
            try {
                const transcript = transcriptStore.readTranscriptFile(req.params.id);
                if (!transcript) {
                    return res.status(404).type('html').send(
                        '<!DOCTYPE html><body style="font-family:sans-serif;padding:2rem;background:#0b0f14;color:#e6edf3"><h1>Transcript not found</h1></body>',
                    );
                }
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('Cache-Control', 'private, max-age=60');
                res.send(transcript.content);
            } catch (err) {
                res.status(500).type('html').send(
                    '<!DOCTYPE html><body style="font-family:sans-serif;padding:2rem"><h1>Failed to load transcript</h1></body>',
                );
            }
        });

        app.get('/system/transcripts/:id/download', p('transcripts'), (req, res) => {
            try {
                const transcript = transcriptStore.readTranscriptFile(req.params.id);
                if (!transcript) {
                    return res.status(404).json({ success: false, error: 'Transcript not found' });
                }
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader(
                    'Content-Disposition',
                    `attachment; filename="${transcript.filename}"`,
                );
                res.send(transcript.content);
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to download transcript' });
            }
        });

        app.get('/system/tickets/open', p('overview'), (req, res) => {
            try {
                const db = require('../Structures/Database.js');
                const configStore = require('../Structures/ConfigStore.js');
                const guildId = configStore.supportbot.General.GuildId;
                
                const openTickets = db.getAllTickets().filter(t => t.status === 'open');
                
                res.json({
                    success: true,
                    data: {
                        guildId,
                        tickets: openTickets
                    }
                });
            } catch (err) {
                console.error("Open tickets API error:", err);
                res.status(500).json({ success: false, error: 'Failed to fetch open tickets' });
            }
        });
    }
}

module.exports = APIServer;
