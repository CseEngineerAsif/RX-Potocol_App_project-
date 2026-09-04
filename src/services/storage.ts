import {
  AppSettings,
  Department,
  Specialty,
  Category,
  Protocol,
  AppDataExport,
} from '../types';
import {
  DEFAULT_SETTINGS,
  DEFAULT_DEPARTMENTS,
  DEFAULT_SPECIALTIES,
  DEFAULT_PROTOCOLS,
} from '../data/defaultData';

const STORAGE_KEYS = {
  SETTINGS: 'rx_protocol_settings',
  DEPARTMENTS: 'rx_protocol_departments',
  SPECIALTIES: 'rx_protocol_specialties',
  CATEGORIES_LEGACY: 'rx_protocol_categories',
  PROTOCOLS: 'rx_protocol_protocols',
  FAVORITES: 'rx_protocol_favorites',
  RECENTLY_VIEWED: 'rx_protocol_recent',
  INIT_FLAG: 'rx_protocol_clean_initialized_v2',
};

// Safe JSON parser
function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

export function initializeStorage(): void {
  const isCleanInit = localStorage.getItem(STORAGE_KEYS.INIT_FLAG);
  if (!isCleanInit) {
    // Check if legacy storage had demo data or if fresh start
    const legacyProtocols = safeGetItem<Protocol[]>('rx_protocol_protocols', []);
    const isLegacyDemoData = legacyProtocols.some((p) =>
      ['prot-hyperkalaemia', 'prot-asthma', 'prot-head-injury'].includes(p.id)
    );

    if (isLegacyDemoData || !localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      safeSetItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      safeSetItem(STORAGE_KEYS.DEPARTMENTS, []);
      safeSetItem(STORAGE_KEYS.SPECIALTIES, []);
      safeSetItem(STORAGE_KEYS.PROTOCOLS, []);
      safeSetItem(STORAGE_KEYS.FAVORITES, []);
      safeSetItem(STORAGE_KEYS.RECENTLY_VIEWED, []);
    }

    localStorage.setItem(STORAGE_KEYS.INIT_FLAG, 'true');
  }

  // Safe migration of existing specialties/categories and protocol categoryId -> specialtyId
  migrateSpecialtiesStorage();
}

function migrateSpecialtiesStorage(): void {
  try {
    // If specialties is not yet populated but legacy categories exists, migrate
    const currentSpecialties = localStorage.getItem(STORAGE_KEYS.SPECIALTIES);
    if (!currentSpecialties) {
      const legacyCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES_LEGACY);
      if (legacyCategories) {
        localStorage.setItem(STORAGE_KEYS.SPECIALTIES, legacyCategories);
      }
    }

    // Migrate protocols categoryId -> specialtyId
    const protocols = safeGetItem<any[]>(STORAGE_KEYS.PROTOCOLS, []);
    let protocolsChanged = false;
    const migratedProtocols = protocols.map((p) => {
      if (p.categoryId && !p.specialtyId) {
        protocolsChanged = true;
        return {
          ...p,
          specialtyId: p.categoryId,
          categoryId: p.categoryId,
        };
      }
      if (p.specialtyId && !p.categoryId) {
        return {
          ...p,
          categoryId: p.specialtyId,
        };
      }
      return p;
    });

    if (protocolsChanged) {
      safeSetItem(STORAGE_KEYS.PROTOCOLS, migratedProtocols);
    }
  } catch (err) {
    console.warn('Specialties migration warning:', err);
  }
}

// Settings
export function loadSettings(): AppSettings {
  return safeGetItem<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): void {
  safeSetItem(STORAGE_KEYS.SETTINGS, settings);
}

// Departments
export function loadDepartments(): Department[] {
  return safeGetItem<Department[]>(STORAGE_KEYS.DEPARTMENTS, DEFAULT_DEPARTMENTS);
}

export function saveDepartments(departments: Department[]): void {
  safeSetItem(STORAGE_KEYS.DEPARTMENTS, departments);
}

// Specialties (with Category backward compatibility)
export function loadSpecialties(): Specialty[] {
  const loaded = safeGetItem<Specialty[]>(
    STORAGE_KEYS.SPECIALTIES,
    safeGetItem<Specialty[]>(STORAGE_KEYS.CATEGORIES_LEGACY, DEFAULT_SPECIALTIES)
  );
  return loaded;
}

export function saveSpecialties(specialties: Specialty[]): void {
  safeSetItem(STORAGE_KEYS.SPECIALTIES, specialties);
  safeSetItem(STORAGE_KEYS.CATEGORIES_LEGACY, specialties); // keep in sync
}

// Backward-compatible wrappers
export const loadCategories = loadSpecialties;
export const saveCategories = saveSpecialties;

// Protocols
export function loadProtocols(): Protocol[] {
  const protocols = safeGetItem<any[]>(STORAGE_KEYS.PROTOCOLS, DEFAULT_PROTOCOLS);
  // Ensure specialtyId and categoryId are mapped
  return protocols.map((p) => {
    const sId = p.specialtyId || p.categoryId || undefined;
    return {
      ...p,
      specialtyId: sId,
      categoryId: sId,
    };
  });
}

export function saveProtocols(protocols: Protocol[]): void {
  const normalized = protocols.map((p) => ({
    ...p,
    specialtyId: p.specialtyId || p.categoryId || undefined,
    categoryId: p.specialtyId || p.categoryId || undefined,
  }));
  safeSetItem(STORAGE_KEYS.PROTOCOLS, normalized);
}

// Favorites
export function loadFavorites(): string[] {
  return safeGetItem<string[]>(STORAGE_KEYS.FAVORITES, []);
}

export function toggleFavorite(protocolId: string): string[] {
  const current = loadFavorites();
  let updated: string[];
  if (current.includes(protocolId)) {
    updated = current.filter((id) => id !== protocolId);
  } else {
    updated = [...current, protocolId];
  }
  safeSetItem(STORAGE_KEYS.FAVORITES, updated);
  return updated;
}

// Recently Viewed (Max 10)
export function loadRecentlyViewed(): string[] {
  return safeGetItem<string[]>(STORAGE_KEYS.RECENTLY_VIEWED, []);
}

export function recordRecentlyViewed(protocolId: string): string[] {
  const current = loadRecentlyViewed();
  const filtered = current.filter((id) => id !== protocolId);
  const updated = [protocolId, ...filtered].slice(0, 10);
  safeSetItem(STORAGE_KEYS.RECENTLY_VIEWED, updated);
  return updated;
}

// Full Export
export function exportAllData(): AppDataExport {
  const specialties = loadSpecialties();
  return {
    version: 1,
    exportDate: new Date().toISOString(),
    settings: loadSettings(),
    departments: loadDepartments(),
    specialties: specialties,
    categories: specialties,
    protocols: loadProtocols(),
    favorites: loadFavorites(),
    recentlyViewed: loadRecentlyViewed(),
  };
}

export function downloadBackupFile(): void {
  const data = exportAllData();
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `rx_protocol_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Import Validation & Processing
export interface ImportResult {
  success: boolean;
  message: string;
  importedProtocolsCount?: number;
  importedDepartmentsCount?: number;
  importedSpecialtiesCount?: number;
  importedCategoriesCount?: number;
}

export function validateAndImportData(
  jsonContent: string,
  mode: 'replace' | 'merge' = 'replace'
): ImportResult {
  try {
    const data = JSON.parse(jsonContent) as any;

    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Invalid JSON format. Please select a valid backup file.' };
    }

    if (!Array.isArray(data.protocols) && !Array.isArray(data.departments)) {
      return {
        success: false,
        message: 'Missing essential data structures (protocols or departments array not found).',
      };
    }

    // Clean and validate protocols
    const validProtocols: Protocol[] = Array.isArray(data.protocols)
      ? data.protocols.filter((p: any) => p && typeof p.id === 'string' && typeof p.title === 'string').map((p: any) => {
          const specId = p.specialtyId || p.categoryId || '';
          return {
            id: p.id,
            title: p.title || 'Untitled Protocol',
            departmentId: p.departmentId || '',
            specialtyId: specId,
            categoryId: specId,
            synonyms: Array.isArray(p.synonyms) ? p.synonyms : [],
            keywords: Array.isArray(p.keywords) ? p.keywords : [],
            sections: Array.isArray(p.sections)
              ? p.sections.map((s: any, idx: number) => ({
                  id: s.id || `sec-${idx + 1}`,
                  title: s.title || `Section ${idx + 1}`,
                  type: (['text', 'bullets', 'numbered', 'table', 'warning'].includes(s.type)
                    ? s.type
                    : 'text') as any,
                  content: s.content ?? '',
                  order: typeof s.order === 'number' ? s.order : idx + 1,
                }))
              : [],
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: p.updatedAt || new Date().toISOString(),
            pinned: !!p.pinned,
          };
        })
      : [];

    const validDepartments: Department[] = Array.isArray(data.departments)
      ? data.departments.filter((d: any) => d && typeof d.id === 'string' && typeof d.name === 'string').map((d: any, i: number) => ({
          id: d.id,
          name: d.name,
          icon: d.icon || 'Folder',
          color: d.color || 'blue',
          order: typeof d.order === 'number' ? d.order : i + 1,
        }))
      : [];

    const rawSpecialties = Array.isArray(data.specialties)
      ? data.specialties
      : Array.isArray(data.categories)
      ? data.categories
      : [];

    const validSpecialties: Specialty[] = rawSpecialties
      .filter((s: any) => s && typeof s.id === 'string' && typeof s.name === 'string')
      .map((s: any, i: number) => ({
        id: s.id,
        name: s.name,
        departmentId: s.departmentId || '',
        order: typeof s.order === 'number' ? s.order : i + 1,
      }));

    if (mode === 'replace') {
      if (validProtocols.length > 0) saveProtocols(validProtocols);
      if (validDepartments.length > 0) saveDepartments(validDepartments);
      if (validSpecialties.length > 0) saveSpecialties(validSpecialties);
      if (data.settings && typeof data.settings.appName === 'string') {
        saveSettings({
          ...DEFAULT_SETTINGS,
          ...data.settings,
        });
      }
      if (Array.isArray(data.favorites)) {
        safeSetItem(STORAGE_KEYS.FAVORITES, data.favorites);
      }
    } else {
      // Merge mode
      const currentProtocols = loadProtocols();
      const currentDepts = loadDepartments();
      const currentSpecs = loadSpecialties();

      const existingProtIds = new Set(currentProtocols.map((p) => p.id));
      const existingDeptIds = new Set(currentDepts.map((d) => d.id));
      const existingSpecIds = new Set(currentSpecs.map((s) => s.id));

      const mergedProtocols = [...currentProtocols];
      validProtocols.forEach((p) => {
        if (!existingProtIds.has(p.id)) {
          mergedProtocols.push(p);
        }
      });

      const mergedDepts = [...currentDepts];
      validDepartments.forEach((d) => {
        if (!existingDeptIds.has(d.id)) {
          mergedDepts.push(d);
        }
      });

      const mergedSpecs = [...currentSpecs];
      validSpecialties.forEach((s) => {
        if (!existingSpecIds.has(s.id)) {
          mergedSpecs.push(s);
        }
      });

      saveProtocols(mergedProtocols);
      saveDepartments(mergedDepts);
      saveSpecialties(mergedSpecs);
    }

    return {
      success: true,
      message: `Successfully imported data (${validProtocols.length} protocols, ${validDepartments.length} departments, ${validSpecialties.length} specialties).`,
      importedProtocolsCount: validProtocols.length,
      importedDepartmentsCount: validDepartments.length,
      importedSpecialtiesCount: validSpecialties.length,
      importedCategoriesCount: validSpecialties.length,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to import JSON file: ${err?.message || 'Unknown parsing error'}`,
    };
  }
}

// Reset/Wipe all data to empty state
export function resetToDefaultData(): void {
  safeSetItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  safeSetItem(STORAGE_KEYS.DEPARTMENTS, []);
  safeSetItem(STORAGE_KEYS.SPECIALTIES, []);
  safeSetItem(STORAGE_KEYS.CATEGORIES_LEGACY, []);
  safeSetItem(STORAGE_KEYS.PROTOCOLS, []);
  safeSetItem(STORAGE_KEYS.FAVORITES, []);
  safeSetItem(STORAGE_KEYS.RECENTLY_VIEWED, []);
}

export function clearAllProtocolsData(): void {
  safeSetItem(STORAGE_KEYS.PROTOCOLS, []);
  safeSetItem(STORAGE_KEYS.FAVORITES, []);
  safeSetItem(STORAGE_KEYS.RECENTLY_VIEWED, []);
}
