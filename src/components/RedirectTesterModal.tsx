import React, { useState } from 'react';
import {
  ExternalLink,
  X,
  Check,
  Activity,
  ArrowRight
} from 'lucide-react';
import { UrlRecord } from '../types';
import { apiService } from '../services/apiService';

interface RedirectTesterModalProps {
  link: UrlRecord;
  onClose: () => void;
  onRedirectLogged: () => void;
}

export const RedirectTesterModal: React.FC<RedirectTesterModalProps> = ({
  link,
  onClose,
  onRedirectLogged,
}) => {
  const [hasLogged, setHasLogged] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!link) return null;

  const cleanShortDisplay = `pulse.to/${link.alias}`;
  const directRedirectUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${link.alias}`;

  const handleLogOnly = async () => {
    setIsProcessing(true);
    await apiService.recordClick(link.alias);
    setHasLogged(true);
    setIsProcessing(false);
    onRedirectLogged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Test Short Link
            </h3>
            <p className="text-xs text-slate-500">
              Verify redirect and log a test click
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-5 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">
              Short Link
            </div>
            <div className="font-mono text-slate-900 font-semibold text-sm">
              {cleanShortDisplay}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">
              Destination URL
            </div>
            <div className="font-mono text-slate-700 break-all">
              {link.originalUrl}
            </div>
          </div>
        </div>

        {hasLogged ? (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold">Test Click Recorded!</p>
              <p className="text-[11px] text-emerald-700">
                Click count was updated and visitor telemetry was logged.
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleLogOnly}
            disabled={isProcessing}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Log Click Only
          </button>
          <a
            href={directRedirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              apiService.recordClick(link.alias);
              onRedirectLogged();
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Open Destination</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
