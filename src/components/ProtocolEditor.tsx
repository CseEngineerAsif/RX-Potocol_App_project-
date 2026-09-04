import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  FileText,
  List,
  ListOrdered,
  Table as TableIcon,
  AlertTriangle,
  X,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import {
  Protocol,
  ProtocolSection,
  Department,
  Specialty,
  Category,
  SectionType,
  AppSettings,
  TableContent,
} from '../types';
import { ACCENT_COLOR_CLASSES } from '../utils/theme';
import { RichTextEditor } from './RichTextEditor';

interface ProtocolEditorProps {
  initialProtocol?: Protocol | null;
  departments: Department[];
  specialties?: Specialty[];
  categories?: Specialty[]; // For backward compatibility
  settings: AppSettings;
  onSave: (protocol: Protocol) => void;
  onCancel: () => void;
}

export const ProtocolEditor: React.FC<ProtocolEditorProps> = ({
  initialProtocol,
  departments,
  specialties: propSpecialties,
  categories: propCategories,
  settings,
  onSave,
  onCancel,
}) => {
  const specialties = propSpecialties || propCategories || [];
  const accent = ACCENT_COLOR_CLASSES[settings.accentColor] || ACCENT_COLOR_CLASSES.blue;

  // Metadata State
  const [title, setTitle] = useState(initialProtocol?.title || '');
  const [departmentId, setDepartmentId] = useState(initialProtocol?.departmentId || '');
  const [specialtyId, setSpecialtyId] = useState(
    initialProtocol?.specialtyId || initialProtocol?.categoryId || ''
  );

  // Synonyms & Keywords
  const [synonyms, setSynonyms] = useState<string[]>(initialProtocol?.synonyms || []);
  const [synonymInput, setSynonymInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>(initialProtocol?.keywords || []);
  const [keywordInput, setKeywordInput] = useState('');

  // Sections State
  const [sections, setSections] = useState<ProtocolSection[]>(() => {
    if (initialProtocol?.sections && initialProtocol.sections.length > 0) {
      return [...initialProtocol.sections].sort((a, b) => a.order - b.order);
    }
    // Default empty section for new protocol
    return [
      {
        id: `sec-${Date.now()}-1`,
        title: '',
        type: 'text',
        content: '',
        order: 1,
      },
    ];
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Filter specialties matching selected department
  const filteredSpecialties = specialties.filter((s) => {
    if (!departmentId) return true;
    return !s.departmentId || s.departmentId === departmentId;
  });

  // Tag Handlers: Synonyms
  const handleAddSynonym = () => {
    const trimmed = synonymInput.trim();
    if (trimmed && !synonyms.includes(trimmed)) {
      setSynonyms([...synonyms, trimmed]);
      setSynonymInput('');
    }
  };

  const handleRemoveSynonym = (index: number) => {
    setSynonyms(synonyms.filter((_, i) => i !== index));
  };

  // Tag Handlers: Keywords
  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  // Section Management
  const handleAddSection = (type: SectionType) => {
    let initialContent: any = '';
    if (type === 'bullets' || type === 'numbered') {
      initialContent = [''];
    } else if (type === 'table') {
      initialContent = {
        headers: ['Parameter / Item', 'Dose / Threshold', 'Action / Notes'],
        rows: [['', '', '']],
      };
    }

    const newSection: ProtocolSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: '',
      type,
      content: initialContent,
      order: sections.length + 1,
    };

    setSections([...sections, newSection]);
  };

  const handleRemoveSection = (index: number) => {
    if (sections.length <= 1) {
      setValidationError('A protocol must have at least one clinical section.');
      return;
    }
    setValidationError(null);
    const updated = sections.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }));
    setSections(updated);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const newSecs = [...sections];
    const temp = newSecs[index];
    newSecs[index] = newSecs[targetIdx];
    newSecs[targetIdx] = temp;

    const reordered = newSecs.map((s, i) => ({ ...s, order: i + 1 }));
    setSections(reordered);
  };

  const handleUpdateSectionTitle = (id: string, title: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, title } : s)));
  };

  const handleUpdateSectionType = (id: string, type: SectionType) => {
    setSections(
      sections.map((s) => {
        if (s.id !== id) return s;
        let content: any = '';
        if (type === 'bullets' || type === 'numbered') {
          content = typeof s.content === 'string' && s.content ? [s.content] : [''];
        } else if (type === 'table') {
          content = {
            headers: ['Column 1', 'Column 2'],
            rows: [['', '']],
          };
        } else {
          content = Array.isArray(s.content) ? s.content.join('\n') : '';
        }
        return { ...s, type, content };
      })
    );
  };

  const handleUpdateSectionContent = (id: string, content: any) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, content } : s)));
  };

  // Helper for array content (bullets/numbered)
  const handleAddListItem = (secId: string) => {
    const sec = sections.find((s) => s.id === secId);
    if (!sec) return;
    const currentList = Array.isArray(sec.content) ? sec.content : [];
    handleUpdateSectionContent(secId, [...currentList, '']);
  };

  const handleUpdateListItem = (secId: string, index: number, value: string) => {
    const sec = sections.find((s) => s.id === secId);
    if (!sec) return;
    const currentList = Array.isArray(sec.content) ? [...sec.content] : [];
    currentList[index] = value;
    handleUpdateSectionContent(secId, currentList);
  };

  const handleRemoveListItem = (secId: string, index: number) => {
    const sec = sections.find((s) => s.id === secId);
    if (!sec) return;
    const currentList = Array.isArray(sec.content) ? [...sec.content] : [];
    if (currentList.length <= 1) return;
    const filtered = currentList.filter((_, i) => i !== index);
    handleUpdateSectionContent(secId, filtered);
  };

  // Helper for table content
  const handleTableHeaderChange = (secId: string, colIndex: number, value: string) => {
    const sec = sections.find((s) => s.id === secId);
    if (!sec) return;
    const table = (sec.content || { headers: [], rows: [] }) as TableContent;
    const newHeaders = [...(table.headers || [])];
    newHeaders[colIndex] = value;
    handleUpdateSectionContent(secId, { ...table, headers: newHeaders });
  };

  const handleTableCellChange = (secId: string, rowIndex: number, colIndex: number, value: string) => {
    const sec = sections.find((s) => s.id === secId);
    if (!sec) return;
    const table = (sec.content || { headers: [], rows: [] }) as TableContent;
    const newRows = [...(table.rows || [])];
    const newRow = [...(newRows[rowIndex] || [])];
    newRow[colIndex] = value;
    newRows[rowIndex] = newRow;
    handleUpdateSectionContent(secId, { ...table, rows: newRows });
  };

  const handleTableAddColumn = (secId: string) => {
    const sec = sections.find((s) => s.id === secId);
    if (!sec) return;
    const table = (sec.content || { headers: [], rows: [] }) as TableContent;
    const newHeaders = [...(table.headers || []), `Column ${table.headers?.length + 1}`];
    const newRows = (table.rows || []).map((row) => [...row, '']);
    handleUpdateSectionContent(secId, { headers: newHeaders, rows: newRows });
  };

  const handleTableRemoveColumn = (secId: string, colIndex: number) => {
    const sec = sections.find((s) => s.id === secId);
    if (!sec) return;
    const table = (sec.content || { headers: [], rows: [] }) as TableContent;
    if (table.headers.length <= 1) return;
    const newHeaders = table.headers.filter((_, i) => i !== colIndex);
    const newRows = (table.rows || []).map((row) => row.filter((_, i) => i !== colIndex));
    handleUpdateSectionContent(secId, { headers: newHeaders, rows: newRows });
  };

  const handleTableAddRow = (secId: string) => {
    const sec = sections.find((s) => s.id === secId);
    if (!sec) return;
    const table = (sec.content || { headers: [], rows: [] }) as TableContent;
    const emptyRow = new Array(table.headers?.length || 2).fill('');
    const newRows = [...(table.rows || []), emptyRow];
    handleUpdateSectionContent(secId, { ...table, rows: newRows });
  };

  const handleTableRemoveRow = (secId: string, rowIndex: number) => {
    const sec = sections.find((s) => s.id === secId);
    if (!sec) return;
    const table = (sec.content || { headers: [], rows: [] }) as TableContent;
    if (table.rows.length <= 1) return;
    const newRows = table.rows.filter((_, i) => i !== rowIndex);
    handleUpdateSectionContent(secId, { ...table, rows: newRows });
  };

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Please enter a protocol name / title.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationError(null);

    const updatedProtocol: Protocol = {
      id: initialProtocol?.id || `prot-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: title.trim(),
      departmentId: departmentId || undefined,
      specialtyId: specialtyId || undefined,
      categoryId: specialtyId || undefined, // keep in sync for complete backward compatibility
      synonyms: synonyms.map((s) => s.trim()).filter(Boolean),
      keywords: keywords.map((k) => k.trim()).filter(Boolean),
      sections: sections.map((s, idx) => ({
        ...s,
        title: s.title.trim() || `Section ${idx + 1}`,
        order: idx + 1,
      })),
      createdAt: initialProtocol?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: initialProtocol?.pinned || false,
    };

    onSave(updatedProtocol);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto pb-32 px-4 sm:px-6 pt-4 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 py-3 border-b border-slate-200 dark:border-slate-800 mb-6 sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </button>

        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
          {initialProtocol ? 'Edit Protocol' : 'New Protocol'}
        </h2>

        <button
          type="submit"
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-transform hover:scale-[1.02] ${accent.button}`}
        >
          <Save className="w-4 h-4" />
          <span>Save Protocol</span>
        </button>
      </div>

      {validationError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Basic Metadata Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs mb-8 space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">1. Protocol Metadata</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Define the protocol title and assign to your custom departments & specialties.
          </p>
        </div>

        {/* Protocol Title */}
        <div>
          <label htmlFor="protocol-title" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Protocol Name / Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="protocol-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Protocol title..."
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-base sm:text-lg"
          />
        </div>

        {/* Department & Specialty Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="protocol-department" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Department
            </label>
            <select
              id="protocol-department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            >
              <option value="">-- No Department (General) --</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="protocol-specialty" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Specialty
            </label>
            <select
              id="protocol-specialty"
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            >
              <option value="">-- Select Specialty --</option>
              {filteredSpecialties.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Synonyms Tag Input */}
        <div>
          <label htmlFor="synonym-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Synonyms & Alternate Names
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Add abbreviations or alternate names so search finds this protocol instantly.
          </p>
          <div className="flex gap-2 mb-2">
            <input
              id="synonym-input"
              type="text"
              value={synonymInput}
              onChange={(e) => setSynonymInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSynonym();
                }
              }}
              placeholder="Type synonym and press Add or Enter..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddSynonym}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {synonyms.map((syn, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              >
                <span>{syn}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSynonym(idx)}
                  className="hover:text-rose-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Keywords Tag Input */}
        <div>
          <label htmlFor="keyword-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Search Keywords & Triggers
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Add clinical symptoms, drug classes, or lab triggers (e.g., 'K+ &gt; 6.0', 'dyspnea').
          </p>
          <div className="flex gap-2 mb-2">
            <input
              id="keyword-input"
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddKeyword();
                }
              }}
              placeholder="Type keyword and press Add or Enter..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddKeyword}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              >
                <span>{kw}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(idx)}
                  className="hover:text-rose-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Protocol Sections Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">2. Clinical Protocol Sections</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Structure treatment guidelines with text, bullet points, numbered algorithms, warnings, and tables.
          </p>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-6 mb-8">
        {sections.map((section, secIdx) => {
          return (
            <div
              key={section.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs relative group transition-all"
            >
              {/* Section Header Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
                    {secIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                    placeholder="Section Title (e.g., Immediate Management, Dosing)..."
                    className="font-bold text-sm sm:text-base text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 focus:border-blue-500 focus:outline-none px-1 py-0.5"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {/* Type Selector */}
                  <select
                    value={section.type}
                    onChange={(e) => handleUpdateSectionType(section.id, e.target.value as SectionType)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none"
                  >
                    <option value="text">Paragraph / Text</option>
                    <option value="bullets">Bullet Points</option>
                    <option value="numbered">Numbered Algorithm</option>
                    <option value="warning">Clinical Warning</option>
                    <option value="table">Data / Dosing Table</option>
                  </select>

                  {/* Reorder Buttons */}
                  <button
                    type="button"
                    onClick={() => handleMoveSection(secIdx, 'up')}
                    disabled={secIdx === 0}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition-colors"
                    title="Move Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveSection(secIdx, 'down')}
                    disabled={secIdx === sections.length - 1}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition-colors"
                    title="Move Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Delete Section */}
                  <button
                    type="button"
                    onClick={() => handleRemoveSection(secIdx)}
                    className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
                    title="Delete Section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Section Content Type Renderers */}
              {/* Type: Text or Warning */}
              {(section.type === 'text' || section.type === 'warning') && (
                <div>
                  <RichTextEditor
                    id={`editor-content-${section.id}`}
                    value={typeof section.content === 'string' ? section.content : ''}
                    onChange={(newHtml) => handleUpdateSectionContent(section.id, newHtml)}
                    variant={section.type === 'warning' ? 'warning' : 'text'}
                    placeholder={
                      section.type === 'warning'
                        ? 'Enter critical safety alert, contraindication, or drug interaction...'
                        : 'Enter detailed clinical guidelines, criteria, or assessment criteria...'
                    }
                    minHeight="130px"
                  />
                </div>
              )}

              {/* Type: Bullets or Numbered */}
              {(section.type === 'bullets' || section.type === 'numbered') && (
                <div className="space-y-2">
                  {(Array.isArray(section.content) ? section.content : ['']).map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center gap-2">
                      <span className="w-5 text-center text-xs font-bold text-slate-400">
                        {section.type === 'bullets' ? '•' : `${itemIdx + 1}.`}
                      </span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleUpdateListItem(section.id, itemIdx, e.target.value)}
                        placeholder={`List item ${itemIdx + 1}...`}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {(section.content as string[]).length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveListItem(section.id, itemIdx)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddListItem(section.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-1 pl-7"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              )}

              {/* Type: Table */}
              {section.type === 'table' && (
                <div className="space-y-3 overflow-x-auto">
                  {(() => {
                    const table = (section.content || { headers: [], rows: [] }) as TableContent;
                    const headers = table.headers || ['Col 1', 'Col 2'];
                    const rows = table.rows || [['', '']];

                    return (
                      <div>
                        <div className="min-w-full inline-block align-middle">
                          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                            <thead className="bg-slate-100 dark:bg-slate-800">
                              <tr>
                                {headers.map((hdr, hIdx) => (
                                  <th key={hIdx} className="p-2 text-left font-bold text-slate-700 dark:text-slate-300">
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        value={hdr}
                                        onChange={(e) => handleTableHeaderChange(section.id, hIdx, e.target.value)}
                                        placeholder={`Header ${hIdx + 1}`}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 font-bold text-xs"
                                      />
                                      {headers.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleTableRemoveColumn(section.id, hIdx)}
                                          className="text-slate-400 hover:text-rose-500"
                                          title="Remove column"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </th>
                                ))}
                                <th className="p-1 w-10"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                              {rows.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {headers.map((_, cIdx) => (
                                    <td key={cIdx} className="p-1.5">
                                      <input
                                        type="text"
                                        value={row[cIdx] || ''}
                                        onChange={(e) =>
                                          handleTableCellChange(section.id, rIdx, cIdx, e.target.value)
                                        }
                                        placeholder="..."
                                        className="w-full bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs"
                                      />
                                    </td>
                                  ))}
                                  <td className="p-1 text-center">
                                    {rows.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleTableRemoveRow(section.id, rIdx)}
                                        className="p-1 text-slate-400 hover:text-rose-500"
                                        title="Remove row"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleTableAddRow(section.id)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                          >
                            + Add Row
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTableAddColumn(section.id)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                          >
                            + Add Column
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Section Buttons Bar */}
      <div className="p-5 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Add Another Clinical Section
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => handleAddSection('text')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-blue-500 shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>+ Text Block</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddSection('bullets')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-blue-500 shadow-xs"
          >
            <List className="w-3.5 h-3.5 text-emerald-500" />
            <span>+ Bullet List</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddSection('numbered')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-blue-500 shadow-xs"
          >
            <ListOrdered className="w-3.5 h-3.5 text-indigo-500" />
            <span>+ Step Algorithm</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddSection('warning')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-blue-500 shadow-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Warning Box</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddSection('table')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-blue-500 shadow-xs"
          >
            <TableIcon className="w-3.5 h-3.5 text-teal-500" />
            <span>+ Dosing Table</span>
          </button>
        </div>
      </div>
    </form>
  );
};
