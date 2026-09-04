import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Check,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
  Palette,
  Type,
  FileJson,
  Send,
  ExternalLink,
} from 'lucide-react';
import { AppSettings, AccentColor, AppTheme, ReadingFontSize } from '../types';
import { ACCENT_COLOR_CLASSES } from '../utils/theme';
import { downloadBackupFile, validateAndImportData, resetToDefaultData, clearAllProtocolsData } from '../services/storage';

interface AppSettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onDataReloadRequired: () => void;
}

// Fixed official Violet Dots 3x3 dot matrix logo
const VioletDotsLogo: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg
    viewBox="0 0 36 36"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    {/* Row 1: ● · ● */}
    <circle cx="6" cy="6" r="4.25" />
    <circle cx="18" cy="6" r="1.75" />
    <circle cx="30" cy="6" r="4.25" />

    {/* Row 2: · ● · */}
    <circle cx="6" cy="18" r="1.75" />
    <circle cx="18" cy="18" r="4.25" />
    <circle cx="30" cy="18" r="1.75" />

    {/* Row 3: ● · ● */}
    <circle cx="6" cy="30" r="4.25" />
    <circle cx="18" cy="30" r="1.75" />
    <circle cx="30" cy="30" r="4.25" />
  </svg>
);

export const AppSettingsView: React.FC<AppSettingsViewProps> = ({
  settings,
  onSaveSettings,
  onDataReloadRequired,
}) => {
  const [theme, setTheme] = useState<AppTheme>(settings.theme);
  const [accentColor, setAccentColor] = useState<AccentColor>(settings.accentColor);
  const [fontSize, setFontSize] = useState<ReadingFontSize>(settings.fontSize);

  // Sync external settings changes (e.g. header theme toggle)
  React.useEffect(() => {
    setTheme(settings.theme);
    setAccentColor(settings.accentColor);
    setFontSize(settings.fontSize);
  }, [settings]);

  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAccentChange = (color: AccentColor) => {
    setAccentColor(color);
    const updated: AppSettings = { ...settings, accentColor: color };
    onSaveSettings(updated);
  };

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    const updated: AppSettings = { ...settings, theme: newTheme };
    onSaveSettings(updated);
  };

  const handleFontSizeChange = (size: ReadingFontSize) => {
    setFontSize(size);
    const updated: AppSettings = { ...settings, fontSize: size };
    onSaveSettings(updated);
  };

  const handleExport = () => {
    downloadBackupFile();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = validateAndImportData(content, 'replace');
        setImportStatus(result);
        if (result.success) {
          onDataReloadRequired();
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetData = () => {
    resetToDefaultData();
    setShowResetConfirm(false);
    onDataReloadRequired();
  };

  const handleClearData = () => {
    clearAllProtocolsData();
    setShowClearConfirm(false);
    onDataReloadRequired();
  };

  const colorsList: { key: AccentColor; label: string; bg: string }[] = [
    { key: 'blue', label: 'Clinical Blue', bg: 'bg-blue-600' },
    { key: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-600' },
    { key: 'indigo', label: 'Indigo Navy', bg: 'bg-indigo-600' },
    { key: 'teal', label: 'Cyan / Teal', bg: 'bg-teal-600' },
    { key: 'rose', label: 'Emergency Rose', bg: 'bg-rose-600' },
    { key: 'amber', label: 'Warm Amber', bg: 'bg-amber-600' },
    { key: 'slate', label: 'Slate Charcoal', bg: 'bg-slate-700' },
  ];

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in">
      {/* Visual Appearance & Theme */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-slate-500" />
            <span>Theme & Accent Color</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose light/dark display and your preferred clinical accent styling.
          </p>
        </div>

        {/* Theme Chooser */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Display Mode
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>Dark Mode</span>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('system')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                theme === 'system'
                  ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Monitor className="w-5 h-5 text-slate-400" />
              <span>System Default</span>
            </button>
          </div>
        </div>

        {/* Accent Color Chooser */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Accent Color
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {colorsList.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => handleAccentChange(c.key)}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                  accentColor === c.key
                    ? 'border-slate-900 dark:border-white ring-2 ring-blue-500 shadow-xs text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full ${c.bg}`} />
                <span className="truncate">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Chooser */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Protocol Reading Font Size
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleFontSizeChange('normal')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                fontSize === 'normal'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Standard (Compact)</span>
            </button>
            <button
              type="button"
              onClick={() => handleFontSizeChange('large')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer ${
                fontSize === 'large'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Type className="w-5 h-5" />
              <span>Large (Ward Rounds)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backup, Export & Import */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileJson className="w-4 h-4 text-slate-500" />
            <span>Data Backup & Restore</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export all protocols, departments, specialties, and settings to a JSON file for safe offline keeping.
          </p>
        </div>

        {importStatus && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              importStatus.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300'
            }`}
          >
            {importStatus.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span>Export Data (JSON)</span>
          </button>

          {/* Import Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelected}
              className="hidden"
              id="json-file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Import Data (JSON)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Management Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Data Management</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Clear your protocols or perform a full wipe to start completely fresh.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Protocols</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Wipe All & Start Fresh</span>
          </button>
        </div>
      </div>

      {/* About Violet Dots - Permanent Company Information */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">About Violet Dots</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-4 pt-1">
          {/* Official 3x3 Dot Logo */}
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white flex items-center justify-center shrink-0 shadow-2xs">
            <VioletDotsLogo className="w-8 h-8" />
          </div>

          <div className="space-y-3 min-w-0 flex-1">
            <div>
              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Violet Dots
              </h4>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Where ideas become possibilities
              </p>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Violet Dots is a software company focused on creating thoughtful, practical digital solutions that turn ideas into useful possibilities. We believe in simple design, meaningful technology, and building products that make everyday work easier.
            </p>

            {/* Official Permanent Telegram Channel */}
            <div className="pt-1.5">
              <a
                href="https://t.me/VioletDots"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-3.5 py-2 rounded-xl border border-sky-200 dark:border-sky-800/70 bg-sky-50/70 dark:bg-sky-950/30 hover:bg-sky-100/90 dark:hover:bg-sky-900/40 text-slate-800 dark:text-slate-100 transition-all group shadow-2xs cursor-pointer"
                title="Official Telegram Channel: @VioletDots"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Send className="w-4 h-4 -rotate-45 -translate-y-0.5 translate-x-0.5" />
                </div>
                <div className="flex flex-col text-left pr-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none mb-0.5">
                    Telegram Channel
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 group-hover:underline leading-tight">
                    @VioletDots
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 ml-1 group-hover:text-sky-500 transition-colors shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white text-center">
              Wipe all data and start fresh?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
              This will erase all protocols, departments, specialties, and favorites, resetting the library to a completely empty state.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
              >
                Wipe Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white text-center">
              Clear All Protocols?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
              All stored medical protocols and favorites will be cleared. Your custom departments and specialties will be kept.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
