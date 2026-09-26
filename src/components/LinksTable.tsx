import React, { useState } from 'react';
import {
  Search,
  Copy,
  Check,
  ExternalLink,
  BarChart3,
  QrCode,
  Trash2,
  Download,
  ArrowUpDown,
  Plus
} from 'lucide-react';
import { UrlRecord } from '../types';
import { apiService } from '../services/apiService';

interface LinksTableProps {
  urls: UrlRecord[];
  onRefresh: () => void;
  onOpenAnalytics: (alias: string) => void;
  onOpenQR: (link: UrlRecord) => void;
  onTestRedirect: (link: UrlRecord) => void;
  onNewLink: () => void;
}

export const LinksTable: React.FC<LinksTableProps> = ({
  urls,
  onRefresh,
  onOpenAnalytics,
  onOpenQR,
  onTestRedirect,
  onNewLink,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'clicks' | 'title'>('newest');
  const [copiedAlias, setCopiedAlias] = useState<string | null>(null);

  const handleCopy = (alias: string) => {
    // Copy the short link
    const shortLink = `pulse.to/${alias}`;
    navigator.clipboard.writeText(shortLink);
    setCopiedAlias(alias);
    setTimeout(() => setCopiedAlias(null), 2000);
  };

  const handleToggleActive = async (link: UrlRecord) => {
    try {
      await apiService.updateUrl(link.alias, { isActive: !link.isActive });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const [deleteConfirmAlias, setDeleteConfirmAlias] = useState<string | null>(null);

  const handleDelete = async (alias: string) => {
    if (deleteConfirmAlias === alias) {
      try {
        await apiService.deleteUrl(alias);
        setDeleteConfirmAlias(null);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    } else {
      setDeleteConfirmAlias(alias);
      setTimeout(() => setDeleteConfirmAlias(null), 4000);
    }
  };

  const filtered = urls.filter(u => {
    const matchesSearch =
      u.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.title.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return u.isActive;
    if (statusFilter === 'inactive') return !u.isActive;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'clicks') return b.clicksCount - a.clicksCount;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const formatDate = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Links
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>{urls.length} Links</span>
            <span aria-hidden="true">·</span>
            <span>
              {urls.reduce((acc, u) => acc + u.clicksCount, 0).toLocaleString()} Total Clicks
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => apiService.exportUrlsAsCsv(urls)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onNewLink}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Link</span>
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, alias, or URL..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  statusFilter === 'inactive'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paused
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="clicks">Most Clicks</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              {searchTerm ? 'No matching links found' : 'No links created yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {searchTerm
                ? 'Try a different search term or clear the filter.'
                : 'Shorten your first link to start tracking click analytics.'}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={onNewLink}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Shorten a URL
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Title & Destination</th>
                  <th className="py-3 px-4">Short Link</th>
                  <th className="py-3 px-4 text-right">Clicks</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sorted.map(link => {
                  const isCopied = copiedAlias === link.alias;
                  return (
                    <tr
                      key={link.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Title & Original URL */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                        <div className="font-semibold text-slate-900 truncate">
                          {link.title}
                        </div>
                        <div className="text-slate-400 truncate text-[11px] mt-0.5">
                          {link.originalUrl}
                        </div>
                      </td>

                      {/* Short Link */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            pulse.to/{link.alias}
                          </span>
                          <button
                            onClick={() => handleCopy(link.alias)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title="Copy short link"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Clicks */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-sm tabular-nums text-slate-900">
                        {link.clicksCount.toLocaleString()}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] tabular-nums whitespace-nowrap">
                        {formatDate(link.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(link)}
                          className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                            link.isActive
                              ? 'text-emerald-700 hover:text-emerald-900'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                          title={link.isActive ? 'Pause link' : 'Activate link'}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              link.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          <span>{link.isActive ? 'Active' : 'Paused'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onTestRedirect(link)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            title="Test link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenAnalytics(link.alias)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Analytics"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenQR(link)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            title="QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(link.alias)}
                            className={`p-1.5 rounded-md transition-colors ${
                              deleteConfirmAlias === link.alias
                                ? 'bg-red-600 text-white px-2 text-[11px] font-semibold'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={deleteConfirmAlias === link.alias ? 'Click again to confirm delete' : 'Delete link'}
                          >
                            {deleteConfirmAlias === link.alias ? (
                              <span>Confirm?</span>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
