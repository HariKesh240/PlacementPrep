import confetti from 'canvas-confetti';
import { StudentProfile } from '../types';

export function getAuthToken(): string | null {
  try {
    const saved = localStorage.getItem('placeprep_auth_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.token || null;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export function triggerConfetti() {
  // Celebration pop up animations removed as requested
}

export interface ReadinessCategory {
  level: 'Placement Ready' | 'Almost Ready' | 'Needs Improvement' | 'Beginner Level';
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export function getReadinessCategory(score: number): ReadinessCategory {
  if (score >= 90) {
    return {
      level: 'Placement Ready',
      color: '#0f172a',
      badgeBg: 'bg-slate-900 text-white border-slate-900',
      badgeText: 'text-white font-extrabold',
      description: 'Exceptional readiness across all technical, aptitude, and core computer science dimensions. Ready to crack Tier-1 & Super Dream campus offers!',
    };
  }
  if (score >= 75) {
    return {
      level: 'Almost Ready',
      color: '#1e293b',
      badgeBg: 'bg-slate-800 text-white border-slate-700',
      badgeText: 'text-white font-bold',
      description: 'Solid foundation in algorithms and aptitude. A targeted 2-week focus on weak topics and mock interviews will push you into top tier.',
    };
  }
  if (score >= 50) {
    return {
      level: 'Needs Improvement',
      color: '#475569',
      badgeBg: 'bg-slate-100 border-slate-300 text-slate-800',
      badgeText: 'text-slate-800 font-semibold',
      description: 'Basic concepts understood, but consistency and time complexity optimizations require deliberate practice before placement season begins.',
    };
  }
  return {
    level: 'Beginner Level',
    color: '#64748b',
    badgeBg: 'bg-slate-50 border-slate-200 text-slate-600',
    badgeText: 'text-slate-600',
    description: 'Starting your placement preparation journey. Follow the structured step-by-step curriculum to build fundamentals from scratch.',
  };
}

export function calculateReadinessScore(profile: StudentProfile): {
  overall: number;
  dsa: number;
  aptitude: number;
  sql: number;
  coreCS: number;
  consistency: number;
  weakTopics: string[];
  strongTopics: string[];
} {
  const dsa = profile.moduleScores.dsa;
  const aptitude = profile.moduleScores.aptitude;
  const sql = profile.moduleScores.sql;
  const coreCS = profile.moduleScores.coreCS;
  const consistency = Math.min(100, Math.round((profile.streakDays / 14) * 50 + 50));

  const overall = Math.round(
    dsa * 0.30 +
    aptitude * 0.25 +
    sql * 0.20 +
    coreCS * 0.15 +
    consistency * 0.10
  );

  const topicsWithScores: { name: string; score: number }[] = [
    { name: 'DSA - Dynamic Programming', score: dsa < 70 ? dsa - 10 : dsa },
    { name: 'DSA - Arrays & Pointers', score: dsa + 10 },
    { name: 'Aptitude - Permutations & Combinations', score: aptitude < 80 ? 60 : 75 },
    { name: 'Aptitude - Time & Work', score: aptitude >= 80 ? 88 : 70 },
    { name: 'SQL - Complex Joins & Subqueries', score: sql },
    { name: 'Core CS - OS Deadlocks & Memory', score: coreCS },
    { name: 'Core CS - DBMS Indexing (B+ Trees)', score: coreCS + 5 },
  ];

  const weakTopics = topicsWithScores
    .filter((t) => t.score < 75)
    .sort((a, b) => a.score - b.score)
    .map((t) => t.name);

  const strongTopics = topicsWithScores
    .filter((t) => t.score >= 75)
    .sort((a, b) => b.score - a.score)
    .map((t) => t.name);

  return {
    overall,
    dsa,
    aptitude,
    sql,
    coreCS,
    consistency,
    weakTopics: weakTopics.length > 0 ? weakTopics : ['Advanced Dynamic Programming', 'SQL Window Functions'],
    strongTopics: strongTopics.length > 0 ? strongTopics : ['Arrays & Hash Maps', 'Logical Syllogisms', 'DBMS ACID Properties'],
  };
}

export interface AgentApiResponse {
  text: string;
  modelUsed?: string;
  provider?: 'gemini' | 'openai' | 'cloud_ai';
  complexity?: 'simple_syntax_logic' | 'out_of_box_complex';
  routingReason?: string;
}

export async function callAgentApi(
  agentType: string,
  payload: any,
  modelPreference?: 'auto' | 'gemini' | 'openai'
): Promise<AgentApiResponse> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/ai/agent', {
      method: 'POST',
      headers,
      body: JSON.stringify({ agentType, payload, modelPreference }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    return {
      text: data.text || '',
      modelUsed: data.modelUsed,
      provider: data.provider,
      complexity: data.complexity,
      routingReason: data.routingReason,
    };
  } catch (err: any) {
    console.error(`AI Agent (${agentType}) error:`, err);
    throw err;
  }
}

export async function runCodeApi(payload: {
  code: string;
  language: string;
  problemId?: string;
  testCases?: any[];
  customInput?: string;
}) {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/code/run', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function runSqlApi(query: string) {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/sql/run', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });
  return await res.json();
}

// ======================== CENTRAL PERSISTENCE APIS ========================

export async function bootstrapDataApi() {
  try {
    const res = await fetch('/api/data/bootstrap');
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn('Bootstrap API failed, fallback to local cache:', err);
  }
  return null;
}

export async function syncProfileApi(profile: StudentProfile) {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/profile/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({ profile }),
    });
    return await res.json();
  } catch (err) {
    console.warn('Profile sync failed:', err);
  }
  return null;
}

export async function scheduleInterviewApi(slot: any) {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/interview/schedule', {
    method: 'POST',
    headers,
    body: JSON.stringify({ slot }),
  });
  return await res.json();
}

export async function saveInterviewSessionApi(report: any) {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/interview/save', {
    method: 'POST',
    headers,
    body: JSON.stringify({ report }),
  });
  return await res.json();
}

export async function fetchInterviewHistoryApi() {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/interview/history', { headers });
    if (res.ok) {
      const data = await res.json();
      return data.history || [];
    }
  } catch (err) {
    console.warn('Fetch interview history failed:', err);
  }
  return [];
}

export async function fetchCohortAnalyticsApi() {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/admin/cohort-analytics', { headers });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Fetch cohort analytics failed:', err);
  }
  return null;
}

export async function publishBatchQuestionsApi(items: {
  aptitude?: any[];
  dsa?: any[];
  sql?: any[];
  flashcard?: any[];
  customTables?: any[];
}) {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/admin/publish-batch', {
    method: 'POST',
    headers,
    body: JSON.stringify(items),
  });
  return await res.json();
}

export async function fetchAdminSqlTablesApi() {
  const res = await fetch('/api/admin/sql-tables');
  if (res.ok) {
    const data = await res.json();
    return data.tables || [];
  }
  return [];
}

export async function saveAdminSqlTableApi(table: any) {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/admin/sql-tables', {
    method: 'POST',
    headers,
    body: JSON.stringify({ table }),
  });
  return await res.json();
}

export async function deleteAdminSqlTableApi(id: string) {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/admin/sql-tables/${id}`, {
    method: 'DELETE',
    headers,
  });
  return await res.json();
}

// ======================== ATS RESUME SCORER ========================

export function calculateAtsScore(resume: any): {
  score: number;
  metricsCount: number;
  actionVerbsCount: number;
  missingSections: string[];
  recommendations: string[];
} {
  let score = 30; // base points
  const missingSections: string[] = [];
  const recommendations: string[] = [];

  // Check contact details
  const p = resume.personalInfo || {};
  if (p.fullName && p.email && p.phone) score += 15;
  else {
    missingSections.push('Complete Contact Details');
    recommendations.push('Include professional email, phone number, and location.');
  }

  if (p.linkedin || p.github) score += 10;
  else recommendations.push('Add active GitHub or LinkedIn profile links.');

  // Check education
  if (resume.education && resume.education.length > 0) score += 15;
  else {
    missingSections.push('Education Section');
    recommendations.push('List college degree, institution, and CGPA.');
  }

  // Check technical skills
  if (resume.skills && resume.skills.length > 0) score += 15;
  else {
    missingSections.push('Technical Skills');
    recommendations.push('Group skills into categories (Languages, Frameworks, Databases).');
  }

  // Check projects and experience metrics (Google XYZ style)
  let metricsCount = 0;
  let actionVerbsCount = 0;
  const metricRegex = /\b(\d+%|\d+x|\d+ms|\d+\+?|\$\d+|\d+k|\d+m)\b/i;
  const actionVerbRegex = /\b(built|developed|architected|engineered|optimized|designed|implemented|reduced|increased|accelerated|deployed|automated|spearheaded|created)\b/i;

  const allBullets: string[] = [];
  (resume.projects || []).forEach((proj: any) => {
    (proj.bullets || []).forEach((b: string) => allBullets.push(b));
  });
  (resume.experience || []).forEach((exp: any) => {
    (exp.bullets || []).forEach((b: string) => allBullets.push(b));
  });

  allBullets.forEach((bullet) => {
    if (metricRegex.test(bullet)) metricsCount++;
    if (actionVerbRegex.test(bullet)) actionVerbsCount++;
  });

  if (metricsCount >= 3) score += 10;
  else recommendations.push('Add quantifiable metrics (e.g. "improved latency by 35%", "handled 10k requests").');

  if (actionVerbsCount >= 4) score += 5;
  else recommendations.push('Start bullet points with strong action verbs (Architected, Engineered, Optimized).');

  score = Math.min(100, Math.max(20, score));

  return {
    score,
    metricsCount,
    actionVerbsCount,
    missingSections,
    recommendations: recommendations.length > 0 ? recommendations : ['Great ATS formatting! Ready for application submission.'],
  };
}
