import React from 'react';
import { Sun, Moon, Stethoscope } from 'lucide-react';
import { AppSettings, ActiveTab } from '../types';
import { ACCENT_COLOR_CLASSES } from '../utils/theme';

interface HeaderProps {
  settings: AppSettings;
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onToggleTheme: () => void;
  isDark: boolean;
  totalProtocolsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onNavigate,
  onToggleTheme,
  isDark,
  totalProtocolsCount,
}) => {
  const accent = ACCENT_COLOR_CLASSES[settings.accentColor] || ACCENT_COLOR_CLASSES.blue;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 dark:bg-slate-900/95 dark:border-slate-800/80 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* App Title & Subtitle */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 text-left group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg p-1"
          aria-label="Go to Home"
        >
          <div
            className={`w-10 h-10 rounded-xl ${accent.bg} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
          >
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white truncate">
                {settings.appName || 'Rx Protocol'}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {totalProtocolsCount} {totalProtocolsCount === 1 ? 'protocol' : 'protocols'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-[320px]">
              {settings.appSubtitle || 'Clinical Protocol Reference'}
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="min-w-[44px] min-h-[44px] sm:w-11 sm:h-11 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer touch-manipulation"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400 stroke-[2.5]" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300 stroke-2" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
