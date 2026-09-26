import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  BarChart3,
  Sliders,
  Calendar,
  ArrowRight,
  AlertCircle,
  Globe
} from 'lucide-react';
import { UrlRecord } from '../types';
import { apiService, CreateUrlInput } from '../services/apiService';

interface ShortenPanelProps {
  onLinkCreated: (link: UrlRecord) => void;
  onOpenAnalytics: (alias: string) => void;
  onOpenQR: (link: UrlRecord) => void;
  onTestRedirect: (link: UrlRecord) => void;
}

export const ShortenPanel: React.FC<ShortenPanelProps> = ({
  onLinkCreated,
  onOpenAnalytics,
  onOpenQR,
  onTestRedirect,
}) => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<'pulse.to' | 'lp.is' | 'direct'>('pulse.to');
  const [showOptions, setShowOptions] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latestCreated, setLatestCreated] = useState<UrlRecord | null>(null);
  const [copiedType, setCopiedType] = useState<'short' | 'direct' | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setOriginalUrl(text);
      }
    } catch {
      // Ignore if clipboard permission not granted
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let cleanUrl = originalUrl.trim();
    if (!cleanUrl) {
      setErrorMessage('Please enter a destination URL.');
      return;
    }

    if (customAlias.trim()) {
      if (!/^[a-zA-Z0-9_-]{2,30}$/.test(customAlias.trim())) {
        setErrorMessage('Custom alias must be 2-30 characters (letters, numbers, hyphens, or underscores).');
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload: CreateUrlInput = {
        originalUrl: cleanUrl,
        customAlias: customAlias.trim() || undefined,
        title: title.trim() || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };

      const created = await apiService.createUrl(payload);
      setLatestCreated(created);
      onLinkCreated(created);

      // Reset form
      setOriginalUrl('');
      setCustomAlias('');
      setTitle('');
      setExpiresAt('');
      setShowOptions(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to shorten URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (text: string, type: 'short' | 'direct') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const directWorkingUrl = latestCreated
    ? `${window.location.origin}/r/${latestCreated.alias}`
    : '';

  const cleanShortDisplay = latestCreated
    ? `${selectedDomain === 'direct' ? window.location.host + '/r' : selectedDomain}/${latestCreated.alias}`
    : '';

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-2">
          Shorten a Long URL
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Create clean, memorable short links and track live click analytics.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Destination URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Destination URL
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                <Link2 className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="https://example.com/very-long-link-to-shorten..."
                value={originalUrl}
                onChange={e => setOriginalUrl(e.target.value)}
                className="w-full pl-11 pr-20 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-mono"
                required
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Paste
              </button>
            </div>
          </div>

          {/* Custom Alias & Domain Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Short Domain
              </label>
              <div className="relative">
                <select
                  value={selectedDomain}
                  onChange={e => setSelectedDomain(e.target.value as any)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="pulse.to">pulse.to (Branded Short)</option>
                  <option value="lp.is">lp.is (Ultra-Short)</option>
                  <option value="direct">Current Host ({window.location.host.substring(0, 16)}...)</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Custom Alias (Optional)
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 focus-within:ring-2 focus-within:ring-slate-900 focus-within:bg-white transition-all overflow-hidden">
                <span className="px-3 py-2.5 text-xs text-slate-500 font-mono border-r border-slate-200 bg-slate-100 shrink-0 select-none">
                  {selectedDomain === 'direct' ? 'r/' : `${selectedDomain}/`}
                </span>
                <input
                  type="text"
                  placeholder="e.g. my-promo or axis-ad"
                  value={customAlias}
                  onChange={e => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  className="w-full px-3 py-2.5 text-xs font-mono text-slate-900 bg-transparent focus:outline-none"
                  maxLength={30}
                />
              </div>
            </div>
          </div>

          {/* More Options Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>{showOptions ? 'Hide title & expiration' : '+ Add title or expiration date'}</span>
            </button>

            {showOptions && (
              <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Display Title (for your links list)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Project Launch, Product Demo"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Expiration Date (optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !originalUrl.trim()}
            className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Shorten URL</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Link Ready Success Card */}
        {latestCreated && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Link Ready
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                  alias: {latestCreated.alias}
                </span>
              </div>

              {/* Clean Short Link Display */}
              <div className="bg-white border border-emerald-200/80 rounded-lg p-3.5 mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                      Short Link
                    </span>
                    <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 block truncate">
                      {cleanShortDisplay}
                    </span>
                    <span className="text-xs text-slate-500 truncate block mt-0.5">
                      Redirects to: {latestCreated.originalUrl}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyText(cleanShortDisplay, 'short')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
                    >
                      {copiedType === 'short' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Short Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions & Direct URL */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyText(directWorkingUrl, 'direct')}
                    className="text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    {copiedType === 'direct' ? 'Copied Direct URL!' : 'Copy Direct URL'}
                  </button>

                  <button
                    onClick={() => onTestRedirect(latestCreated)}
                    className="flex items-center gap-1 text-xs font-medium text-emerald-800 hover:text-emerald-950 bg-emerald-100/70 hover:bg-emerald-200/80 px-2.5 py-1.5 rounded-md transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test Link</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenQR(latestCreated)}
                    className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Code</span>
                  </button>
                  <button
                    onClick={() => onOpenAnalytics(latestCreated.alias)}
                    className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Analytics</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
