import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Folder,
  Check,
  X,
  AlertCircle,
  Stethoscope,
} from 'lucide-react';
import { Department, Protocol, AppSettings } from '../types';
import { ACCENT_COLOR_CLASSES, DEPARTMENT_ICONS, getDepartmentIcon } from '../utils/theme';

interface DepartmentManagerProps {
  departments: Department[];
  protocols: Protocol[];
  settings: AppSettings;
  onSaveDepartments: (departments: Department[]) => void;
}

export const DepartmentManager: React.FC<DepartmentManagerProps> = ({
  departments,
  protocols,
  settings,
  onSaveDepartments,
}) => {
  const accent = ACCENT_COLOR_CLASSES[settings.accentColor] || ACCENT_COLOR_CLASSES.blue;

  const [isAdding, setIsAdding] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptIcon, setNewDeptIcon] = useState('Stethoscope');
  const [newDeptColor, setNewDeptColor] = useState('blue');

  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('Folder');
  const [editColor, setEditColor] = useState('blue');

  const [deleteWarningDept, setDeleteWarningDept] = useState<{
    dept: Department;
    linkedCount: number;
  } | null>(null);

  const availableIcons = Object.keys(DEPARTMENT_ICONS);
  const availableColors = ['blue', 'emerald', 'indigo', 'rose', 'teal', 'amber', 'purple', 'slate'];

  // Add new department
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    const newDept: Department = {
      id: `dept-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: newDeptName.trim(),
      icon: newDeptIcon,
      color: newDeptColor,
      order: departments.length + 1,
    };

    onSaveDepartments([...departments, newDept]);
    setNewDeptName('');
    setIsAdding(false);
  };

  // Start editing
  const handleStartEdit = (dept: Department) => {
    setEditingDeptId(dept.id);
    setEditName(dept.name);
    setEditIcon(dept.icon || 'Folder');
    setEditColor(dept.color || 'blue');
  };

  // Save edit
  const handleSaveEdit = (deptId: string) => {
    if (!editName.trim()) return;
    const updated = departments.map((d) =>
      d.id === deptId ? { ...d, name: editName.trim(), icon: editIcon, color: editColor } : d
    );
    onSaveDepartments(updated);
    setEditingDeptId(null);
  };

  // Move department
  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === departments.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const newDepts = [...departments];
    const temp = newDepts[index];
    newDepts[index] = newDepts[targetIdx];
    newDepts[targetIdx] = temp;

    const reordered = newDepts.map((d, i) => ({ ...d, order: i + 1 }));
    onSaveDepartments(reordered);
  };

  // Request delete department
  const handleDeleteRequest = (dept: Department) => {
    const linkedProtocols = protocols.filter((p) => p.departmentId === dept.id);
    if (linkedProtocols.length > 0) {
      setDeleteWarningDept({ dept, linkedCount: linkedProtocols.length });
    } else {
      executeDelete(dept.id);
    }
  };

  const executeDelete = (deptId: string) => {
    const updated = departments.filter((d) => d.id !== deptId).map((d, i) => ({ ...d, order: i + 1 }));
    onSaveDepartments(updated);
    setDeleteWarningDept(null);
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Custom Departments</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create, rename, reorder, or delete departments. Nothing is hardcoded.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ${accent.button} transition-colors`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Department</span>
          </button>
        )}
      </div>

      {/* Add New Department Card */}
      {isAdding && (
        <form
          onSubmit={handleAddDepartment}
          className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-blue-500/40 p-5 shadow-md animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">New Department</h4>
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
                Department Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="Department name..."
                required
                autoFocus
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Choose Icon
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                {availableIcons.map((iconKey) => {
                  const Icon = DEPARTMENT_ICONS[iconKey];
                  const isSelected = newDeptIcon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setNewDeptIcon(iconKey)}
                      className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{iconKey}</span>
                    </button>
                  );
                })}
              </div>
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
                Save Department
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Departments List */}
      <div className="space-y-2.5">
        {departments.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No departments created yet.</p>
            <button
              onClick={() => setIsAdding(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${accent.button}`}
            >
              + Add First Department
            </button>
          </div>
        ) : (
          departments.map((dept, index) => {
            const DeptIcon = getDepartmentIcon(dept.icon);
            const linkedCount = protocols.filter((p) => p.departmentId === dept.id).length;
            const isEditing = editingDeptId === dept.id;

            return (
              <div
                key={dept.id}
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
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                      {availableIcons.map((iconKey) => {
                        const Icon = DEPARTMENT_ICONS[iconKey];
                        const isSelected = editIcon === iconKey;
                        return (
                          <button
                            key={iconKey}
                            type="button"
                            onClick={() => setEditIcon(iconKey)}
                            className={`p-1.5 rounded-lg border flex items-center gap-1 text-xs ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(dept.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${accent.button} flex items-center gap-1`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => setEditingDeptId(null)}
                        className="px-3 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      <DeptIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{dept.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {linkedCount} {linkedCount === 1 ? 'protocol' : 'protocols'} assigned
                      </p>
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {/* Reorder Up */}
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move Up"
                      aria-label="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>

                    {/* Reorder Down */}
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === departments.length - 1}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move Down"
                      aria-label="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleStartEdit(dept)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Department"
                      aria-label="Edit Department"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteRequest(dept)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Department"
                      aria-label="Delete Department"
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

      {/* Delete Department Warning Modal */}
      {deleteWarningDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white text-center">
              Delete "{deleteWarningDept.dept.name}"?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 text-center mt-2 leading-relaxed">
              This department currently has <strong>{deleteWarningDept.linkedCount}</strong> protocol(s) assigned.
              Deleting it will unassign those protocols (they will not be deleted, but set to General/No Department).
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteWarningDept(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDelete(deleteWarningDept.dept.id)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-sm"
              >
                Yes, Delete Department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
