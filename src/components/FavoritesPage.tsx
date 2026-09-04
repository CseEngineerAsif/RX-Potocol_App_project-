import React, { useState } from 'react';
import { Star, ChevronRight, Layers, Clock, Search, Folder } from 'lucide-react';
import { Protocol, Department, Specialty, Category, AppSettings } from '../types';
import { ACCENT_COLOR_CLASSES, getDepartmentIcon } from '../utils/theme';

interface FavoritesPageProps {
  protocols: Protocol[];
  departments: Department[];
  specialties?: Specialty[];
  categories?: Specialty[]; // For backward compatibility
  settings: AppSettings;
  favorites: string[];
  onSelectProtocol: (protocol: Protocol) => void;
  onToggleFavorite: (id: string) => void;
  onExplore: () => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  protocols,
  departments,
  specialties: propSpecialties,
  categories: propCategories,
  settings,
  favorites,
  onSelectProtocol,
  onToggleFavorite,
  onExplore,
}) => {
  const specialties = propSpecialties || propCategories || [];
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const accent = ACCENT_COLOR_CLASSES[settings.accentColor] || ACCENT_COLOR_CLASSES.blue;

  const favoriteProtocols = protocols.filter((p) => favorites.includes(p.id));

  const filteredFavorites = favoriteProtocols.filter((p) => {
    if (!selectedDeptFilter) return true;
    return p.departmentId === selectedDeptFilter;
  });

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-6 pt-4 space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <span>Bookmarked Favorites</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quick-access clinical protocols pinned for rapid consultation during shifts.
          </p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          {favoriteProtocols.length} {favoriteProtocols.length === 1 ? 'favorite' : 'favorites'}
        </span>
      </div>

      {/* Department Filter Chips */}
      {favoriteProtocols.length > 0 && departments.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedDeptFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
              !selectedDeptFilter
                ? `${accent.badgeBg} ${accent.badgeText} ${accent.border} border`
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All Departments
          </button>
          {departments.map((dept) => {
            const count = favoriteProtocols.filter((p) => p.departmentId === dept.id).length;
            if (count === 0) return null;
            const isSelected = selectedDeptFilter === dept.id;
            const DeptIcon = getDepartmentIcon(dept.icon);
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptFilter(isSelected ? '' : dept.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                  isSelected
                    ? `${accent.badgeBg} ${accent.badgeText} ${accent.border} border`
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <DeptIcon className="w-3.5 h-3.5" />
                <span>{dept.name}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Protocols List */}
      <div className="space-y-3">
        {filteredFavorites.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 sm:p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {favoriteProtocols.length === 0 ? 'No favorites saved yet' : 'No matching favorites in this department'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Tap the star icon on any medical protocol to pin it here for instant reference.
              </p>
            </div>
            <button
              onClick={onExplore}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold ${accent.button}`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Browse All Protocols</span>
            </button>
          </div>
        ) : (
          filteredFavorites.map((protocol) => {
            const department = departments.find((d) => d.id === protocol.departmentId);
            const specId = protocol.specialtyId || protocol.categoryId;
            const specialty = specialties.find((s) => s.id === specId);
            const DeptIcon = getDepartmentIcon(department?.icon);

            return (
              <div
                key={protocol.id}
                onClick={() => onSelectProtocol(protocol)}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {department && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <DeptIcon className="w-3 h-3 text-slate-500" />
                        <span>{department.name}</span>
                      </span>
                    )}
                    {specialty && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                        <Layers className="w-3 h-3" />
                        <span>{specialty.name}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {protocol.title}
                  </h3>

                  {protocol.synonyms?.length > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic truncate">
                      {protocol.synonyms.join(' • ')}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                    <span>{protocol.sections?.length || 0} sections</span>
                    <span>•</span>
                    <span>
                      Updated{' '}
                      {new Date(protocol.updatedAt || protocol.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(protocol.id);
                    }}
                    className="p-2 rounded-xl text-amber-500 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 transition-colors"
                    title="Remove from favorites"
                    aria-label="Remove favorite"
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  </button>

                  <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
