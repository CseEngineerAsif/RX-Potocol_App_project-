import React from 'react';
import { Home, Search, Star, Settings2, Plus } from 'lucide-react';
import { ActiveTab, AccentColor } from '../types';
import { ACCENT_COLOR_CLASSES } from '../utils/theme';

interface NavigationProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  accentColor: AccentColor;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onNavigate,
  accentColor,
}) => {
  const accent = ACCENT_COLOR_CLASSES[accentColor] || ACCENT_COLOR_CLASSES.blue;

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'manage', label: 'Manage', icon: Settings2 },
  ];

  return (
    <>
      {/* Mobile Fixed Bottom Navigation */}
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 dark:bg-slate-900/95 dark:border-slate-800 md:hidden safe-area-inset-bottom"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-lg transition-colors focus:outline-none ${
                  isActive
                    ? accent.text
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
                </div>
                <span className={`text-[11px] mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span
                    className={`absolute bottom-1 w-6 h-0.5 rounded-full ${accent.bg}`}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sub-Header Navigation Bar */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-2 h-12">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors focus:outline-none ${
                  isActive
                    ? `${accent.badgeBg} ${accent.badgeText}`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
