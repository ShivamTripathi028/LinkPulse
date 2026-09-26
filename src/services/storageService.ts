import { UrlRecord, ClickEvent, AnalyticsSummary, DistributionItem, TimelineDataPoint } from '../types';

const URLS_STORAGE_KEY = 'linkpulse_urls_v1';
const CLICKS_STORAGE_KEY = 'linkpulse_clicks_v1';
const BACKEND_CONFIG_KEY = 'linkpulse_backend_cfg';

// Pre-seeded demo dataset so analytics and management are immediately rich and explore-ready
const INITIAL_URLS: UrlRecord[] = [
  {
    id: 'url_github_repo',
    originalUrl: 'https://github.com/fastapi/fastapi',
    alias: 'fastapi-docs',
    title: 'FastAPI Official GitHub Repository',
    description: 'Core documentation and source code for Python high performance API',
    tags: ['dev', 'python', 'docs'],
    isCustom: true,
    isActive: true,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    clicksCount: 342,
  },
  {
    id: 'url_prisma_client',
    originalUrl: 'https://prisma.io/docs/concepts/components/prisma-client',
    alias: 'prisma-orm',
    title: 'Prisma Client Modern ORM Guide',
    description: 'PostgreSQL database modeling and migration handbook',
    tags: ['database', 'orm'],
    isCustom: true,
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    clicksCount: 218,
  },
  {
    id: 'url_aws_ec2_tier',
    originalUrl: 'https://aws.amazon.com/free/compute/ec2/',
    alias: 'aws-free-ec2',
    title: 'AWS Free Tier EC2 Setup Portal',
    description: '750 compute hours per month for t2.micro / t3.micro',
    tags: ['cloud', 'aws', 'infra'],
    isCustom: true,
    isActive: true,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    clicksCount: 164,
  },
  {
    id: 'url_launch_announcement',
    originalUrl: 'https://news.ycombinator.com',
    alias: 'hn-launch',
    title: 'Hacker News Tech Community',
    description: 'Community discussions on architecture and scaling',
    tags: ['social', 'tech'],
    isCustom: true,
    isActive: true,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    clicksCount: 95,
  }
];

function generateSeedClicks(): ClickEvent[] {
  const clicks: ClickEvent[] = [];
  const countries = [
    { country: 'United States', code: 'US', cities: ['San Francisco', 'New York', 'Seattle', 'Austin'] },
    { country: 'Germany', code: 'DE', cities: ['Berlin', 'Munich', 'Frankfurt'] },
    { country: 'India', code: 'IN', cities: ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad'] },
    { country: 'United Kingdom', code: 'GB', cities: ['London', 'Manchester'] },
    { country: 'Canada', code: 'CA', cities: ['Toronto', 'Vancouver'] },
    { country: 'Japan', code: 'JP', cities: ['Tokyo', 'Osaka'] },
    { country: 'France', code: 'FR', cities: ['Paris', 'Lyon'] },
  ];

  const devices: Array<'desktop' | 'mobile' | 'tablet'> = ['desktop', 'desktop', 'desktop', 'mobile', 'mobile', 'tablet'];
  const browsers = ['Chrome', 'Chrome', 'Safari', 'Safari', 'Firefox', 'Edge'];
  const osList = ['macOS', 'Windows', 'iOS', 'Android', 'Linux'];
  const referrers = ['Direct', 'google.com', 'x.com', 'github.com', 'linkedin.com', 'reddit.com', 'youtube.com'];

  const now = Date.now();
  const urlIds = ['url_github_repo', 'url_prisma_client', 'url_aws_ec2_tier', 'url_launch_announcement'];

  for (let i = 0; i < 819; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const hourAgo = Math.floor(Math.random() * 24);
    const minAgo = Math.floor(Math.random() * 60);
    const timestamp = new Date(now - (daysAgo * 86400000 + hourAgo * 3600000 + minAgo * 60000)).toISOString();

    const cItem = countries[Math.floor(Math.random() * countries.length)];
    const city = cItem.cities[Math.floor(Math.random() * cItem.cities.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];
    const browser = browsers[Math.floor(Math.random() * browsers.length)];
    const os = osList[Math.floor(Math.random() * osList.length)];
    const referer = referrers[Math.floor(Math.random() * referrers.length)];
    const urlId = urlIds[Math.floor(Math.random() * urlIds.length)];

    clicks.push({
      id: `clk_${i}_${Math.random().toString(36).substring(2, 7)}`,
      urlId,
      timestamp,
      ip: `198.51.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
      referer,
      country: cItem.country,
      countryCode: cItem.code,
      city,
      deviceType: device,
      browser,
      os,
      status: 307
    });
  }

  return clicks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Local storage helpers
export function loadStoredUrls(): UrlRecord[] {
  try {
    const item = localStorage.getItem(URLS_STORAGE_KEY);
    if (!item) {
      localStorage.setItem(URLS_STORAGE_KEY, JSON.stringify(INITIAL_URLS));
      return INITIAL_URLS;
    }
    return JSON.parse(item);
  } catch {
    return INITIAL_URLS;
  }
}

export function saveStoredUrls(urls: UrlRecord[]): void {
  try {
    localStorage.setItem(URLS_STORAGE_KEY, JSON.stringify(urls));
  } catch (e) {
    console.error('Failed to save URLs to localStorage', e);
  }
}

export function loadStoredClicks(): ClickEvent[] {
  try {
    const item = localStorage.getItem(CLICKS_STORAGE_KEY);
    if (!item) {
      const initial = generateSeedClicks();
      localStorage.setItem(CLICKS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(item);
  } catch {
    return [];
  }
}

export function saveStoredClicks(clicks: ClickEvent[]): void {
  try {
    localStorage.setItem(CLICKS_STORAGE_KEY, JSON.stringify(clicks));
  } catch (e) {
    console.error('Failed to save clicks to localStorage', e);
  }
}

export function loadBackendConfig() {
  const defaultCfg = {
    mode: 'local' as const,
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    isHealthy: false,
    lastChecked: undefined
  };
  try {
    const item = localStorage.getItem(BACKEND_CONFIG_KEY);
    return item ? { ...defaultCfg, ...JSON.parse(item) } : defaultCfg;
  } catch {
    return defaultCfg;
  }
}

export function saveBackendConfig(cfg: any) {
  try {
    localStorage.setItem(BACKEND_CONFIG_KEY, JSON.stringify(cfg));
  } catch (e) {
    console.error(e);
  }
}

// Analytics calculations
export function calculateAnalytics(
  clicks: ClickEvent[],
  targetUrl?: UrlRecord
): AnalyticsSummary {
  const filteredClicks = targetUrl
    ? clicks.filter(c => c.urlId === targetUrl.id)
    : clicks;

  const totalClicks = filteredClicks.length;
  const uniqueVisitors = new Set(filteredClicks.map(c => c.ip).filter(Boolean)).size;

  // Timeline: last 7 days
  const now = new Date();
  const timelineMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().split('T')[0];
    timelineMap[key] = 0;
  }

  const deviceMap: Record<string, number> = {};
  const browserMap: Record<string, number> = {};
  const osMap: Record<string, number> = {};
  const countryMap: Record<string, number> = {};
  const referrerMap: Record<string, number> = {};

  filteredClicks.forEach(c => {
    // Timeline
    const dateKey = c.timestamp.split('T')[0];
    if (timelineMap[dateKey] !== undefined) {
      timelineMap[dateKey]++;
    }

    // Devices
    deviceMap[c.deviceType] = (deviceMap[c.deviceType] || 0) + 1;

    // Browsers
    browserMap[c.browser] = (browserMap[c.browser] || 0) + 1;

    // OS
    osMap[c.os] = (osMap[c.os] || 0) + 1;

    // Countries
    countryMap[c.country] = (countryMap[c.country] || 0) + 1;

    // Referrers
    referrerMap[c.referer] = (referrerMap[c.referer] || 0) + 1;
  });

  const toDistribution = (map: Record<string, number>): DistributionItem[] => {
    return Object.entries(map)
      .map(([label, count]) => ({
        label,
        count,
        percentage: totalClicks > 0 ? Math.round((count / totalClicks) * 100 * 10) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count);
  };

  const timeline: TimelineDataPoint[] = Object.entries(timelineMap).map(([date, clicks]) => ({
    date,
    clicks
  }));

  return {
    alias: targetUrl ? targetUrl.alias : 'All Active Links',
    originalUrl: targetUrl ? targetUrl.originalUrl : 'Aggregate Portfolio',
    title: targetUrl ? targetUrl.title : 'Global Analytics Overview',
    createdAt: targetUrl ? targetUrl.createdAt : new Date().toISOString(),
    totalClicks,
    uniqueVisitors,
    timeline,
    devices: toDistribution(deviceMap),
    browsers: toDistribution(browserMap),
    operatingSystems: toDistribution(osMap),
    countries: toDistribution(countryMap),
    referrers: toDistribution(referrerMap),
    recentClicks: filteredClicks.slice(0, 30)
  };
}
