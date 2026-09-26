import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  Copy,
  Check,
  QrCode,
  Sliders,
  ExternalLink,
  Sparkles,
  Link2
} from 'lucide-react';
import { UrlRecord } from '../types';

interface QRStudioProps {
  urls: UrlRecord[];
  selectedLink?: UrlRecord | null;
}

export const QRStudio: React.FC<QRStudioProps> = ({ urls, selectedLink }) => {
  const getOrigin = () => (typeof window !== 'undefined' ? window.location.origin : '');

  const [activeUrlText, setActiveUrlText] = useState<string>(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (selectedLink) return `${origin}/r/${selectedLink.alias}`;
    if (urls.length > 0) return `${origin}/r/${urls[0].alias}`;
    return origin;
  });

  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [margin, setMargin] = useState(2);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const origin = getOrigin();
    if (selectedLink) {
      setActiveUrlText(`${origin}/r/${selectedLink.alias}`);
    } else if (urls.length > 0 && (!activeUrlText || activeUrlText === origin)) {
      setActiveUrlText(`${origin}/r/${urls[0].alias}`);
    }
  }, [selectedLink, urls]);

  useEffect(() => {
    if (!canvasRef.current || !activeUrlText) return;

    QRCode.toCanvas(
      canvasRef.current,
      activeUrlText,
      {
        width: 320,
        margin,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel,
      },
      (error) => {
        if (error) console.error('QR code generation error:', error);
      }
    );
  }, [activeUrlText, fgColor, bgColor, margin, errorCorrectionLevel]);

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const pngUrl = canvasRef.current.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `qrcode_${Date.now()}.png`;
    downloadLink.click();
  };

  const handleDownloadSvg = async () => {
    try {
      const svgString = await QRCode.toString(activeUrlText, {
        type: 'svg',
        margin,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel,
      });

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `qrcode_${Date.now()}.svg`;
      downloadLink.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeUrlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
          Vector QR Code Studio
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Generate high-resolution printable QR codes with error correction and color styling for physical marketing, flyers, and billboards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select or Enter Link
            </label>
            {urls.length > 0 && (
              <select
                onChange={e => setActiveUrlText(e.target.value)}
                className="w-full mb-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">-- Choose from your shortened links --</option>
                {urls.map(u => (
                  <option
                    key={u.alias}
                    value={`${window.location.origin}/r/${u.alias}`}
                  >
                    /{u.alias} — {u.title}
                  </option>
                ))}
              </select>
            )}

            <div className="relative">
              <input
                type="text"
                value={activeUrlText}
                onChange={e => setActiveUrlText(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Color & Styling Controls */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <span className="text-xs font-semibold text-slate-800 block">
              Styling & Palette
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Foreground Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={e => setFgColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={e => setFgColor(e.target.value)}
                    className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Quiet Zone Margin ({margin}px)
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={margin}
                  onChange={e => setMargin(Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Error Correction Level
                </label>
                <select
                  value={errorCorrectionLevel}
                  onChange={e => setErrorCorrectionLevel(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none"
                >
                  <option value="L">L - 7% damage recovery</option>
                  <option value="M">M - 15% damage recovery (Standard)</option>
                  <option value="Q">Q - 25% damage recovery</option>
                  <option value="H">H - 30% damage recovery (Best for print)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Download Column */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 shadow-2xs">
            <canvas ref={canvasRef} className="max-w-full h-auto rounded" />
          </div>

          <div className="w-full space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadPng}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
              <button
                onClick={handleDownloadSvg}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Vector SVG</span>
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Encoded Destination Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
