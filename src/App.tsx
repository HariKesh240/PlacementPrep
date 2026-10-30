/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ModuleTab, UserRole, StudentProfile, AuthUser, AptitudeQuestion, DSAProblem, SQLChallenge, Flashcard, CustomSqlTable } from './types';
import { initialStudentProfile, sampleAptitudeQuestions, sampleDsaProblems, sampleSqlChallenges, sampleFlashcards, initialCustomSqlTables, createFreshStudentProfile } from './data/mockData';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { DsaPlatform } from './components/DSA/DsaPlatform';
import { AptitudeModule } from './components/Aptitude/AptitudeModule';
import { SqlPractice } from './components/SQL/SqlPractice';
import { CoreCSModule } from './components/CoreCS/CoreCSModule';
import { MockInterviewModule } from './components/MockInterview/MockInterviewModule';
import { ResumeBuilder } from './components/Resume/ResumeBuilder';
import { LeaderboardView } from './components/Leaderboard/LeaderboardView';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AuthPage } from './components/Auth/AuthPage';
import { AuthModal } from './components/Auth/AuthModal';
import { calculateReadinessScore, bootstrapDataApi, syncProfileApi } from './utils/readiness';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  // Auth state: null by default so Login / Register screen shows first
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('placeprep_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [userRole, setUserRole] = useState<UserRole>(() => {
    return authUser?.role || 'student';
  });

  const [currentTab, setCurrentTab] = useState<ModuleTab>(() => {
    return authUser?.role === 'admin' ? 'admin' : 'dashboard';
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Student Profile State: keyed to current authUser
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const savedUser = localStorage.getItem('placeprep_auth_user');
      const currentUser = savedUser ? JSON.parse(savedUser) : null;
      if (currentUser?.id) {
        const saved = localStorage.getItem(`placeprep_student_profile_${currentUser.id}`);
        if (saved) return JSON.parse(saved);
        return createFreshStudentProfile(currentUser.id, currentUser.name, currentUser.email, currentUser.college, currentUser.targetRole);
      }
    } catch {}
    return initialStudentProfile;
  });

  // Dynamic Question Repositories (Syncs questions uploaded by admin via Word/PDF)
  const [aptitudeQuestions, setAptitudeQuestions] = useState<AptitudeQuestion[]>(() => {
    try {
      const saved = localStorage.getItem('placeprep_aptitude_questions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return sampleAptitudeQuestions;
  });

  const [dsaProblems, setDsaProblems] = useState<DSAProblem[]>(() => {
    try {
      const saved = localStorage.getItem('placeprep_dsa_problems');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all problems use the real Main class and main method
        const upgraded = parsed.map((p: DSAProblem) => {
          const sample = sampleDsaProblems.find(s => s.id === p.id);
          if (sample && (!p.starterCodes?.java || p.starterCodes.java.includes('class Solution'))) {
            return {
              ...p,
              starterCodes: sample.starterCodes,
              optimalSolution: sample.optimalSolution,
              testCases: sample.testCases
            };
          }
          return p;
        });
        return upgraded;
      }
    } catch {}
    return sampleDsaProblems;
  });

  const [sqlChallenges, setSqlChallenges] = useState<SQLChallenge[]>(() => {
    try {
      const saved = localStorage.getItem('placeprep_sql_challenges');
      if (saved) return JSON.parse(saved);
    } catch {}
    return sampleSqlChallenges;
  });

  const [customSqlTables, setCustomSqlTables] = useState<CustomSqlTable[]>(() => {
    try {
      const saved = localStorage.getItem('placeprep_custom_sql_tables');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialCustomSqlTables;
  });

  const [flashcardsList, setFlashcardsList] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem('placeprep_flashcards');
      if (saved) return JSON.parse(saved);
    } catch {}
    return sampleFlashcards;
  });

  // Bootstrap data from central server store on load
  useEffect(() => {
    bootstrapDataApi().then((data) => {
      if (data) {
        if (data.aptitudeQuestions?.length) {
          setAptitudeQuestions(data.aptitudeQuestions);
          try { localStorage.setItem('placeprep_aptitude_questions', JSON.stringify(data.aptitudeQuestions)); } catch {}
        }
        if (data.dsaProblems?.length) {
          setDsaProblems(data.dsaProblems);
          try { localStorage.setItem('placeprep_dsa_problems', JSON.stringify(data.dsaProblems)); } catch {}
        }
        if (data.sqlChallenges?.length) {
          setSqlChallenges(data.sqlChallenges);
          try { localStorage.setItem('placeprep_sql_challenges', JSON.stringify(data.sqlChallenges)); } catch {}
        }
        if (data.customSqlTables?.length) {
          setCustomSqlTables(data.customSqlTables);
          try { localStorage.setItem('placeprep_custom_sql_tables', JSON.stringify(data.customSqlTables)); } catch {}
        }
        if (data.flashcards?.length) {
          setFlashcardsList(data.flashcards);
          try { localStorage.setItem('placeprep_flashcards', JSON.stringify(data.flashcards)); } catch {}
        }
        if (data.profile && authUser?.id && authUser.id === data.profile.id) {
          setProfile(data.profile);
          try { localStorage.setItem(`placeprep_student_profile_${authUser.id}`, JSON.stringify(data.profile)); } catch {}
        }
      }
    });
  }, []);

  // Strict Route Guard: If a student tries to access admin tab, force redirect to dashboard
  useEffect(() => {
    if (authUser && authUser.role !== 'admin' && currentTab === 'admin') {
      setCurrentTab('dashboard');
      setUserRole('student');
    }
  }, [authUser, currentTab]);

  // Sync profile to local storage (user-specific) & central server
  const isFirstProfileSync = React.useRef(true);
  useEffect(() => {
    try {
      if (authUser?.id) {
        localStorage.setItem(`placeprep_student_profile_${authUser.id}`, JSON.stringify(profile));
      }
      localStorage.setItem('placeprep_student_profile', JSON.stringify(profile));
      if (isFirstProfileSync.current) {
        isFirstProfileSync.current = false;
        return;
      }
      if (authUser && authUser.role === 'student') {
        syncProfileApi(profile);
      }
    } catch {}
  }, [profile, authUser]);

  // Sync auth user to local storage
  useEffect(() => {
    try {
      if (authUser) {
        localStorage.setItem('placeprep_auth_user', JSON.stringify(authUser));
      } else {
        localStorage.removeItem('placeprep_auth_user');
      }
    } catch {}
  }, [authUser]);

  // Auth Handlers
  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    setUserRole(user.role);

    if (user.role === 'admin' || user.email.toLowerCase().includes('admin')) {
      setCurrentTab('admin');
      setUserRole('admin');
    } else {
      // Load user-specific profile if saved, else create fresh empty profile for new account
      let userProf: StudentProfile;
      try {
        const savedProf = localStorage.getItem(`placeprep_student_profile_${user.id}`);
        if (savedProf) {
          userProf = JSON.parse(savedProf);
        } else {
          userProf = createFreshStudentProfile(user.id, user.name, user.email, user.college, user.targetRole);
        }
      } catch {
        userProf = createFreshStudentProfile(user.id, user.name, user.email, user.college, user.targetRole);
      }
      setProfile(userProf);
      setCurrentTab('dashboard');
      setUserRole('student');
    }
  };

  const handleSignOut = () => {
    setAuthUser(null);
    setUserRole('student');
    setCurrentTab('dashboard');
    try {
      localStorage.removeItem('placeprep_auth_user');
    } catch {}
  };

  // Batch Update from Admin (PDF/Word Document Upload, Questions & SQL Tables Ingestion)
  const handleBatchUpdateStudentPortal = ({
    aptitude,
    dsa,
    sql,
    flashcard,
    customTables,
  }: {
    aptitude?: AptitudeQuestion[];
    dsa?: DSAProblem[];
    sql?: SQLChallenge[];
    flashcard?: Flashcard[];
    customTables?: CustomSqlTable[];
  }) => {
    if (aptitude && aptitude.length > 0) {
      setAptitudeQuestions(prev => {
        const merged = [...aptitude, ...prev];
        try { localStorage.setItem('placeprep_aptitude_questions', JSON.stringify(merged)); } catch {}
        return merged;
      });
    }

    if (dsa && dsa.length > 0) {
      setDsaProblems(prev => {
        const merged = [...dsa, ...prev];
        try { localStorage.setItem('placeprep_dsa_problems', JSON.stringify(merged)); } catch {}
        return merged;
      });
    }

    if (sql && sql.length > 0) {
      setSqlChallenges(prev => {
        const merged = [...sql, ...prev];
        try { localStorage.setItem('placeprep_sql_challenges', JSON.stringify(merged)); } catch {}
        return merged;
      });
    }

    if (flashcard && flashcard.length > 0) {
      setFlashcardsList(prev => {
        const merged = [...flashcard, ...prev];
        try { localStorage.setItem('placeprep_flashcards', JSON.stringify(merged)); } catch {}
        return merged;
      });
    }

    if (customTables && customTables.length > 0) {
      setCustomSqlTables(prev => {
        const merged = [...customTables];
        try { localStorage.setItem('placeprep_custom_sql_tables', JSON.stringify(merged)); } catch {}
        return merged;
      });
    }
  };

  // Handler for solving a DSA problem
  const handleProblemSolved = (problemId: string, xpGain: number) => {
    setProfile((prev) => {
      const alreadySolved = prev.solvedDSAIds.includes(problemId);
      const newSolved = alreadySolved ? prev.solvedDSAIds : [...prev.solvedDSAIds, problemId];
      const newDsaScore = Math.min(100, prev.moduleScores.dsa + (alreadySolved ? 0 : 6));
      
      const updatedModuleScores = {
        ...prev.moduleScores,
        dsa: newDsaScore,
      };

      const updatedProfile: StudentProfile = {
        ...prev,
        xpPoints: prev.xpPoints + (alreadySolved ? 20 : xpGain),
        solvedDSAIds: newSolved,
        moduleScores: updatedModuleScores,
      };

      const { overall } = calculateReadinessScore(updatedProfile);
      updatedProfile.readinessScore = overall;

      return updatedProfile;
    });
  };

  // Handler for completing an Aptitude question
  const handleAptitudeCompleted = (questionId: string, isCorrect: boolean, xpGain: number) => {
    setProfile((prev) => {
      const alreadySolved = prev.solvedAptitudeIds.includes(questionId);
      const newSolved = (isCorrect && !alreadySolved) ? [...prev.solvedAptitudeIds, questionId] : prev.solvedAptitudeIds;
      const newAptScore = isCorrect ? Math.min(100, prev.moduleScores.aptitude + (alreadySolved ? 0 : 3)) : prev.moduleScores.aptitude;

      const updatedModuleScores = {
        ...prev.moduleScores,
        aptitude: newAptScore,
      };

      const updatedProfile: StudentProfile = {
        ...prev,
        xpPoints: prev.xpPoints + xpGain,
        solvedAptitudeIds: newSolved,
        moduleScores: updatedModuleScores,
      };

      const { overall } = calculateReadinessScore(updatedProfile);
      updatedProfile.readinessScore = overall;

      return updatedProfile;
    });
  };

  // Handler for solving a SQL challenge
  const handleSqlCompleted = (challengeId: string, xpGain: number) => {
    setProfile((prev) => {
      const alreadySolved = prev.solvedSqlIds.includes(challengeId);
      const newSolved = alreadySolved ? prev.solvedSqlIds : [...prev.solvedSqlIds, challengeId];
      const newSqlScore = Math.min(100, prev.moduleScores.sql + (alreadySolved ? 0 : 10));

      const updatedModuleScores = {
        ...prev.moduleScores,
        sql: newSqlScore,
      };

      const updatedProfile: StudentProfile = {
        ...prev,
        xpPoints: prev.xpPoints + (alreadySolved ? 20 : xpGain),
        solvedSqlIds: newSolved,
        moduleScores: updatedModuleScores,
      };

      const { overall } = calculateReadinessScore(updatedProfile);
      updatedProfile.readinessScore = overall;

      return updatedProfile;
    });
  };

  // Handler for mastering a flashcard
  const handleFlashcardMastered = (flashcardId: string) => {
    setProfile((prev) => {
      const alreadyMastered = prev.masteredFlashcardIds.includes(flashcardId);
      const newMastered = alreadyMastered ? prev.masteredFlashcardIds : [...prev.masteredFlashcardIds, flashcardId];
      const newCsScore = Math.min(100, prev.moduleScores.coreCS + (alreadyMastered ? 0 : 5));

      const updatedModuleScores = {
        ...prev.moduleScores,
        coreCS: newCsScore,
      };

      const updatedProfile: StudentProfile = {
        ...prev,
        xpPoints: prev.xpPoints + (alreadyMastered ? 10 : 25),
        masteredFlashcardIds: newMastered,
        moduleScores: updatedModuleScores,
      };

      const { overall } = calculateReadinessScore(updatedProfile);
      updatedProfile.readinessScore = overall;

      return updatedProfile;
    });
  };

  // Handler for completing a mock interview
  const handleInterviewCompleted = (xpGain: number) => {
    setProfile((prev) => {
      const updatedBadges = prev.badges.map(b => 
        b.id === 'b-interview-ready' ? { ...b, unlocked: true, unlockedAt: new Date().toISOString().split('T')[0] } : b
      );

      const updatedModuleScores = {
        ...prev.moduleScores,
        consistency: Math.min(100, prev.moduleScores.consistency + 5),
      };

      const updatedProfile: StudentProfile = {
        ...prev,
        xpPoints: prev.xpPoints + xpGain,
        badges: updatedBadges,
        moduleScores: updatedModuleScores,
      };

      const { overall } = calculateReadinessScore(updatedProfile);
      updatedProfile.readinessScore = overall;

      return updatedProfile;
    });
  };

  // USER REQUEST: Show Login / Register page first
  if (!authUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={setUserRole}
        profile={profile}
        authUser={authUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main App Content View Container */}
      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 transition-all ${
        (currentTab === 'dsa' || currentTab === 'sql' || currentTab === 'admin') 
          ? 'max-w-[1720px]' 
          : 'max-w-7xl'
      }`}>
        {currentTab === 'dashboard' && (
          <DashboardView
            profile={profile}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'dsa' && (
          <DsaPlatform
            profile={profile}
            onProblemSolved={handleProblemSolved}
            problemsList={dsaProblems}
          />
        )}

        {currentTab === 'aptitude' && (
          <AptitudeModule
            profile={profile}
            onQuestionCompleted={handleAptitudeCompleted}
            questionsList={aptitudeQuestions}
          />
        )}

        {currentTab === 'sql' && (
          <SqlPractice
            profile={profile}
            onChallengeSolved={handleSqlCompleted}
            challengesList={sqlChallenges}
            customTables={customSqlTables}
          />
        )}

        {currentTab === 'core-cs' && (
          <CoreCSModule
            profile={profile}
            onFlashcardMastered={handleFlashcardMastered}
            flashcardsList={flashcardsList}
          />
        )}

        {currentTab === 'mock-interview' && (
          <MockInterviewModule
            profile={profile}
          />
        )}

        {currentTab === 'resume' && (
          <ResumeBuilder
            profile={profile}
          />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardView
            profile={profile}
          />
        )}

        {currentTab === 'admin' && authUser.role === 'admin' && (
          <AdminDashboard
            onBatchUpdateStudentPortal={handleBatchUpdateStudentPortal}
          />
        )}
      </main>

      {/* Switch Account Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        authUser={authUser}
        onLoginSuccess={handleLoginSuccess}
        onSignOut={handleSignOut}
      />

      {/* Clean White & Black Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">PlacePrep.AI</span>
            <span>•</span>
            <span>Campus Placement Preparation & Ingestion Platform</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <span>Signed in as: <strong className="text-slate-900">{authUser.name}</strong> ({authUser.role})</span>
            <span>•</span>
            <button 
              onClick={handleSignOut}
              className="text-slate-700 hover:text-slate-900 underline cursor-pointer font-bold"
            >
              Sign Out
            </button>
            {authUser.role !== 'admin' ? (
              <>
                <span>•</span>
                <span>Readiness Score: <strong className="text-slate-900">{profile.readinessScore}/100</strong></span>
              </>
            ) : (
              <>
                <span>•</span>
                <span className="font-mono text-slate-700">Database: <strong>data/store.json</strong></span>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
