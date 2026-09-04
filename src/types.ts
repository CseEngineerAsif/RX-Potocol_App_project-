export type SectionType = 'text' | 'bullets' | 'numbered' | 'table' | 'warning';

export interface TableContent {
  headers: string[];
  rows: string[][];
}

export interface ProtocolSection {
  id: string;
  title: string;
  type: SectionType;
  content: string | string[] | TableContent;
  order: number;
}

export interface Protocol {
  id: string;
  title: string;
  departmentId?: string;
  specialtyId?: string;
  categoryId?: string; // Kept for complete backward compatibility
  synonyms: string[];
  keywords: string[];
  sections: ProtocolSection[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
}

export interface Department {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  order: number;
}

export interface Specialty {
  id: string;
  name: string;
  departmentId?: string;
  order: number;
}

// Backward-compatible alias
export type Category = Specialty;

export type AccentColor = 'blue' | 'emerald' | 'indigo' | 'rose' | 'teal' | 'amber' | 'slate';
export type AppTheme = 'light' | 'dark' | 'system';
export type ReadingFontSize = 'normal' | 'large';

export interface AppSettings {
  appName: string;
  appSubtitle: string;
  theme: AppTheme;
  accentColor: AccentColor;
  fontSize: ReadingFontSize;
  showDisclaimerNotice: boolean;
}

export interface AppDataExport {
  version: number;
  exportDate: string;
  settings: AppSettings;
  departments: Department[];
  specialties: Specialty[];
  categories?: Specialty[]; // For legacy import backward compatibility
  protocols: Protocol[];
  favorites: string[];
  recentlyViewed: string[];
}

export interface SearchMatchResult {
  protocol: Protocol;
  score: number;
  matchReasons: string[];
  snippet?: string;
}

export interface SpecialtySearchResult {
  specialty: Specialty;
  category?: Specialty; // Alias for backward compatibility
  department?: Department;
  protocolCount: number;
}

export type CategorySearchResult = SpecialtySearchResult;

export interface DepartmentSearchResult {
  department: Department;
  protocolCount: number;
}

export interface SearchResultsGroup {
  specialties: SpecialtySearchResult[];
  categories?: SpecialtySearchResult[]; // Alias
  departments: DepartmentSearchResult[];
  protocols: SearchMatchResult[];
}

export type ActiveTab = 'home' | 'search' | 'favorites' | 'manage';
export type ManageSubTab = 'protocols' | 'departments' | 'specialties' | 'settings';
