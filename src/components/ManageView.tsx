import React, { useState } from 'react';
import {
  FileText,
  Folder,
  Layers,
  Settings,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Star,
} from 'lucide-react';
import {
  Protocol,
  Department,
  Specialty,
  Category,
  AppSettings,
  ManageSubTab,
} from '../types';
import { ACCENT_COLOR_CLASSES, getDepartmentIcon } from '../utils/theme';
import { DepartmentManager } from './DepartmentManager';
import { SpecialtyManager } from './SpecialtyManager';
import { AppSettingsView } from './AppSettingsView';

interface ManageViewProps {
  protocols: Protocol[];
  departments: Department[];
  specialties?: Specialty[];
  categories?: Specialty[]; // For backward compatibility
  settings: AppSettings;
  favorites: string[];
  onNewProtocol: () => void;
  onEditProtocol: (protocol: Protocol) => void;
  onDuplicateProtocol: (protocol: Protocol) => void;
  onDeleteProtocol: (protocolId: string) => void;
  onSelectProtocol: (protocol: Protocol) => void;
  onSaveDepartments: (departments: Department[]) => void;
  onSaveSpecialties?: (specialties: Specialty[]) => void;
  onSaveCategories?: (categories: Specialty[]) => void; // For backward compatibility
  onSaveSettings: (settings: AppSettings) => void;
  onDataReloadRequired: () => void;
}

export const ManageView: React.FC<ManageViewProps> = ({
  protocols,
  departments,
  specialties: propSpecialties,
  categories: propCategories,
  settings,
  favorites,
  onNewProtocol,
  onEditProtocol,
  onDuplicateProtocol,
  onDeleteProtocol,
  onSelectProtocol,
  onSaveDepartments,
  onSaveSpecialties,
  onSaveCategories,
  onSaveSettings,
  onDataReloadRequired,
}) => {
  const specialties = propSpecialties || propCategories || [];
  const handleSaveSpecialties = (updated: Specialty[]) => {
    if (onSaveSpecialties) {
      onSaveSpecialties(updated);
    } else if (onSaveCategories) {
      onSaveCategories(updated);
    }
  };

  const [subTab, setSubTab] = useState<ManageSubTab>('protocols');
  const [filterQuery, setFilterQuery] = useState('');
  const [protocolToDelete, setProtocolToDelete] = useState<Protocol | null>(null);

  const accent = ACCENT_COLOR_CLASSES[settings.accentColor] || ACCENT_COLOR_CLASSES.blue;

  const tabs: { id: ManageSubTab; label: string; icon: React.FC<{ className?: string }>; count?: number }[] = [
    { id: 'protocols', label: 'Protocols', icon: FileText, count: protocols.length },
    { id: 'departments', label: 'Departments', icon: Folder, count: departments.length },
    { id: 'specialties', label: 'Specialties', icon: Layers, count: specialties.length },
    { id: 'settings', label: 'App Settings', icon: Settings },
  ];

  // Filtered protocols in manage list
  const filteredProtocols = protocols.filter((p) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.synonyms && p.synonyms.some((s) => s.toLowerCase().includes(q))) ||
      (p.keywords && p.keywords.some((k) => k.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-6 pt-4 space-y-6 animate-in fade-in">
      {/* Manage Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Manage & Customize
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full control over protocols, departments, specialties, and backup settings.
          </p>
        </div>

        {subTab === 'protocols' && (
          <button
            onClick={onNewProtocol}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ${accent.button} transition-colors`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ New Protocol</span>
          </button>
        )}
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? accent.text : ''}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      : 'bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SubTab 1: Protocols Management */}
      {subTab === 'protocols' && (
        <div className="space-y-4">
          {/* Quick Filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter protocols list..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {filteredProtocols.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {protocols.length === 0 ? 'No protocols created yet.' : 'No protocols matching your filter.'}
              </p>
              <button
                onClick={onNewProtocol}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold ${accent.button}`}
              >
                + Add Protocol
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredProtocols.map((protocol) => {
                const dept = departments.find((d) => d.id === protocol.departmentId);
                const specId = protocol.specialtyId || protocol.categoryId;
                const spec = specialties.find((s) => s.id === specId);
                const DeptIcon = getDepartmentIcon(dept?.icon);
                const isFav = favorites.includes(protocol.id);

                return (
                  <div
                    key={protocol.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div
                      onClick={() => onSelectProtocol(protocol)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {dept && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <DeptIcon className="w-2.5 h-2.5 text-slate-500" />
                            <span>{dept.name}</span>
                          </span>
                        )}
                        {spec && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {spec.name}
                          </span>
                        )}
                        {isFav && (
                          <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {protocol.title}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {protocol.sections?.length || 0} sections • Updated{' '}
                        {new Date(protocol.updatedAt || protocol.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {/* Duplicate */}
                      <button
                        onClick={() => onDuplicateProtocol(protocol)}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                        title="Duplicate protocol"
                        aria-label="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEditProtocol(protocol)}
                        className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                        title="Edit protocol"
                        aria-label="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setProtocolToDelete(protocol)}
                        className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete protocol"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SubTab 2: Departments */}
      {subTab === 'departments' && (
        <DepartmentManager
          departments={departments}
          protocols={protocols}
          settings={settings}
          onSaveDepartments={onSaveDepartments}
        />
      )}

      {/* SubTab 3: Specialties */}
      {subTab === 'specialties' && (
        <SpecialtyManager
          specialties={specialties}
          departments={departments}
          protocols={protocols}
          settings={settings}
          onSaveSpecialties={handleSaveSpecialties}
        />
      )}

      {/* SubTab 4: App Settings */}
      {subTab === 'settings' && (
        <AppSettingsView
          settings={settings}
          onSaveSettings={onSaveSettings}
          onDataReloadRequired={onDataReloadRequired}
        />
      )}

      {/* Protocol Delete Modal */}
      {protocolToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white text-center">
              Delete "{protocolToDelete.title}"?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
              This medical protocol will be permanently removed from your library.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setProtocolToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteProtocol(protocolToDelete.id);
                  setProtocolToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
