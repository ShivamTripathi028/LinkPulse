/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UrlRecord } from './types';
import { apiService } from './services/apiService';
import { Navbar, NavTab } from './components/Navbar';
import { ShortenPanel } from './components/ShortenPanel';
import { LinksTable } from './components/LinksTable';
import { AnalyticsView } from './components/AnalyticsView';
import { QRStudio } from './components/QRStudio';
import { QRModal } from './components/QRModal';
import { RedirectTesterModal } from './components/RedirectTesterModal';
import { RedirectHandler } from './components/RedirectHandler';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('shorten');
  const [urls, setUrls] = useState<UrlRecord[]>([]);
  
  // Modals state
  const [activeQrLink, setActiveQrLink] = useState<UrlRecord | null>(null);
  const [activeTesterLink, setActiveTesterLink] = useState<UrlRecord | null>(null);
  const [selectedAnalyticsAlias, setSelectedAnalyticsAlias] = useState<string | undefined>(undefined);

  // Check URL path for direct redirect: /r/:alias
  const [redirectAlias, setRedirectAlias] = useState<string | null>(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/r\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Also support hash /#r/:alias for easy testing in sandboxed environments
    const hash = window.location.hash;
    const hashMatch = hash.match(/^#\/?r\/([a-zA-Z0-9_-]+)/);
    if (hashMatch) return hashMatch[1];

    return null;
  });

  const loadUrls = async () => {
    try {
      const data = await apiService.getUrls();
      setUrls(data);
    } catch (err) {
      console.error('Failed to load URLs:', err);
    }
  };

  useEffect(() => {
    loadUrls();
  }, []);

  // Handle created link
  const handleLinkCreated = (newLink: UrlRecord) => {
    setUrls(prev => [newLink, ...prev.filter(u => u.alias !== newLink.alias)]);
  };

  // Navigations
  const handleOpenAnalytics = (alias: string) => {
    setSelectedAnalyticsAlias(alias);
    setActiveTab('analytics');
  };

  const handleOpenQR = (link: UrlRecord) => {
    setActiveQrLink(link);
  };

  const handleTestRedirect = (link: UrlRecord) => {
    setActiveTesterLink(link);
  };

  // If visiting an actual short URL in SPA mode
  if (redirectAlias) {
    return (
      <RedirectHandler
        alias={redirectAlias}
        onBackToApp={() => {
          window.history.pushState({}, '', '/');
          setRedirectAlias(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900">
      {/* Top Navbar with 4 tabs: Shorten, My Links, Analytics, QR Studio */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewLink={() => setActiveTab('shorten')}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'shorten' && (
          <ShortenPanel
            onLinkCreated={handleLinkCreated}
            onOpenAnalytics={handleOpenAnalytics}
            onOpenQR={handleOpenQR}
            onTestRedirect={handleTestRedirect}
          />
        )}

        {activeTab === 'links' && (
          <LinksTable
            urls={urls}
            onRefresh={loadUrls}
            onOpenAnalytics={handleOpenAnalytics}
            onOpenQR={handleOpenQR}
            onTestRedirect={handleTestRedirect}
            onNewLink={() => setActiveTab('shorten')}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            urls={urls}
            initialAlias={selectedAnalyticsAlias}
            onRefreshUrls={loadUrls}
          />
        )}

        {activeTab === 'qr' && (
          <QRStudio urls={urls} selectedLink={activeQrLink} />
        )}
      </main>

      {/* Clean, Minimalist Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-semibold text-slate-900">LinkPulse</span>
            <span aria-hidden="true">·</span>
            <span>Simple URL shortener & real-time click analytics</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Fast Redirection</span>
            <span aria-hidden="true">·</span>
            <span>Live Analytics</span>
            <span aria-hidden="true">·</span>
            <span>Custom Aliases</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {activeQrLink && (
        <QRModal
          link={activeQrLink}
          onClose={() => setActiveQrLink(null)}
        />
      )}

      {activeTesterLink && (
        <RedirectTesterModal
          link={activeTesterLink}
          onClose={() => setActiveTesterLink(null)}
          onRedirectLogged={loadUrls}
        />
      )}
    </div>
  );
}
