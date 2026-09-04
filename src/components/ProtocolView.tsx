import React, { useState } from 'react';
import {
  ArrowLeft,
  Star,
  Edit3,
  Copy,
  Trash2,
  Check,
  Layers,
  Clock,
} from 'lucide-react';
import { Protocol, Department, Specialty, Category, AppSettings, TableContent } from '../types';
import { ACCENT_COLOR_CLASSES, getDepartmentIcon } from '../utils/theme';
import { FormattedContent } from './FormattedContent';
import { htmlToPlainText } from '../utils/sanitize';

interface ProtocolViewProps {
  protocol: Protocol;
  departments: Department[];
  specialties?: Specialty[];
  categories?: Specialty[]; // For backward compatibility
  settings: AppSettings;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (protocol: Protocol) => void;
  onDuplicate: (protocol: Protocol) => void;
  onDelete: (protocolId: string) => void;
}

export const ProtocolView: React.FC<ProtocolViewProps> = ({
  protocol,
  departments,
  specialties: propSpecialties,
  categories: propCategories,
  settings,
  isFavorite,
  onBack,
  onToggleFavorite,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const specialties = propSpecialties || propCategories || [];
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  const accent = ACCENT_COLOR_CLASSES[settings.accentColor] || ACCENT_COLOR_CLASSES.blue;

  const department = departments.find((d) => d.id === protocol.departmentId);
  const pSpecId = protocol.specialtyId || protocol.categoryId;
  const specialty = specialties.find((s) => s.id === pSpecId);
  const DeptIcon = getDepartmentIcon(department?.icon);

  // Sorted sections by order
  const sortedSections = [...(protocol.sections || [])].sort((a, b) => a.order - b.order);

  // Scroll to section helper
  const scrollToSection = (secId: string) => {
    setActiveSectionId(secId);
    const element = document.getElementById(`section-${secId}`);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleCopyProtocolText = () => {
    const lines: string[] = [];
    lines.push(`## ${protocol.title}`);
    if (department) lines.push(`Department: ${department.name}`);
    if (specialty) lines.push(`Specialty: ${specialty.name}`);
    if (protocol.synonyms && protocol.synonyms.length > 0) {
      lines.push(`Synonyms: ${protocol.synonyms.join(', ')}`);
    }
    lines.push('');

    sortedSections.forEach((sec) => {
      lines.push(`### ${sec.title}`);
      if (sec.type === 'text' || sec.type === 'warning') {
        lines.push(htmlToPlainText(String(sec.content || '')));
      } else if (sec.type === 'bullets' && Array.isArray(sec.content)) {
        sec.content.forEach((item) => lines.push(`• ${item}`));
      } else if (sec.type === 'numbered' && Array.isArray(sec.content)) {
        sec.content.forEach((item, i) => lines.push(`${i + 1}. ${item}`));
      } else if (sec.type === 'table' && typeof sec.content === 'object') {
        const table = sec.content as TableContent;
        if (table.headers) lines.push(table.headers.join(' | '));
        if (table.rows) {
          table.rows.forEach((row) => lines.push(row.join(' | ')));
        }
      }
      lines.push('');
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedDate = new Date(protocol.updatedAt || protocol.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-6 pt-4 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-2 py-3 border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors focus:outline-none"
          aria-label="Back to previous page"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Favorite Toggle */}
          <button
            onClick={() => onToggleFavorite(protocol.id)}
            className={`p-2 rounded-lg transition-colors border ${
              isFavorite
                ? 'bg-amber-50 border-amber-300 text-amber-500 dark:bg-amber-950/40 dark:border-amber-700/60'
                : 'bg-white border-slate-200 text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
            }`}
            title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            aria-label="Favorite protocol"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>

          {/* Copy Plaintext */}
          <button
            onClick={handleCopyProtocolText}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
            title="Copy Protocol to Clipboard"
            aria-label="Copy Protocol text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Duplicate Protocol */}
          <button
            onClick={() => onDuplicate(protocol)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            title="Create a copy of this protocol"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>

          {/* Edit Protocol */}
          <button
            onClick={() => onEdit(protocol)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${accent.button}`}
            title="Edit Protocol"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </button>

          {/* Delete Protocol */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 rounded-lg bg-white border border-slate-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete Protocol"
            aria-label="Delete Protocol"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Protocol Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs mb-6">
        {/* Department & Specialty Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {department && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <DeptIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>{department.name}</span>
            </div>
          )}
          {specialty && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>{specialty.name}</span>
            </div>
          )}
          <div className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 ml-auto">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {formattedDate}</span>
          </div>
        </div>

        {/* Title */}
        <h1
          className={`font-extrabold text-slate-900 dark:text-white tracking-tight ${
            settings.fontSize === 'large' ? 'text-2xl sm:text-4xl leading-tight' : 'text-2xl sm:text-3xl leading-snug'
          }`}
        >
          {protocol.title}
        </h1>

        {/* Synonyms & Keywords */}
        {(protocol.synonyms?.length > 0 || protocol.keywords?.length > 0) && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-x-6 gap-y-2 text-xs">
            {protocol.synonyms?.length > 0 && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Synonyms:</span>
                <span className="italic">{protocol.synonyms.join(' • ')}</span>
              </div>
            )}
            {protocol.keywords?.length > 0 && (
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Keywords:</span>
                <span>{protocol.keywords.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Jump Section Pills (Table of Contents) */}
      {sortedSections.length > 2 && (
        <div className="mb-6 sticky top-16 z-20 bg-slate-50/95 dark:bg-slate-950/95 py-2 -mx-4 px-4 sm:-mx-6 sm:px-6 backdrop-blur-xs border-b border-slate-200/60 dark:border-slate-800/60 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Sections:</span>
            {sortedSections.map((sec, idx) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors border ${
                  activeSectionId === sec.id
                    ? `${accent.badgeBg} ${accent.badgeText} ${accent.border}`
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="font-bold mr-1">{idx + 1}.</span> {sec.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty Sections Fallback */}
      {sortedSections.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">This protocol does not have any sections yet.</p>
          <button
            onClick={() => onEdit(protocol)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${accent.button}`}
          >
            + Add Sections
          </button>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-6">
        {sortedSections.map((section, idx) => {
          return (
            <div
              key={section.id}
              id={`section-${section.id}`}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs scroll-mt-28"
            >
              {/* Section Title */}
              <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {section.title}
                </h2>
              </div>

              {/* Section Content Rendering */}
              {/* Type: Text */}
              {section.type === 'text' && (
                <FormattedContent
                  content={String(section.content || '')}
                  variant="text"
                  className="text-sm sm:text-base leading-relaxed"
                />
              )}

              {/* Type: Warning */}
              {section.type === 'warning' && (
                <div className="p-4 sm:p-5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80">
                  <FormattedContent
                    content={String(section.content || '')}
                    variant="warning"
                    className="text-sm sm:text-base leading-relaxed font-medium"
                  />
                </div>
              )}

              {/* Type: Bullets */}
              {section.type === 'bullets' && Array.isArray(section.content) && (
                <ul className="space-y-2 text-slate-700 dark:text-slate-200 text-sm sm:text-base">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-blue-500 dark:text-blue-400 text-lg leading-none select-none">•</span>
                      <span className="flex-1 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Type: Numbered List */}
              {section.type === 'numbered' && Array.isArray(section.content) && (
                <ol className="space-y-2.5 text-slate-700 dark:text-slate-200 text-sm sm:text-base">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 select-none">
                        {i + 1}
                      </span>
                      <span className="flex-1 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ol>
              )}

              {/* Type: Table */}
              {section.type === 'table' && typeof section.content === 'object' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  {(() => {
                    const table = section.content as TableContent;
                    const headers = table.headers || [];
                    const rows = table.rows || [];

                    return (
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
                        {headers.length > 0 && (
                          <thead className="bg-slate-50 dark:bg-slate-800/80">
                            <tr>
                              {headers.map((h, i) => (
                                <th
                                  key={i}
                                  className="px-4 py-3 text-left font-bold text-slate-800 dark:text-slate-200"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                        )}
                        <tbody className="divide-y divide-slate-150 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-medium align-top"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white text-center">
              Delete Protocol?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
              Are you sure you want to delete <strong>"{protocol.title}"</strong>? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(protocol.id);
                  setShowDeleteModal(false);
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
