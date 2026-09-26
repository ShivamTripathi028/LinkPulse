import { UrlRecord, ClickEvent, AnalyticsSummary } from '../types';
import {
  loadStoredUrls,
  saveStoredUrls,
  loadStoredClicks,
  saveStoredClicks,
  calculateAnalytics,
} from './storageService';

export interface CreateUrlInput {
  originalUrl: string;
  customAlias?: string;
  title?: string;
  description?: string;
  expiresAt?: string | null;
  password?: string;
  tags?: string[];
}

class ApiService {
  public async getUrls(search?: string): Promise<UrlRecord[]> {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/urls${query}`);
      if (res.ok) {
        const data = await res.json();
        saveStoredUrls(data);
        return data;
      }
    } catch (e) {
      console.warn('API /api/urls fetch failed, falling back to local storage', e);
    }

    // Local Storage fallback
    let urls = loadStoredUrls();
    if (search && search.trim()) {
      const term = search.toLowerCase();
      urls = urls.filter(
        u =>
          u.alias.toLowerCase().includes(term) ||
          u.originalUrl.toLowerCase().includes(term) ||
          u.title.toLowerCase().includes(term) ||
          (u.description && u.description.toLowerCase().includes(term))
      );
    }
    return urls;
  }

  public async createUrl(input: CreateUrlInput): Promise<UrlRecord> {
    let cleanUrl = input.originalUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: cleanUrl,
          customAlias: input.customAlias || undefined,
          title: input.title || undefined,
          description: input.description || undefined,
          expiresAt: input.expiresAt || undefined,
          password: input.password || undefined,
          tags: input.tags || []
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const local = loadStoredUrls();
        saveStoredUrls([data, ...local.filter(u => u.alias !== data.alias)]);
        return data;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }
    } catch (err: any) {
      // If server failed because of duplicate alias or validation error, rethrow
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }

      // Offline/Local Storage Mode
      const currentUrls = loadStoredUrls();
      const alias = input.customAlias?.trim() || this.generateLocalSlug(5);

      if (!/^[a-zA-Z0-9_-]{2,30}$/.test(alias)) {
        throw new Error('Custom alias must be 2-30 alphanumeric characters, dashes, or underscores.');
      }

      if (currentUrls.some(u => u.alias.toLowerCase() === alias.toLowerCase())) {
        throw new Error(`The alias '${alias}' is already in use. Please select a different one.`);
      }

      const newRecord: UrlRecord = {
        id: `url_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        originalUrl: cleanUrl,
        alias,
        title: input.title?.trim() || alias,
        description: input.description?.trim() || '',
        tags: input.tags || [],
        isCustom: Boolean(input.customAlias),
        isActive: true,
        password: input.password || undefined,
        expiresAt: input.expiresAt || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clicksCount: 0,
      };

      saveStoredUrls([newRecord, ...currentUrls]);
      return newRecord;
    }
  }

  public async updateUrl(alias: string, updates: Partial<UrlRecord>): Promise<UrlRecord> {
    try {
      const res = await fetch(`/api/urls/${alias}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        const urls = loadStoredUrls();
        const idx = urls.findIndex(u => u.alias === alias);
        if (idx !== -1) {
          urls[idx] = updated;
          saveStoredUrls(urls);
        }
        return updated;
      }
    } catch (e) {
      console.warn('API update failed, updating locally', e);
    }

    const urls = loadStoredUrls();
    const idx = urls.findIndex(u => u.alias === alias);
    if (idx === -1) {
      throw new Error('URL record not found');
    }

    const updated = {
      ...urls[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    urls[idx] = updated;
    saveStoredUrls(urls);
    return updated;
  }

  public async deleteUrl(alias: string): Promise<void> {
    try {
      await fetch(`/api/urls/${alias}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('API delete failed', e);
    }

    const urls = loadStoredUrls();
    const target = urls.find(u => u.alias === alias);
    const filtered = urls.filter(u => u.alias !== alias);
    saveStoredUrls(filtered);

    if (target) {
      const clicks = loadStoredClicks();
      saveStoredClicks(clicks.filter(c => c.urlId !== target.id));
    }
  }

  public async recordClick(alias: string, simulatedContext?: Partial<ClickEvent>): Promise<UrlRecord | null> {
    try {
      await fetch(`/api/clicks/${alias}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulatedContext || {})
      });
    } catch (e) {
      console.warn('API click logging failed', e);
    }

    const urls = loadStoredUrls();
    const target = urls.find(u => u.alias.toLowerCase() === alias.toLowerCase());
    if (!target) return null;

    target.clicksCount += 1;
    saveStoredUrls([...urls]);

    const clicks = loadStoredClicks();

    const userAgent = navigator.userAgent;
    let browser = 'Chrome';
    if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edg')) browser = 'Edge';

    let os = 'macOS';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    else if (userAgent.includes('Android')) os = 'Android';

    const isMobile = /Mobi|Android/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';

    const newClick: ClickEvent = {
      id: `clk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      urlId: target.id,
      timestamp: new Date().toISOString(),
      ip: `198.51.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`,
      referer: document.referrer || simulatedContext?.referer || 'Direct',
      country: simulatedContext?.country || 'United States',
      countryCode: simulatedContext?.countryCode || 'US',
      city: simulatedContext?.city || 'San Francisco',
      deviceType: simulatedContext?.deviceType || deviceType,
      browser: simulatedContext?.browser || browser,
      os: simulatedContext?.os || os,
      status: 307
    };

    saveStoredClicks([newClick, ...clicks]);
    return target;
  }

  public async getAnalytics(alias?: string): Promise<AnalyticsSummary> {
    try {
      const query = alias && alias !== 'all' ? `?alias=${encodeURIComponent(alias)}` : '';
      const res = await fetch(`/api/analytics${query}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API analytics failed, falling back to local calculations', e);
    }

    const urls = loadStoredUrls();
    const clicks = loadStoredClicks();
    const targetUrl = alias && alias !== 'all' ? urls.find(u => u.alias === alias) : undefined;
    return calculateAnalytics(clicks, targetUrl);
  }

  private generateLocalSlug(length: number = 5): string {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  public exportUrlsAsCsv(urls: UrlRecord[]): void {
    const headers = ['Alias', 'Title', 'Original URL', 'Clicks', 'Created At', 'Active', 'Expires At'];
    const rows = urls.map(u => [
      `"${u.alias}"`,
      `"${u.title.replace(/"/g, '""')}"`,
      `"${u.originalUrl.replace(/"/g, '""')}"`,
      u.clicksCount,
      `"${u.createdAt}"`,
      u.isActive ? 'true' : 'false',
      u.expiresAt ? `"${u.expiresAt}"` : '""'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `linkpulse_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public exportUrlsAsJson(urls: UrlRecord[]): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(urls, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `linkpulse_export_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchor.click();
  }
}

export const apiService = new ApiService();
