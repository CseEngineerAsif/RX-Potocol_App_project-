import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { Specialty, Category, Department, Protocol, AppSettings } from '../types';
import { ACCENT_COLOR_CLASSES } from '../utils/theme';

interface SpecialtyManagerProps {
  specialties?: Specialty[];
  categories?: Specialty[]; // For backward compatibility
  departments: Department[];
  protocols: Protocol[];
  settings: AppSettings;
  onSaveSpecialties?: (specialties: Specialty[]) => void;
  onSaveCategories?: (categories: Specialty[]) => void; // For backward compatibility
}

export const SpecialtyManager: React.FC<SpecialtyManagerProps> = ({
  specialties: propSpecialties,
  categories: propCategories,
  departments,
  protocols,
  settings,
  onSaveSpecialties,
  onSaveCategories,
}) => {
  const specialties = propSpecialties || propCategories || [];
  const handleSave = (updated: Specialty[]) => {
    if (onSaveSpecialties) {
      onSaveSpecialties(updated);
    } else if (onSaveCategories) {
      onSaveCategories(updated);
    }
  };

  const accent = ACCENT_COLOR_CLASSES[settings.accentColor] || ACCENT_COLOR_CLASSES.blue;

  const [isAdding, setIsAdding] = useState(false);
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecDeptId, setNewSpecDeptId] = useState('');

  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDeptId, setEditDeptId] = useState('');

  const [deleteWarningSpec, setDeleteWarningSpec] = useState<{
    spec: Specialty;
    linkedCount: number;
  } | null>(null);

  // Add new specialty
  const handleAddSpecialty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecName.trim()) return;

    const newSpec: Specialty = {
      id: `spec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: newSpecName.trim(),
      departmentId: newSpecDeptId || undefined,
      order: specialties.length + 1,
    };

    handleSave([...specialties, newSpec]);
    setNewSpecName('');
    setNewSpecDeptId('');
    setIsAdding(false);
  };

  // Start editing
  const handleStartEdit = (spec: Specialty) => {
    setEditingSpecId(spec.id);
    setEditName(spec.name);
    setEditDeptId(spec.departmentId || '');
  };

  // Save edit
  const handleSaveEdit = (specId: string) => {
    if (!editName.trim()) return;
    const updated = specialties.map((s) =>
      s.id === specId
        ? {
            ...s,
            name: editName.trim(),
            departmentId: editDeptId || undefined,
          }
        : s
    );
    handleSave(updated);
    setEditingSpecId(null);
  };

  // Move specialty
  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === specialties.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const newSpecs = [...specialties];
    const temp = newSpecs[index];
    newSpecs[index] = newSpecs[targetIdx];
    newSpecs[targetIdx] = temp;

    const reordered = newSpecs.map((s, i) => ({ ...s, order: i + 1 }));
    handleSave(reordered);
  };

  // Request delete specialty
  const handleDeleteRequest = (spec: Specialty) => {
    const linkedProtocols = protocols.filter((p) => (p.specialtyId || p.categoryId) === spec.id);
    if (linkedProtocols.length > 0) {
      setDeleteWarningSpec({ spec, linkedCount: linkedProtocols.length });
    } else {
      executeDelete(spec.id);
    }
  };

  const executeDelete = (specId: string) => {
    const updated = specialties.filter((s) => s.id !== specId).map((s, i) => ({ ...s, order: i + 1 }));
    handleSave(updated);
    setDeleteWarningSpec(null);
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Custom Specialties</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create, rename, reorder, or delete specialties. Assign them to specific departments or use generally.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ${accent.button} transition-colors`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Specialty</span>
          </button>
        )}
      </div>

      {/* Add New Specialty Card */}
      {isAdding && (
        <form
          onSubmit={handleAddSpecialty}
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              New Specialty
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Specialty Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newSpecName}
                onChange={(e) => setNewSpecName(e.target.value)}
                placeholder="Specialty name..."
                required
                autoFocus
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Department (Optional)
              </label>
              <select
                value={newSpecDeptId}
                onChange={(e) => setNewSpecDeptId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Across All Departments / General --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-xl text-xs font-bold ${accent.button}`}
              >
                Save Specialty
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Specialties List */}
      <div className="space-y-2.5">
        {specialties.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No specialties created yet.</p>
            <button
              onClick={() => setIsAdding(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${accent.button}`}
            >
              + Add First Specialty
            </button>
          </div>
        ) : (
          specialties.map((spec, index) => {
            const dept = departments.find((d) => d.id === spec.departmentId);
            const linkedCount = protocols.filter((p) => (p.specialtyId || p.categoryId) === spec.id).length;
            const isEditing = editingSpecId === spec.id;

            return (
              <div
                key={spec.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {isEditing ? (
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                      autoFocus
                    />
                    <select
                      value={editDeptId}
                      onChange={(e) => setEditDeptId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                    >
                      <option value="">-- General (All Departments) --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(spec.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${accent.button} flex items-center gap-1`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => setEditingSpecId(null)}
                        className="px-3 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{spec.name}</h4>
                        {dept && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {dept.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {linkedCount} {linkedCount === 1 ? 'protocol' : 'protocols'}
                      </p>
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move Up"
                      aria-label="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === specialties.length - 1}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move Down"
                      aria-label="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStartEdit(spec)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Specialty"
                      aria-label="Edit Specialty"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(spec)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Specialty"
                      aria-label="Delete Specialty"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Specialty Warning Modal */}
      {deleteWarningSpec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white text-center">
              Delete "{deleteWarningSpec.spec.name}"?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 text-center mt-2 leading-relaxed">
              This specialty is currently linked to <strong>{deleteWarningSpec.linkedCount}</strong> protocol(s).
              Deleting it will unassign the specialty from those protocols.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteWarningSpec(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDelete(deleteWarningSpec.spec.id)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-sm"
              >
                Yes, Delete Specialty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export CategoryManager alias for backward compatibility
export const CategoryManager = SpecialtyManager;
