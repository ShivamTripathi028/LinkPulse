import React, { useEffect, useState } from 'react';
import { ExternalLink, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { UrlRecord } from '../types';
import { apiService } from '../services/apiService';

interface RedirectHandlerProps {
  alias: string;
  onBackToApp: () => void;
}

export const RedirectHandler: React.FC<RedirectHandlerProps> = ({ alias, onBackToApp }) => {
  const [urlRecord, setUrlRecord] = useState<UrlRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(2);

  useEffect(() => {
    async function resolveAndRedirect() {
      try {
        let found: UrlRecord | undefined;
        try {
          const res = await fetch(`/api/urls/${alias}`);
          if (res.ok) {
            found = await res.json();
          }
        } catch {
          // fallback to full list
        }

        if (!found) {
          const urls = await apiService.getUrls();
          found = urls.find(u => u.alias.toLowerCase() === alias.toLowerCase());
        }

        if (!found) {
          setError(`No short link found matching "${alias}".`);
          return;
        }

        if (!found.isActive) {
          setError(`This link (/${alias}) is currently paused or inactive.`);
          return;
        }

        if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
          setError(`This short link expired on ${new Date(found.expiresAt).toLocaleDateString()}.`);
          return;
        }

        setUrlRecord(found);
        // Record telemetry click
        await apiService.recordClick(found.alias);
      } catch (err: any) {
        setError(err.message || 'Failed to resolve short URL.');
      }
    }

    resolveAndRedirect();
  }, [alias]);

  useEffect(() => {
    if (!urlRecord) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      window.location.href = urlRecord.originalUrl;
    }
  }, [countdown, urlRecord]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            Link Unavailable
          </h2>
          <p className="text-xs text-slate-600 mb-6">{error}</p>
          <button
            onClick={onBackToApp}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Go to LinkPulse Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center shadow-sm space-y-5">
        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <ExternalLink className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Redirecting via LinkPulse
          </h2>
          <p className="text-xs text-slate-500">
            HTTP 307 Temporary Redirect with telemetry logging
          </p>
        </div>

        {urlRecord && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
              Destination
            </span>
            <p className="font-mono text-xs text-slate-800 truncate font-medium">
              {urlRecord.originalUrl}
            </p>
          </div>
        )}

        <div className="text-xs text-slate-600 flex items-center justify-center gap-2">
          <span>Redirecting in</span>
          <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-xs">
            {countdown}
          </span>
          <span>seconds...</span>
        </div>

        <div className="pt-2">
          {urlRecord && (
            <a
              href={urlRecord.originalUrl}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Proceed Immediately</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={onBackToApp}
            className="mt-3 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel and Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
