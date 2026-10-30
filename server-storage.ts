import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  initialStudentProfile, 
  sampleDsaProblems, 
  sampleAptitudeQuestions, 
  sampleSqlChallenges, 
  initialCustomSqlTables,
  sampleFlashcards, 
  sampleMockInterviews,
  sampleLeaderboard
} from './src/data/mockData';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'placeprep-secure-salt-2026').digest('hex');
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'admin';
  college: string;
  batch: string;
  targetRole: string;
  createdAt: string;
}

export interface DataStore {
  users: StoredUser[];
  profiles: Record<string, any>;
  aptitudeQuestions: any[];
  dsaProblems: any[];
  sqlChallenges: any[];
  customSqlTables?: any[];
  flashcards: any[];
  mockInterviewSlots: any[];
  mockInterviewHistory: any[];
  cohortStudents: any[];
}

function getInitialStore(): DataStore {
  const defaultAdmin: StoredUser = {
    id: 'admin-101',
    name: 'Dr. K. Sharma (Placement Officer)',
    email: 'admin@placeprep.edu',
    passwordHash: hashPassword('Admin@123'),
    role: 'admin',
    college: 'National Institute of Technology',
    batch: 'Placement Cell Administration',
    targetRole: 'Placement Officer',
    createdAt: new Date().toISOString(),
  };

  const defaultStudent: StoredUser = {
    id: 'stu-101',
    name: 'Devika Sharma',
    email: 'student@placeprep.edu',
    passwordHash: hashPassword('Student@123'),
    role: 'student',
    college: 'National Institute of Technology',
    batch: '2026 Batch - Computer Science',
    targetRole: 'Software Development Engineer (SDE)',
    createdAt: new Date().toISOString(),
  };

  const cohortStudents = [
    { id: 'stu-101', name: 'Devika Sharma', branch: 'Computer Science', dsaScore: 88, aptitudeScore: 84, sqlScore: 80, readiness: 85, status: 'Placement Ready' },
    { id: 'stu-102', name: 'Rohan Verma', branch: 'Computer Science', dsaScore: 92, aptitudeScore: 90, sqlScore: 88, readiness: 91, status: 'Placement Ready' },
    { id: 'stu-103', name: 'Priya Nair', branch: 'Information Technology', dsaScore: 85, aptitudeScore: 78, sqlScore: 82, readiness: 82, status: 'Placement Ready' },
    { id: 'stu-104', name: 'Arjun Mehta', branch: 'Electronics & Comm', dsaScore: 72, aptitudeScore: 76, sqlScore: 70, readiness: 73, status: 'Almost Ready' },
    { id: 'stu-105', name: 'Sneha Patel', branch: 'Data Science', dsaScore: 95, aptitudeScore: 92, sqlScore: 94, readiness: 94, status: 'Placement Ready' },
    { id: 'stu-106', name: 'Tanvi Rao', branch: 'Computer Science', dsaScore: 65, aptitudeScore: 60, sqlScore: 68, readiness: 64, status: 'Needs Improvement' },
    { id: 'stu-107', name: 'Vikram Singh', branch: 'Information Technology', dsaScore: 86, aptitudeScore: 82, sqlScore: 85, readiness: 85, status: 'Placement Ready' },
    { id: 'stu-108', name: 'Ananya Iyer', branch: 'Data Science', dsaScore: 78, aptitudeScore: 80, sqlScore: 75, readiness: 78, status: 'Almost Ready' }
  ];

  return {
    users: [defaultAdmin, defaultStudent],
    profiles: {
      'stu-101': { ...initialStudentProfile },
    },
    aptitudeQuestions: [...sampleAptitudeQuestions],
    dsaProblems: [...sampleDsaProblems],
    sqlChallenges: [...sampleSqlChallenges],
    customSqlTables: [...initialCustomSqlTables],
    flashcards: [...sampleFlashcards],
    mockInterviewSlots: [...sampleMockInterviews],
    mockInterviewHistory: [
      {
        id: 'hist-1',
        userId: 'stu-101',
        candidateName: 'Devika Sharma',
        targetCompany: 'Google',
        interviewType: 'Technical DSA',
        date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        scores: { technical: 88, communication: 85, problemSolving: 90, overall: 88 },
        verdict: 'Strong Hire',
        strengths: ['Clean algorithmic logic', 'Clear time complexity trade-offs'],
        improvements: ['Check edge cases like empty arrays earlier in the discussion'],
        transcriptCount: 6,
      }
    ],
    cohortStudents,
  };
}

export function loadStore(): DataStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...getInitialStore(), ...parsed };
    }
  } catch (err) {
    console.error('Error reading store file, reinitializing:', err);
  }

  const initial = getInitialStore();
  saveStore(initial);
  return initial;
}

export function saveStore(store: DataStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write store file:', err);
  }
}
