import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  Star,
  Layers,
  ChevronRight,
  Tag,
  ArrowLeft,
  Folder,
} from 'lucide-react';
import { Protocol, Department, Specialty, Category, AppSettings } from '../types';
import { ACCENT_COLOR_CLASSES, getDepartmentIcon } from '../utils/theme';
import { searchAll } from '../services/search';

interface SearchPageProps {
  protocols: Protocol[];
  departments: Department[];
  specialties?: Specialty[];
  categories?: Specialty[]; // For backward compatibility
  settings: AppSettings;
  favorites: string[];
  initialQuery?: string;
  initialDepartmentId?: string;
  onSelectProtocol: (protocol: Protocol) => void;
  onToggleFavorite: (id: string) => void;
}

type DrilldownState =
  | { type: 'specialty'; id: string }
  | { type: 'department'; id: string }
  | null;

export const SearchPage: React.FC<SearchPageProps> = ({
  protocols,
  departments,
  specialties: propSpecialties,
  categories: propCategories,
  settings,
  favorites,
  initialQuery = '',
  initialDepartmentId = '',
  onSelectProtocol,
  onToggleFavorite,
}) => {
  const specialties = propSpecialties || propCategories || [];
  const [query, setQuery] = useState(initialQuery);
  const [selectedDeptId, setSelectedDeptId] = useState(initialDepartmentId);
  const [selectedSpecId, setSelectedSpecId] = useState('');
  const [drilldown, setDrilldown] = useState<DrilldownState>(null);

  const accent = ACCENT_COLOR_CLASSES[settings.accentColor] || ACCENT_COLOR_CLASSES.blue;

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (initialDepartmentId) setSelectedDeptId(initialDepartmentId);
  }, [initialDepartmentId]);

  // Specialties filtered by selected department chip
  const availableSpecialties = useMemo(() => {
    if (!selectedDeptId) return specialties;
    return specialties.filter((s) => !s.departmentId || s.departmentId === selectedDeptId);
  }, [specialties, selectedDeptId]);

  // Search Results Grouped (Specialties, Departments, Protocols)
  const searchResults = useMemo(() => {
    return searchAll(
      protocols,
      query,
      departments,
      specialties,
      selectedDeptId || undefined,
      selectedSpecId || undefined
    );
  }, [protocols, query, departments, specialties, selectedDeptId, selectedSpecId]);

  const handleClearAllFilters = () => {
    setQuery('');
    setSelectedDeptId('');
    setSelectedSpecId('');
    setDrilldown(null);
  };

  const hasActiveFilters = Boolean(query || selectedDeptId || selectedSpecId);
  const totalResultsCount =
    searchResults.specialties.length + searchResults.departments.length + searchResults.protocols.length;

  // Handle Drilldown: Specialty View
  if (drilldown && drilldown.type === 'specialty') {
    const specialty = specialties.find((s) => s.id === drilldown.id);
    const department = specialty ? departments.find((d) => d.id === specialty.departmentId) : undefined;
    const specialtyProtocols = protocols.filter((p) => (p.specialtyId || p.categoryId) === drilldown.id);
    const DeptIcon = getDepartmentIcon(department?.icon);

    return (
      <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-6 pt-2 space-y-6 animate-in fade-in duration-200">
        {/* Back Navigation Bar */}
        <button
          onClick={() => setDrilldown(null)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to search</span>
        </button>

        {/* Specialty Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl ${accent.badgeBg} ${accent.badgeText} flex items-center justify-center shrink-0`}>
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {specialty?.name || 'Specialty'}
                </h1>
                {department && (
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <DeptIcon className="w-3.5 h-3.5" />
                    <span>{department.name}</span>
                  </div>
                )}
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {specialtyProtocols.length} {specialtyProtocols.length === 1 ? 'protocol' : 'protocols'}
            </span>
          </div>
        </div>

        {/* Specialty Protocols List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Protocols</span>
            <span className="text-xs text-slate-400 font-normal">({specialtyProtocols.length})</span>
          </h2>

          {specialtyProtocols.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No protocols assigned to this specialty yet.
            </div>
          ) : (
            specialtyProtocols.map((protocol) => {
              const isFav = favorites.includes(protocol.id);
              return (
                <div
                  key={protocol.id}
                  onClick={() => onSelectProtocol(protocol)}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                      {protocol.title}
                    </h3>
                    {protocol.synonyms && protocol.synonyms.length > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        Synonyms: {protocol.synonyms.slice(0, 3).join(', ')}
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
                      className={`p-2 rounded-xl transition-colors ${
                        isFav
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      aria-label="Toggle favorite"
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
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
  }

  // Handle Drilldown: Department View
  if (drilldown && drilldown.type === 'department') {
    const department = departments.find((d) => d.id === drilldown.id);
    const deptSpecialties = specialties.filter((s) => s.departmentId === drilldown.id);
    const deptProtocols = protocols.filter((p) => p.departmentId === drilldown.id);
    const DeptIcon = getDepartmentIcon(department?.icon);

    return (
      <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-6 pt-2 space-y-6 animate-in fade-in duration-200">
        {/* Back Navigation Bar */}
        <button
          onClick={() => setDrilldown(null)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to search</span>
        </button>

        {/* Department Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${accent.badgeBg} ${accent.badgeText} flex items-center justify-center shrink-0`}>
                <DeptIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {department?.name || 'Department'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {deptSpecialties.length} {deptSpecialties.length === 1 ? 'specialty' : 'specialties'} • {deptProtocols.length}{' '}
                  {deptProtocols.length === 1 ? 'protocol' : 'protocols'}
                </p>
              </div>
            </div>
          </div>

          {/* Department Specialties Chips */}
          {deptSpecialties.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Specialties:</p>
              <div className="flex flex-wrap gap-2">
                {deptSpecialties.map((spec) => {
                  const specCount = protocols.filter((p) => (p.specialtyId || p.categoryId) === spec.id).length;
                  return (
                    <button
                      key={spec.id}
                      onClick={() => setDrilldown({ type: 'specialty', id: spec.id })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>{spec.name}</span>
                      <span className="text-[10px] text-slate-400 ml-0.5 font-bold">({specCount})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Department Protocols List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Department Protocols</span>
            <span className="text-xs text-slate-400 font-normal">({deptProtocols.length})</span>
          </h2>

          {deptProtocols.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No protocols assigned to this department yet.
            </div>
          ) : (
            deptProtocols.map((protocol) => {
              const specId = protocol.specialtyId || protocol.categoryId;
              const specialty = specialties.find((s) => s.id === specId);
              const isFav = favorites.includes(protocol.id);

              return (
                <div
                  key={protocol.id}
                  onClick={() => onSelectProtocol(protocol)}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {specialty && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <Layers className="w-3 h-3" />
                        <span>{specialty.name}</span>
                      </span>
                    )}

                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                      {protocol.title}
                    </h3>

                    {protocol.synonyms && protocol.synonyms.length > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        Synonyms: {protocol.synonyms.slice(0, 3).join(', ')}
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
                      className={`p-2 rounded-xl transition-colors ${
                        isFav
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      aria-label="Toggle favorite"
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
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
  }

  // Standard Search Page View
  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-6 pt-2 space-y-6 animate-in fade-in">
      {/* Search Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Search Protocols</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Search protocols, clinical specialties, departments, synonyms, and keywords.
        </p>
      </div>

      {/* Search Input Bar (WITHOUT autoFocus so keyboard does not auto-open) */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          id="protocol-search-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setDrilldown(null);
          }}
          placeholder="Search protocols, specialties, departments, synonyms, keywords..."
          className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs text-sm sm:text-base font-medium"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips Bar (Departments & Specialties) */}
      {departments.length > 0 && (
        <div className="space-y-2">
          {/* Department Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedDeptId('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                !selectedDeptId
                  ? `${accent.badgeBg} ${accent.badgeText} ${accent.border} border`
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              All Departments
            </button>
            {departments.map((dept) => {
              const isSelected = selectedDeptId === dept.id;
              const DeptIcon = getDepartmentIcon(dept.icon);
              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDeptId(isSelected ? '' : dept.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                    isSelected
                      ? `${accent.badgeBg} ${accent.badgeText} ${accent.border} border`
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <DeptIcon className="w-3.5 h-3.5" />
                  <span>{dept.name}</span>
                </button>
              );
            })}
          </div>

          {/* Specialty Filter Chips */}
          {availableSpecialties.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0">
                Specialty:
              </span>
              <button
                onClick={() => setSelectedSpecId('')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                  !selectedSpecId
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {availableSpecialties.map((spec) => {
                const isSelected = selectedSpecId === spec.id;
                return (
                  <button
                    key={spec.id}
                    onClick={() => setSelectedSpecId(isSelected ? '' : spec.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                      isSelected
                        ? `${accent.bg} text-white font-bold`
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {spec.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Results Header & Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
        <span>
          Showing <strong>{totalResultsCount}</strong> {totalResultsCount === 1 ? 'result' : 'results'}
          {hasActiveFilters && ' matching criteria'}
        </span>
        {hasActiveFilters && (
          <button
            onClick={handleClearAllFilters}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset search & filters</span>
          </button>
        )}
      </div>

      {/* Search Results Display */}
      {totalResultsCount === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {protocols.length === 0
                ? 'No protocols available yet.'
                : query.trim()
                ? 'No matching protocols, specialties, or departments found.'
                : 'No protocols matching filter.'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {protocols.length === 0
                ? 'Protocols can be created in the Manage section.'
                : query.trim()
                ? 'Try searching by title, specialty, department, synonym, or keyword.'
                : 'Select different filter options or clear filters.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: MATCHING SPECIALTIES (Only shown if specialties match) */}
          {searchResults.specialties.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500" />
                <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Specialties ({searchResults.specialties.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.specialties.map(({ specialty, department, protocolCount }) => (
                  <div
                    key={specialty.id}
                    onClick={() => setDrilldown({ type: 'specialty', id: specialty.id })}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${accent.badgeBg} ${accent.badgeText} flex items-center justify-center shrink-0`}>
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {specialty.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {department ? department.name : 'Specialty'} • {protocolCount}{' '}
                          {protocolCount === 1 ? 'protocol' : 'protocols'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: MATCHING DEPARTMENTS (Only shown if departments match) */}
          {searchResults.departments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-slate-500" />
                <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Departments ({searchResults.departments.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.departments.map(({ department, protocolCount }) => {
                  const DeptIcon = getDepartmentIcon(department.icon);
                  return (
                    <div
                      key={department.id}
                      onClick={() => setDrilldown({ type: 'department', id: department.id })}
                      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl ${accent.badgeBg} ${accent.badgeText} flex items-center justify-center shrink-0`}>
                          <DeptIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {department.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {protocolCount} {protocolCount === 1 ? 'protocol' : 'protocols'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: MATCHING PROTOCOLS (Only shown if protocols match) */}
          {searchResults.protocols.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-500" />
                <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Protocols ({searchResults.protocols.length})
                </h2>
              </div>
              <div className="space-y-3">
                {searchResults.protocols.map(({ protocol, matchReasons, snippet }) => {
                  const department = departments.find((d) => d.id === protocol.departmentId);
                  const specId = protocol.specialtyId || protocol.categoryId;
                  const specialty = specialties.find((s) => s.id === specId);
                  const DeptIcon = getDepartmentIcon(department?.icon);
                  const isFav = favorites.includes(protocol.id);

                  return (
                    <div
                      key={protocol.id}
                      onClick={() => onSelectProtocol(protocol)}
                      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex items-start justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Department & Specialty Tags */}
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
                          {matchReasons.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <Tag className="w-2.5 h-2.5" />
                              <span>{matchReasons.slice(0, 2).join(' • ')}</span>
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                          {protocol.title}
                        </h3>

                        {/* Snippet / Subtitle */}
                        {snippet ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal">
                            {snippet}
                          </p>
                        ) : protocol.synonyms && protocol.synonyms.length > 0 ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Synonyms: {protocol.synonyms.slice(0, 3).join(', ')}
                          </p>
                        ) : null}

                        {/* Section Count & Metadata */}
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

                      {/* Right controls */}
                      <div className="flex items-center gap-1 shrink-0 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(protocol.id);
                          }}
                          className={`p-2 rounded-xl transition-colors ${
                            isFav
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                          aria-label="Toggle favorite"
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
                        </button>

                        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
