import React from 'react';
import { Link2, Plus, BarChart3, QrCode, Layers } from 'lucide-react';

export type NavTab = 'shorten' | 'links' | 'analytics' | 'qr';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenNewLink: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewLink,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('shorten')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-slate-800 transition-colors">
              <Link2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              LinkPulse
            </span>
          </button>
        </div>

        {/* 4 Main Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('shorten')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'shorten'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Shorten
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'links'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Links
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'qr'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            QR Studio
          </button>
        </nav>

        {/* Right Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewLink}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Link</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 bg-white py-2 px-2">
        <button
          onClick={() => setActiveTab('shorten')}
          className={`px-3 py-1 text-xs font-medium rounded ${
            activeTab === 'shorten' ? 'text-slate-900 font-bold bg-slate-100' : 'text-slate-500'
          }`}
        >
          Shorten
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className={`px-3 py-1 text-xs font-medium rounded ${
            activeTab === 'links' ? 'text-slate-900 font-bold bg-slate-100' : 'text-slate-500'
          }`}
        >
          My Links
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3 py-1 text-xs font-medium rounded ${
            activeTab === 'analytics' ? 'text-slate-900 font-bold bg-slate-100' : 'text-slate-500'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={`px-3 py-1 text-xs font-medium rounded ${
            activeTab === 'qr' ? 'text-slate-900 font-bold bg-slate-100' : 'text-slate-500'
          }`}
        >
          QR Studio
        </button>
      </div>
    </header>
  );
};
