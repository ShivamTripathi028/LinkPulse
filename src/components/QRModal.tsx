import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check } from 'lucide-react';
import { UrlRecord } from '../types';

interface QRModalProps {
  link: UrlRecord;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ link, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  const shortUrl = link?.alias
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${link.alias}`
    : '';

  useEffect(() => {
    if (!canvasRef.current || !shortUrl) return;

    QRCode.toCanvas(
      canvasRef.current,
      shortUrl,
      {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (error) => {
        if (error) console.error(error);
      }
    );
  }, [shortUrl]);

  if (!link) return null;

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const pngUrl = canvasRef.current.toDataURL('image/png');
    const dl = document.createElement('a');
    dl.href = pngUrl;
    dl.download = `qrcode_${link.alias}.png`;
    dl.click();
  };

  const handleCopy = () => {
    if (!shortUrl) return;
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-xl relative text-center">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 rounded"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-slate-900 mb-1">
          QR Code for /{link.alias}
        </h3>
        <p className="text-xs text-slate-500 mb-4 truncate px-2">
          {link.title}
        </p>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl inline-block mb-4">
          <canvas ref={canvasRef} className="rounded" />
        </div>

        <p className="text-xs font-mono text-slate-700 truncate mb-4 px-2">
          {shortUrl}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownloadPng}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
