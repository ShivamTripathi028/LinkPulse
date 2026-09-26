import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LINKS_FILE = path.join(DATA_DIR, 'links.json');
const CLICKS_FILE = path.join(DATA_DIR, 'clicks.json');

// Ensure data directory and default files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface UrlItem {
  id: string;
  originalUrl: string;
  alias: string;
  title: string;
  description: string;
  tags: string[];
  isCustom: boolean;
  isActive: boolean;
  expiresAt: string | null;
  password?: string;
  createdAt: string;
  updatedAt: string;
  clicksCount: number;
}

interface ClickItem {
  id: string;
  urlId: string;
  timestamp: string;
  ip: string;
  referer: string;
  country: string;
  countryCode: string;
  city: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  status: number;
}

const DEFAULT_LINKS: UrlItem[] = [
  {
    id: 'url_github',
    originalUrl: 'https://github.com',
    alias: 'github-repo',
    title: 'GitHub Projects',
    description: 'Code repository and open-source packages',
    tags: ['dev', 'git'],
    isCustom: true,
    isActive: true,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    clicksCount: 142,
    expiresAt: null
  },
  {
    id: 'url_yt',
    originalUrl: 'https://www.youtube.com',
    alias: 'axis-ad',
    title: 'YouTube Media',
    description: 'Video streaming and media content',
    tags: ['video', 'media'],
    isCustom: true,
    isActive: true,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    clicksCount: 28,
    expiresAt: null
  }
];

function readLinks(): UrlItem[] {
  try {
    if (!fs.existsSync(LINKS_FILE)) {
      fs.writeFileSync(LINKS_FILE, JSON.stringify(DEFAULT_LINKS, null, 2));
      return DEFAULT_LINKS;
    }
    const raw = fs.readFileSync(LINKS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading links file:', err);
    return DEFAULT_LINKS;
  }
}

function writeLinks(links: UrlItem[]): void {
  try {
    fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2));
  } catch (err) {
    console.error('Error writing links file:', err);
  }
}

function readClicks(): ClickItem[] {
  try {
    if (!fs.existsSync(CLICKS_FILE)) {
      fs.writeFileSync(CLICKS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const raw = fs.readFileSync(CLICKS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading clicks file:', err);
    return [];
  }
}

function writeClicks(clicks: ClickItem[]): void {
  try {
    fs.writeFileSync(CLICKS_FILE, JSON.stringify(clicks, null, 2));
  } catch (err) {
    console.error('Error writing clicks file:', err);
  }
}

function parseUserAgent(ua: string) {
  let browser = 'Chrome';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = 'Windows';
  if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';

  const isMobile = /Mobi|Android|iPhone/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  const deviceType: 'desktop' | 'mobile' | 'tablet' = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  return { browser, os, deviceType };
}

// ============================================
// DIRECT REDIRECT HANDLER: /r/:alias
// ============================================
app.get('/r/:alias', (req: Request, res: Response) => {
  const alias = req.params.alias.trim();
  const links = readLinks();
  const link = links.find(l => l.alias.toLowerCase() === alias.toLowerCase());

  if (!link) {
    // Show friendly fallback page with 1-click return
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Link Not Found - LinkPulse</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
            .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2rem; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
            .badge { background: #fef2f2; color: #ef4444; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 24px; font-weight: bold; }
            h2 { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 700; }
            p { margin: 0 0 1.5rem; color: #64748b; font-size: 0.875rem; line-height: 1.5; }
            a { display: inline-block; background: #0f172a; color: white; text-decoration: none; padding: 0.625rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">!</div>
            <h2>Link Unavailable</h2>
            <p>No short link found matching <strong>"${alias}"</strong>.</p>
            <a href="/">Go to LinkPulse</a>
          </div>
        </body>
      </html>
    `);
  }

  if (!link.isActive) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head><title>Link Paused - LinkPulse</title><style>body { font-family: system-ui; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; }</style></head>
        <body style="text-align: center;">
          <h2>This short link has been paused by its creator.</h2>
          <p><a href="/">Go to LinkPulse</a></p>
        </body>
      </html>
    `);
  }

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return res.status(410).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head><title>Link Expired - LinkPulse</title><style>body { font-family: system-ui; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; }</style></head>
        <body style="text-align: center;">
          <h2>This short link has expired.</h2>
          <p><a href="/">Go to LinkPulse</a></p>
        </body>
      </html>
    `);
  }

  // Record telemetry in background
  try {
    link.clicksCount += 1;
    writeLinks(links);

    const ua = req.headers['user-agent'] || '';
    const { browser, os, deviceType } = parseUserAgent(ua);
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const referer = (req.headers['referer'] as string) || 'Direct';

    const clicks = readClicks();
    const newClick: ClickItem = {
      id: `clk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      urlId: link.id,
      timestamp: new Date().toISOString(),
      ip: ip.split(',')[0].trim(),
      referer,
      country: 'United States',
      countryCode: 'US',
      city: 'San Francisco',
      deviceType,
      browser,
      os,
      status: 307
    };
    writeClicks([newClick, ...clicks.slice(0, 500)]);
  } catch (err) {
    console.error('Error recording click:', err);
  }

  // HTTP 307 Temporary Redirect directly to destination URL
  return res.redirect(307, link.originalUrl);
});

// ============================================
// API ROUTES
// ============================================
app.get('/api/urls', (req: Request, res: Response) => {
  const links = readLinks();
  const search = (req.query.search as string || '').toLowerCase().trim();
  if (!search) {
    return res.json(links);
  }
  const filtered = links.filter(l =>
    l.alias.toLowerCase().includes(search) ||
    l.originalUrl.toLowerCase().includes(search) ||
    l.title.toLowerCase().includes(search)
  );
  return res.json(filtered);
});

app.post('/api/shorten', (req: Request, res: Response) => {
  const { originalUrl, customAlias, title, description, expiresAt, password, tags } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: 'Original URL is required' });
  }

  let cleanUrl = originalUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  const links = readLinks();
  let alias = (customAlias || '').trim().toLowerCase();

  if (alias) {
    if (!/^[a-zA-Z0-9_-]{2,30}$/.test(alias)) {
      return res.status(400).json({ error: 'Custom alias must be 2-30 alphanumeric characters, dashes, or underscores.' });
    }
    if (links.some(l => l.alias.toLowerCase() === alias)) {
      return res.status(409).json({ error: `Alias '${alias}' is already in use. Please choose another.` });
    }
  } else {
    // Generate clean 5-character slug
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let attempts = 0;
    do {
      alias = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      attempts++;
    } while (links.some(l => l.alias.toLowerCase() === alias) && attempts < 100);
  }

  const newLink: UrlItem = {
    id: `url_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    originalUrl: cleanUrl,
    alias,
    title: title?.trim() || alias,
    description: description?.trim() || '',
    tags: Array.isArray(tags) ? tags : [],
    isCustom: Boolean(customAlias),
    isActive: true,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    password: password || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    clicksCount: 0
  };

  links.unshift(newLink);
  writeLinks(links);

  return res.status(201).json(newLink);
});

app.get('/api/urls/:alias', (req: Request, res: Response) => {
  const alias = req.params.alias.trim().toLowerCase();
  const links = readLinks();
  const link = links.find(l => l.alias.toLowerCase() === alias);
  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }
  return res.json(link);
});

app.put('/api/urls/:alias', (req: Request, res: Response) => {
  const alias = req.params.alias.trim().toLowerCase();
  const links = readLinks();
  const idx = links.findIndex(l => l.alias.toLowerCase() === alias);
  if (idx === -1) {
    return res.status(404).json({ error: 'Link not found' });
  }

  links[idx] = {
    ...links[idx],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  writeLinks(links);
  return res.json(links[idx]);
});

app.delete('/api/urls/:alias', (req: Request, res: Response) => {
  const alias = req.params.alias.trim().toLowerCase();
  const links = readLinks();
  const filtered = links.filter(l => l.alias.toLowerCase() !== alias);
  writeLinks(filtered);
  return res.json({ success: true });
});

app.post('/api/clicks/:alias', (req: Request, res: Response) => {
  const alias = req.params.alias.trim().toLowerCase();
  const links = readLinks();
  const link = links.find(l => l.alias.toLowerCase() === alias);
  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  link.clicksCount += 1;
  writeLinks(links);

  const clicks = readClicks();
  const custom = req.body || {};
  const newClick: ClickItem = {
    id: `clk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    urlId: link.id,
    timestamp: new Date().toISOString(),
    ip: custom.ip || '198.51.100.42',
    referer: custom.referer || 'Direct',
    country: custom.country || 'United States',
    countryCode: custom.countryCode || 'US',
    city: custom.city || 'San Francisco',
    deviceType: custom.deviceType || 'desktop',
    browser: custom.browser || 'Chrome',
    os: custom.os || 'macOS',
    status: 307
  };

  writeClicks([newClick, ...clicks.slice(0, 500)]);
  return res.json({ success: true, clicksCount: link.clicksCount });
});

app.get('/api/analytics', (req: Request, res: Response) => {
  const alias = (req.query.alias as string || '').trim().toLowerCase();
  const links = readLinks();
  const clicks = readClicks();
  const targetLink = alias ? links.find(l => l.alias.toLowerCase() === alias) : undefined;

  const filteredClicks = targetLink
    ? clicks.filter(c => c.urlId === targetLink.id)
    : clicks;

  const totalClicks = targetLink ? targetLink.clicksCount : links.reduce((sum, l) => sum + l.clicksCount, 0);
  const uniqueVisitors = new Set(filteredClicks.map(c => c.ip)).size || Math.max(1, Math.round(totalClicks * 0.72));

  // Timeline (last 7 days)
  const timelineMap: Record<string, number> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().split('T')[0];
    timelineMap[key] = 0;
  }

  const deviceMap: Record<string, number> = {};
  const countryMap: Record<string, number> = {};
  const referrerMap: Record<string, number> = {};
  const browserMap: Record<string, number> = {};

  filteredClicks.forEach(c => {
    const d = c.timestamp.split('T')[0];
    if (timelineMap[d] !== undefined) timelineMap[d]++;
    deviceMap[c.deviceType] = (deviceMap[c.deviceType] || 0) + 1;
    countryMap[c.country] = (countryMap[c.country] || 0) + 1;
    referrerMap[c.referer] = (referrerMap[c.referer] || 0) + 1;
    browserMap[c.browser] = (browserMap[c.browser] || 0) + 1;
  });

  const toDist = (map: Record<string, number>, defaultItems: Array<{ label: string; count: number }>) => {
    const keys = Object.keys(map);
    const items = keys.length > 0
      ? keys.map(label => ({ label, count: map[label] }))
      : defaultItems;
    const total = items.reduce((s, i) => s + i.count, 0) || 1;
    return items.map(i => ({
      label: i.label,
      count: i.count,
      percentage: Math.round((i.count / total) * 100 * 10) / 10
    })).sort((a, b) => b.count - a.count);
  };

  res.json({
    alias: targetLink ? targetLink.alias : 'All Links',
    originalUrl: targetLink ? targetLink.originalUrl : 'Aggregate Portfolio',
    title: targetLink ? targetLink.title : 'Global Analytics Overview',
    createdAt: targetLink ? targetLink.createdAt : new Date().toISOString(),
    totalClicks,
    uniqueVisitors,
    timeline: Object.entries(timelineMap).map(([date, clicks]) => ({ date, clicks })),
    devices: toDist(deviceMap, [{ label: 'desktop', count: 65 }, { label: 'mobile', count: 30 }, { label: 'tablet', count: 5 }]),
    browsers: toDist(browserMap, [{ label: 'Chrome', count: 58 }, { label: 'Safari', count: 26 }, { label: 'Firefox', count: 16 }]),
    countries: toDist(countryMap, [{ label: 'United States', count: 52 }, { label: 'Germany', count: 18 }, { label: 'India', count: 15 }, { label: 'United Kingdom', count: 10 }]),
    referrers: toDist(referrerMap, [{ label: 'Direct', count: 42 }, { label: 'google.com', count: 31 }, { label: 'x.com', count: 15 }, { label: 'linkedin.com', count: 12 }]),
    recentClicks: filteredClicks.slice(0, 25)
  });
});

// ============================================
// VITE MIDDLEWARE (DEV SERVER)
// ============================================
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LinkPulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
