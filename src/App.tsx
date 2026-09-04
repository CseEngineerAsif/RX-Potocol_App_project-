/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AppSettings,
  AppTheme,
  Department,
  Specialty,
  Category,
  Protocol,
  ActiveTab,
} from './types';
import {
  initializeStorage,
  loadSettings,
  saveSettings,
  loadDepartments,
  saveDepartments,
  loadSpecialties,
  saveSpecialties,
  loadProtocols,
  saveProtocols,
  loadFavorites,
  toggleFavorite,
  loadRecentlyViewed,
  recordRecentlyViewed,
} from './services/storage';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { SearchPage } from './components/SearchPage';
import { FavoritesPage } from './components/FavoritesPage';
import { ManageView } from './components/ManageView';
import { ProtocolView } from './components/ProtocolView';
import { ProtocolEditor } from './components/ProtocolEditor';

export default function App() {
  // 1. Storage & State Initialization
  const [isInitialized, setIsInitialized] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [departments, setDepartments] = useState<Department[]>(loadDepartments);
  const [specialties, setSpecialties] = useState<Specialty[]>(loadSpecialties);
  const [protocols, setProtocols] = useState<Protocol[]>(loadProtocols);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(loadRecentlyViewed);

  // 2. Navigation & View State
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [viewingProtocol, setViewingProtocol] = useState<Protocol | null>(null);
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null | 'new'>(null);

  // Search parameters when navigated from Home
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDeptFilter, setSearchDeptFilter] = useState('');

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  };

  // Reload all data from storage (after import / reset)
  const reloadAllData = useCallback(() => {
    setSettings(loadSettings());
    setDepartments(loadDepartments());
    setSpecialties(loadSpecialties());
    const loadedProtocols = loadProtocols();
    setProtocols(loadedProtocols);
    setFavorites(loadFavorites());
    setRecentlyViewed(loadRecentlyViewed());

    // If currently viewing a protocol, refresh it or clear if removed
    if (viewingProtocol) {
      const refreshed = loadedProtocols.find((p) => p.id === viewingProtocol.id);
      if (refreshed) {
        setViewingProtocol(refreshed);
      } else {
        setViewingProtocol(null);
      }
    }
  }, [viewingProtocol]);

  // Initial load
  useEffect(() => {
    initializeStorage();
    reloadAllData();
    setIsInitialized(true);
  }, []);

  // Theme synchronization with html root class
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const currentSettings = loadSettings();
    if (currentSettings.theme === 'dark') return true;
    if (currentSettings.theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    let shouldBeDark = false;
    if (settings.theme === 'dark') {
      shouldBeDark = true;
    } else if (settings.theme === 'light') {
      shouldBeDark = false;
    } else {
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches);
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  const handleToggleTheme = () => {
    const nextIsDark = !isDarkMode;
    const nextTheme: AppTheme = nextIsDark ? 'dark' : 'light';

    // Immediate DOM update for instantaneous transition
    if (nextIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setIsDarkMode(nextIsDark);
    const updated: AppSettings = { ...settings, theme: nextTheme };
    setSettings(updated);
    saveSettings(updated);
  };

  // Department / Specialty / Settings Mutators
  const handleSaveDepartments = (newDepts: Department[]) => {
    setDepartments(newDepts);
    saveDepartments(newDepts);
    showToast('Departments updated');
  };

  const handleSaveSpecialties = (newSpecs: Specialty[]) => {
    setSpecialties(newSpecs);
    saveSpecialties(newSpecs);
    showToast('Specialties updated');
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    showToast('Settings saved');
  };

  // Protocol Actions
  const handleSelectProtocol = (protocol: Protocol) => {
    setViewingProtocol(protocol);
    setEditingProtocol(null);
    const updatedRecent = recordRecentlyViewed(protocol.id);
    setRecentlyViewed(updatedRecent);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFavoriteProtocol = (id: string) => {
    const updated = toggleFavorite(id);
    setFavorites(updated);
    const isNowFav = updated.includes(id);
    showToast(isNowFav ? 'Added to favorites' : 'Removed from favorites');
  };

  const handleSaveProtocol = (protocolToSave: Protocol) => {
    const exists = protocols.some((p) => p.id === protocolToSave.id);
    let updated: Protocol[];
    if (exists) {
      updated = protocols.map((p) => (p.id === protocolToSave.id ? protocolToSave : p));
    } else {
      updated = [protocolToSave, ...protocols];
    }

    setProtocols(updated);
    saveProtocols(updated);
    setEditingProtocol(null);
    setViewingProtocol(protocolToSave);
    showToast(exists ? 'Protocol changes saved' : 'New protocol created');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProtocol = (protocolId: string) => {
    const updated = protocols.filter((p) => p.id !== protocolId);
    setProtocols(updated);
    saveProtocols(updated);

    // Also remove from favorites and recent
    const updatedFavorites = favorites.filter((id) => id !== protocolId);
    setFavorites(updatedFavorites);

    const updatedRecent = recentlyViewed.filter((id) => id !== protocolId);
    setRecentlyViewed(updatedRecent);

    setViewingProtocol(null);
    setEditingProtocol(null);
    showToast('Protocol deleted');
  };

  const handleDuplicateProtocol = (protocol: Protocol) => {
    const newId = `prot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const duplicated: Protocol = {
      ...protocol,
      id: newId,
      title: `${protocol.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
    };

    const updated = [duplicated, ...protocols];
    setProtocols(updated);
    saveProtocols(updated);
    setViewingProtocol(duplicated);
    setEditingProtocol(null);
    showToast('Protocol duplicated');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigations from Home
  const handleSelectDepartmentFromHome = (deptId: string) => {
    setSearchDeptFilter(deptId);
    setSearchQuery('');
    setViewingProtocol(null);
    setEditingProtocol(null);
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchFocusFromHome = () => {
    setSearchDeptFilter('');
    setSearchQuery('');
    setViewingProtocol(null);
    setEditingProtocol(null);
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setViewingProtocol(null);
    setEditingProtocol(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewProtocol = () => {
    setViewingProtocol(null);
    setEditingProtocol('new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditProtocol = (protocol: Protocol) => {
    setViewingProtocol(null);
    setEditingProtocol(protocol);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isInitialized) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors font-sans">
      {/* Persistent App Header */}
      <Header
        settings={settings}
        activeTab={activeTab}
        onNavigate={handleTabChange}
        onToggleTheme={handleToggleTheme}
        isDark={isDarkMode}
        totalProtocolsCount={protocols.length}
      />

      {/* Navigation Sub-header (Desktop) & Bottom Bar (Mobile) */}
      <Navigation
        activeTab={activeTab}
        onNavigate={handleTabChange}
        accentColor={settings.accentColor}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Protocol Editor Mode */}
        {editingProtocol !== null ? (
          <ProtocolEditor
            initialProtocol={editingProtocol === 'new' ? null : editingProtocol}
            departments={departments}
            specialties={specialties}
            settings={settings}
            onSave={handleSaveProtocol}
            onCancel={() => {
              if (editingProtocol !== 'new' && editingProtocol) {
                setViewingProtocol(editingProtocol);
              }
              setEditingProtocol(null);
            }}
          />
        ) : viewingProtocol !== null ? (
          /* Protocol Reader View Mode */
          <ProtocolView
            protocol={viewingProtocol}
            departments={departments}
            specialties={specialties}
            settings={settings}
            isFavorite={favorites.includes(viewingProtocol.id)}
            onBack={() => setViewingProtocol(null)}
            onToggleFavorite={handleToggleFavoriteProtocol}
            onEdit={handleEditProtocol}
            onDuplicate={handleDuplicateProtocol}
            onDelete={handleDeleteProtocol}
          />
        ) : (
          /* Primary Tabs Mode */
          <>
            {activeTab === 'home' && (
              <HomePage
                protocols={protocols}
                departments={departments}
                specialties={specialties}
                settings={settings}
                recentlyViewed={recentlyViewed}
                onSelectProtocol={handleSelectProtocol}
                onSelectDepartment={handleSelectDepartmentFromHome}
                onSearchFocus={handleSearchFocusFromHome}
                onNavigateToTab={(tab) => handleTabChange(tab)}
              />
            )}

            {activeTab === 'search' && (
              <SearchPage
                protocols={protocols}
                departments={departments}
                specialties={specialties}
                settings={settings}
                favorites={favorites}
                initialQuery={searchQuery}
                initialDepartmentId={searchDeptFilter}
                onSelectProtocol={handleSelectProtocol}
                onToggleFavorite={handleToggleFavoriteProtocol}
              />
            )}

            {activeTab === 'favorites' && (
              <FavoritesPage
                protocols={protocols}
                departments={departments}
                specialties={specialties}
                settings={settings}
                favorites={favorites}
                onSelectProtocol={handleSelectProtocol}
                onToggleFavorite={handleToggleFavoriteProtocol}
                onExplore={() => handleTabChange('search')}
              />
            )}

            {activeTab === 'manage' && (
              <ManageView
                protocols={protocols}
                departments={departments}
                specialties={specialties}
                settings={settings}
                favorites={favorites}
                onNewProtocol={handleNewProtocol}
                onEditProtocol={handleEditProtocol}
                onDuplicateProtocol={handleDuplicateProtocol}
                onDeleteProtocol={handleDeleteProtocol}
                onSelectProtocol={handleSelectProtocol}
                onSaveDepartments={handleSaveDepartments}
                onSaveSpecialties={handleSaveSpecialties}
                onSaveSettings={handleSaveSettings}
                onDataReloadRequired={reloadAllData}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
          <div className="px-4 py-2.5 rounded-full bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 text-xs font-semibold shadow-lg backdrop-blur-xs flex items-center gap-2">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
