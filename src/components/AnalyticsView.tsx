import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Globe,
  Smartphone,
  Monitor,
  Share2,
  Clock,
  RefreshCw,
  Zap,
  Check,
  ChevronDown,
  ArrowUpRight
} from 'lucide-react';
import { AnalyticsSummary, UrlRecord } from '../types';
import { apiService } from '../services/apiService';

interface AnalyticsViewProps {
  urls: UrlRecord[];
  initialAlias?: string;
  onRefreshUrls: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  urls,
  initialAlias,
  onRefreshUrls,
}) => {
  const [selectedAlias, setSelectedAlias] = useState<string>(initialAlias || 'all');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedFeedback, setSimulatedFeedback] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getAnalytics(
        selectedAlias === 'all' ? undefined : selectedAlias
      );
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedAlias]);

  useEffect(() => {
    if (initialAlias) {
      setSelectedAlias(initialAlias);
    }
  }, [initialAlias]);

  // Simulate traffic generator for live demonstration
  const handleSimulateTraffic = async (count: number) => {
    if (!urls.length) return;
    setIsSimulating(true);

    const target = selectedAlias === 'all' ? urls[0].alias : selectedAlias;
    const countries = [
      { country: 'United States', countryCode: 'US', city: 'San Francisco' },
      { country: 'Germany', countryCode: 'DE', city: 'Berlin' },
      { country: 'India', countryCode: 'IN', city: 'Bengaluru' },
      { country: 'United Kingdom', countryCode: 'GB', city: 'London' },
      { country: 'Japan', countryCode: 'JP', city: 'Tokyo' },
      { country: 'Canada', countryCode: 'CA', city: 'Toronto' }
    ];
    const devices: Array<'desktop' | 'mobile' | 'tablet'> = ['desktop', 'mobile', 'tablet'];
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
    const osList = ['macOS', 'Windows', 'iOS', 'Android'];
    const referrers = ['Direct', 'google.com', 'x.com', 'linkedin.com', 'github.com', 'producthunt.com'];

    for (let i = 0; i < count; i++) {
      const c = countries[Math.floor(Math.random() * countries.length)];
      const dev = devices[Math.floor(Math.random() * devices.length)];
      const br = browsers[Math.floor(Math.random() * browsers.length)];
      const os = osList[Math.floor(Math.random() * osList.length)];
      const ref = referrers[Math.floor(Math.random() * referrers.length)];

      await apiService.recordClick(target, {
        country: c.country,
        countryCode: c.countryCode,
        city: c.city,
        deviceType: dev,
        browser: br,
        os,
        referer: ref
      });
    }

    onRefreshUrls();
    await fetchAnalyticsData();
    setIsSimulating(false);
    setSimulatedFeedback(`Added ${count} real-time test clicks!`);
    setTimeout(() => setSimulatedFeedback(null), 3000);
  };

  if (isLoading && !analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Aggregating telemetry logs...</p>
      </div>
    );
  }

  const maxTimelineClicks = analytics
    ? Math.max(...analytics.timeline.map(t => t.clicks), 1)
    : 1;

  const topCountry = analytics?.countries[0]?.label || 'None';
  const topDevice = analytics?.devices[0]?.label || 'desktop';
  const topReferrer = analytics?.referrers[0]?.label || 'Direct';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Click Telemetry & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time traffic distribution, referrers, device breakdown, and geographic insights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Target URL Selector */}
          <div className="relative">
            <select
              value={selectedAlias}
              onChange={e => setSelectedAlias(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 pr-8 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-2xs cursor-pointer"
            >
              <option value="all">Global (All Links Combined)</option>
              {urls.map(u => (
                <option key={u.alias} value={u.alias}>
                  /{u.alias} — {u.title}
                </option>
              ))}
            </select>
          </div>

          {/* Simulate Click Button */}
          <button
            onClick={() => handleSimulateTraffic(5)}
            disabled={isSimulating || !urls.length}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            title="Simulate 5 incoming clicks to verify live tracking"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Simulate Traffic</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchAnalyticsData}
            disabled={isLoading}
            className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {simulatedFeedback && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{simulatedFeedback}</span>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">
            Total Clicks
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
            {analytics?.totalClicks.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Redirect requests processed
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">
            Unique Visitors
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
            {analytics?.uniqueVisitors.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Distinct IP origin addresses
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">
            Top Country
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 truncate">
            {topCountry}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {analytics?.countries[0] ? `${analytics.countries[0].percentage}% of all traffic` : 'Awaiting visits'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">
            Top Referrer
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 truncate">
            {topReferrer}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Primary acquisition channel
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Daily Click Volume (Last 7 Days)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological traffic trend
            </p>
          </div>
        </div>

        {/* Clean Bar Chart */}
        <div className="h-48 flex items-end gap-3 sm:gap-6 pt-6 pb-2 border-b border-slate-100">
          {analytics?.timeline.map((point) => {
            const heightPercent = maxTimelineClicks > 0
              ? Math.max(Math.round((point.clicks / maxTimelineClicks) * 100), 4)
              : 4;

            const formattedDay = new Date(point.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'numeric',
              day: 'numeric'
            });

            return (
              <div
                key={point.date}
                className="flex-1 flex flex-col items-center h-full justify-end group relative"
              >
                {/* Floating tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap shadow-sm z-10 font-mono">
                  {point.clicks} clicks on {point.date}
                </div>

                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[48px] bg-slate-800 group-hover:bg-indigo-600 rounded-t transition-all duration-200 min-h-[4px]"
                />
                <span className="text-[10px] text-slate-500 mt-2 font-mono tabular-nums text-center truncate w-full">
                  {formattedDay}
                </span>
                <span className="text-[11px] font-mono font-semibold text-slate-800 mt-0.5 tabular-nums">
                  {point.clicks}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Devices & Browsers + Geo & Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Device & Browser Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Device Distribution
              </h3>
              <span className="text-xs text-slate-400 font-mono">Breakdown</span>
            </div>
            <div className="space-y-3">
              {analytics?.devices.map(d => (
                <div key={d.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 capitalize">
                      {d.label}
                    </span>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {d.count} ({d.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${d.percentage}%` }}
                      className="h-full bg-slate-800 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Browser Engines
              </h3>
              <span className="text-xs text-slate-400 font-mono">Top Clients</span>
            </div>
            <div className="space-y-2.5">
              {analytics?.browsers.slice(0, 5).map(b => (
                <div key={b.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{b.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${b.percentage}%` }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                    </div>
                    <span className="font-mono text-slate-500 tabular-nums w-12 text-right">
                      {b.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Geographic & Referrer Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Top Countries
              </h3>
              <span className="text-xs text-slate-400 font-mono">Geographic Reach</span>
            </div>
            <div className="space-y-3">
              {analytics?.countries.slice(0, 5).map(c => (
                <div key={c.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{c.label}</span>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {c.count} ({c.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${c.percentage}%` }}
                      className="h-full bg-emerald-600 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Traffic Origin / Referrers
              </h3>
              <span className="text-xs text-slate-400 font-mono">Channels</span>
            </div>
            <div className="space-y-2.5">
              {analytics?.referrers.slice(0, 5).map(r => (
                <div key={r.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-mono truncate max-w-[180px]">
                    {r.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${r.percentage}%` }}
                        className="h-full bg-amber-600 rounded-full"
                      />
                    </div>
                    <span className="font-mono text-slate-500 tabular-nums w-12 text-right">
                      {r.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Click Audit Stream */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Recent Click Stream
            </h3>
            <p className="text-xs text-slate-500">
              Live chronological telemetry events captured by redirect handlers
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Showing latest {analytics?.recentClicks.length || 0} events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Origin IP</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Device</th>
                <th className="py-2.5 px-4">Browser & OS</th>
                <th className="py-2.5 px-4">Referrer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics?.recentClicks.slice(0, 15).map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">
                    {c.ip}
                  </td>
                  <td className="py-2.5 px-4 text-slate-800">
                    {c.city ? `${c.city}, ` : ''}{c.country}
                  </td>
                  <td className="py-2.5 px-4 capitalize text-slate-700">
                    {c.deviceType}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {c.browser} / {c.os}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-500 truncate max-w-xs">
                    {c.referer}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
