import React from 'react';
import {
  Search,
  Clock,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { Protocol, Department, Specialty, Category, AppSettings } from '../types';
import { ACCENT_COLOR_CLASSES, getDepartmentIcon } from '../utils/theme';

interface HomePageProps {
  protocols: Protocol[];
  departments: Department[];
  specialties?: Specialty[];
  categories?: Specialty[]; // For backward compatibility
  settings: AppSettings;
  recentlyViewed: string[];
  onSelectProtocol: (protocol: Protocol) => void;
  onSelectDepartment: (deptId: string) => void;
  onSearchFocus: () => void;
  onNavigateToTab: (tab: 'search' | 'favorites' | 'manage') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  protocols,
  departments,
  specialties: propSpecialties,
  categories: propCategories,
  settings,
  recentlyViewed,
  onSelectProtocol,
  onSelectDepartment,
  onSearchFocus,
  onNavigateToTab,
}) => {
  const specialties = propSpecialties || propCategories || [];
  const accent = ACCENT_COLOR_CLASSES[settings.accentColor] || ACCENT_COLOR_CLASSES.blue;

  // Recently viewed protocols list (mapped and valid)
  const recentProtocols = recentlyViewed
    .map((id) => protocols.find((p) => p.id === id))
    .filter((p): p is Protocol => Boolean(p))
    .slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-6 pt-2 sm:pt-4 space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Prominent Quick Search Hero Box */}
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {settings.appName || 'Rx Protocol'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {settings.appSubtitle || 'Clinical Protocol Reference'} — Quick search across all protocols, drugs, and guidelines.
          </p>
        </div>

        {/* Clickable Search Bar */}
        <div
          onClick={onSearchFocus}
          className="cursor-pointer group relative flex items-center w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 hover:border-blue-500 dark:hover:border-blue-400 shadow-sm transition-all"
        >
          <Search className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors mr-3 shrink-0" />
          <span className="text-sm font-medium text-slate-400 dark:text-slate-500 flex-1 truncate">
            Search protocols, keywords, synonyms...
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-md">
            Tap to search
          </span>
        </div>
      </div>

      {/* Custom Departments Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Departments ({departments.length})
          </h2>
          <button
            onClick={() => onNavigateToTab('manage')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Customize
          </button>
        </div>

        {departments.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">No departments available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {departments.map((dept) => {
              const DeptIcon = getDepartmentIcon(dept.icon);
              const count = protocols.filter((p) => p.departmentId === dept.id).length;

              return (
                <button
                  key={dept.id}
                  onClick={() => onSelectDepartment(dept.id)}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-left shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 group-hover:scale-105 transition-transform flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      <DeptIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 dark:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {count} {count === 1 ? 'protocol' : 'protocols'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently Viewed Protocols List (Max 10) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Recently Viewed</span>
          </h2>
          <span className="text-xs text-slate-400">{recentProtocols.length} items</span>
        </div>

        {recentProtocols.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            {protocols.length === 0
              ? 'No protocols available yet.'
              : 'Protocols you open will appear here for fast re-access during your shift.'}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
            {recentProtocols.map((protocol) => {
              const department = departments.find((d) => d.id === protocol.departmentId);
              const specId = protocol.specialtyId || protocol.categoryId;
              const specialty = specialties.find((s) => s.id === specId);

              return (
                <div
                  key={protocol.id}
                  onClick={() => onSelectProtocol(protocol)}
                  className="px-4 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {protocol.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {department && <span>{department.name}</span>}
                      {specialty && (
                        <>
                          <span>•</span>
                          <span>{specialty.name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{protocol.sections?.length || 0} sections</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
