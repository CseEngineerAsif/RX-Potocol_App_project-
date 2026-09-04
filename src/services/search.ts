import {
  Protocol,
  Department,
  Specialty,
  SearchMatchResult,
  SpecialtySearchResult,
  DepartmentSearchResult,
  SearchResultsGroup,
} from '../types';
import { htmlToPlainText } from '../utils/sanitize';

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

// Extract full text from section content regardless of type
export function extractSectionText(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return htmlToPlainText(content);
  if (Array.isArray(content)) {
    return content.map((item) => (typeof item === 'string' ? htmlToPlainText(item) : JSON.stringify(item))).join(' ');
  }
  if (typeof content === 'object') {
    // Table
    const headers = Array.isArray(content.headers) ? content.headers.join(' ') : '';
    const rows = Array.isArray(content.rows)
      ? content.rows.map((r: any) => (Array.isArray(r) ? r.join(' ') : '')).join(' ')
      : '';
    return `${headers} ${rows}`;
  }
  return String(content);
}

// Extract a concise highlighted snippet containing the matching query
function createSnippet(text: string, query: string, maxLength = 130): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return text.length > maxLength ? text.substring(0, maxLength).trim() + '...' : text;
  }

  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + lowerQuery.length + 70);
  let snippet = text.substring(start, end).trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}

export function searchProtocols(
  protocols: Protocol[],
  query: string,
  departmentId?: string,
  specialtyId?: string,
  departments: Department[] = [],
  specialties: Specialty[] = []
): SearchMatchResult[] {
  const trimmedQuery = query.trim().toLowerCase();
  const deptMap = new Map(departments.map((d) => [d.id, d.name.toLowerCase()]));
  const specMap = new Map(specialties.map((s) => [s.id, s.name.toLowerCase()]));

  // Filter first if department or specialty filter applied
  const candidateProtocols = protocols.filter((p) => {
    const pSpecId = p.specialtyId || p.categoryId;
    if (departmentId && p.departmentId !== departmentId) return false;
    if (specialtyId && pSpecId !== specialtyId) return false;
    return true;
  });

  if (!trimmedQuery) {
    return candidateProtocols.map((p) => ({
      protocol: p,
      score: 1,
      matchReasons: [],
    }));
  }

  const queryWords = trimmedQuery.split(/\s+/).filter(Boolean);
  const results: SearchMatchResult[] = [];

  for (const protocol of candidateProtocols) {
    let score = 0;
    const matchReasons: string[] = [];
    let bestSnippet = '';

    const lowerTitle = protocol.title.toLowerCase();
    const deptName = protocol.departmentId ? deptMap.get(protocol.departmentId) || '' : '';
    const pSpecId = protocol.specialtyId || protocol.categoryId;
    const specName = pSpecId ? specMap.get(pSpecId) || '' : '';

    // 1. Exact Title Match
    if (lowerTitle === trimmedQuery) {
      score += 1000;
      matchReasons.push('Exact Title');
    } else if (lowerTitle.includes(trimmedQuery)) {
      score += 500;
      matchReasons.push('Title Match');
      bestSnippet = protocol.title;
    } else {
      // Check word by word in title
      const allWordsInTitle = queryWords.every((w) => lowerTitle.includes(w));
      if (allWordsInTitle) {
        score += 300;
        matchReasons.push('Title Keyword');
      }
    }

    // 2. Synonyms Match
    if (protocol.synonyms && protocol.synonyms.length > 0) {
      for (const syn of protocol.synonyms) {
        const lowerSyn = syn.toLowerCase();
        if (lowerSyn === trimmedQuery) {
          score += 400;
          matchReasons.push(`Synonym: "${syn}"`);
          if (!bestSnippet) bestSnippet = `Synonym: ${syn}`;
        } else if (lowerSyn.includes(trimmedQuery)) {
          score += 250;
          matchReasons.push(`Synonym: "${syn}"`);
          if (!bestSnippet) bestSnippet = `Synonym: ${syn}`;
        } else if (queryWords.length > 1 && queryWords.every((w) => lowerSyn.includes(w))) {
          score += 200;
          matchReasons.push(`Synonym: "${syn}"`);
        }
      }
    }

    // 3. Keywords Match
    if (protocol.keywords && protocol.keywords.length > 0) {
      for (const kw of protocol.keywords) {
        const lowerKw = kw.toLowerCase();
        if (lowerKw === trimmedQuery) {
          score += 200;
          matchReasons.push(`Keyword: "${kw}"`);
        } else if (lowerKw.includes(trimmedQuery)) {
          score += 150;
          matchReasons.push(`Keyword: "${kw}"`);
        }
      }
    }

    // 4. Department & Specialty Match
    if (deptName && (deptName === trimmedQuery || deptName.includes(trimmedQuery))) {
      score += 120;
      matchReasons.push(`Department: ${departments.find((d) => d.id === protocol.departmentId)?.name}`);
    }
    if (specName && (specName === trimmedQuery || specName.includes(trimmedQuery))) {
      score += 120;
      matchReasons.push(`Specialty: ${specialties.find((s) => s.id === pSpecId)?.name}`);
    }

    // 5. Section Titles and Content Match
    if (protocol.sections && protocol.sections.length > 0) {
      for (const section of protocol.sections) {
        const lowerSecTitle = section.title.toLowerCase();
        if (lowerSecTitle.includes(trimmedQuery)) {
          score += 100;
          matchReasons.push(`Section: ${section.title}`);
        }

        const secText = extractSectionText(section.content);
        const lowerSecText = secText.toLowerCase();

        if (lowerSecText.includes(trimmedQuery)) {
          score += 80;
          if (!matchReasons.includes(`In: ${section.title}`)) {
            matchReasons.push(`In: ${section.title}`);
          }
          if (!bestSnippet) {
            bestSnippet = `${section.title}: ${createSnippet(secText, trimmedQuery)}`;
          }
        } else if (queryWords.length > 1) {
          const matchCount = queryWords.filter((w) => lowerSecText.includes(w)).length;
          if (matchCount === queryWords.length) {
            score += 60;
            if (!matchReasons.includes(`In: ${section.title}`)) {
              matchReasons.push(`In: ${section.title}`);
            }
            if (!bestSnippet) {
              bestSnippet = `${section.title}: ${createSnippet(secText, queryWords[0])}`;
            }
          }
        }
      }
    }

    // 6. Typo Tolerance (Fuzzy match if no exact hits and query >= 4 chars)
    if (score === 0 && trimmedQuery.length >= 4) {
      // Check title words
      const titleTokens = lowerTitle.split(/\s+/);
      for (const token of titleTokens) {
        if (Math.abs(token.length - trimmedQuery.length) <= 2) {
          const dist = levenshteinDistance(token, trimmedQuery);
          if (dist <= 2) {
            score += 70 - dist * 20;
            matchReasons.push(`Similar to "${token}"`);
            bestSnippet = protocol.title;
            break;
          }
        }
      }

      // Check synonyms typo
      if (score === 0 && protocol.synonyms) {
        for (const syn of protocol.synonyms) {
          const synTokens = syn.toLowerCase().split(/\s+/);
          for (const token of synTokens) {
            if (Math.abs(token.length - trimmedQuery.length) <= 2) {
              const dist = levenshteinDistance(token, trimmedQuery);
              if (dist <= 2) {
                score += 50 - dist * 15;
                matchReasons.push(`Similar to synonym "${syn}"`);
                bestSnippet = `Synonym: ${syn}`;
                break;
              }
            }
          }
          if (score > 0) break;
        }
      }
    }

    if (score > 0) {
      results.push({
        protocol,
        score,
        matchReasons: Array.from(new Set(matchReasons)),
        snippet: bestSnippet,
      });
    }
  }

  // Sort by score descending, then by pinned status, then by title
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.protocol.pinned && !b.protocol.pinned) return -1;
    if (!a.protocol.pinned && b.protocol.pinned) return 1;
    return a.protocol.title.localeCompare(b.protocol.title);
  });
}

export function searchAll(
  protocols: Protocol[],
  query: string,
  departments: Department[] = [],
  specialties: Specialty[] = [],
  departmentId?: string,
  specialtyId?: string
): SearchResultsGroup {
  const trimmedQuery = query.trim().toLowerCase();

  // If query is empty, return matching protocols based on active filter chips
  if (!trimmedQuery) {
    const protocolMatches = searchProtocols(protocols, '', departmentId, specialtyId, departments, specialties);
    return {
      specialties: [],
      categories: [],
      departments: [],
      protocols: protocolMatches,
    };
  }

  const queryWords = trimmedQuery.split(/\s+/).filter(Boolean);

  // 1. Match Specialties
  const matchedSpecialties: SpecialtySearchResult[] = [];
  for (const spec of specialties) {
    if (departmentId && spec.departmentId && spec.departmentId !== departmentId) continue;
    if (specialtyId && spec.id !== specialtyId) continue;

    const lowerSpecName = spec.name.toLowerCase();
    const isExact = lowerSpecName === trimmedQuery;
    const isPartial = lowerSpecName.includes(trimmedQuery);
    const allWordsMatch = queryWords.length > 1 && queryWords.every((w) => lowerSpecName.includes(w));

    let isMatch = isExact || isPartial || allWordsMatch;

    if (!isMatch && trimmedQuery.length >= 4) {
      const dist = levenshteinDistance(lowerSpecName, trimmedQuery);
      if (dist <= 2) isMatch = true;
    }

    if (isMatch) {
      const dept = departments.find((d) => d.id === spec.departmentId);
      const protocolCount = protocols.filter((p) => (p.specialtyId || p.categoryId) === spec.id).length;
      const res: SpecialtySearchResult = {
        specialty: spec,
        category: spec,
        department: dept,
        protocolCount,
      };
      matchedSpecialties.push(res);
    }
  }

  // 2. Match Departments
  const matchedDepartments: DepartmentSearchResult[] = [];
  for (const dept of departments) {
    if (departmentId && dept.id !== departmentId) continue;

    const lowerDeptName = dept.name.toLowerCase();
    const isExact = lowerDeptName === trimmedQuery;
    const isPartial = lowerDeptName.includes(trimmedQuery);
    const allWordsMatch = queryWords.length > 1 && queryWords.every((w) => lowerDeptName.includes(w));

    let isMatch = isExact || isPartial || allWordsMatch;

    if (!isMatch && trimmedQuery.length >= 4) {
      const dist = levenshteinDistance(lowerDeptName, trimmedQuery);
      if (dist <= 2) isMatch = true;
    }

    if (isMatch) {
      const protocolCount = protocols.filter((p) => p.departmentId === dept.id).length;
      matchedDepartments.push({
        department: dept,
        protocolCount,
      });
    }
  }

  // 3. Match Protocols (includes specialty/department hits)
  const matchedProtocols = searchProtocols(protocols, query, departmentId, specialtyId, departments, specialties);

  return {
    specialties: matchedSpecialties,
    categories: matchedSpecialties,
    departments: matchedDepartments,
    protocols: matchedProtocols,
  };
}
