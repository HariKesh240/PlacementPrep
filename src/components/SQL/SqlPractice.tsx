import React, { useState } from 'react';
import {
  Database,
  Play,
  Sparkles,
  RotateCcw,
  Table,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Bot,
  Layers,
  Lock,
  Eye,
  Check,
  XCircle,
  Terminal
} from 'lucide-react';
import { SQLChallenge, StudentProfile, SqlTestCase, CustomSqlTable } from '../../types';
import { sampleSqlChallenges, initialCustomSqlTables } from '../../data/mockData';
import { triggerConfetti, runSqlApi, callAgentApi, AgentApiResponse } from '../../utils/readiness';

// Normalizes SQL query for case-insensitive and whitespace-insensitive comparison
function normalizeSqlQuery(q: string): string {
  if (!q) return '';
  return q
    .toLowerCase()
    .replace(/--.*$/gm, '') // remove line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments
    .replace(/;/g, '') // remove trailing semicolons
    .replace(/\s+/g, ' ') // collapse multi-spaces, newlines, tabs
    .trim();
}

interface SqlPracticeProps {
  profile: StudentProfile;
  onChallengeSolved: (challengeId: string, xpGain: number) => void;
  challengesList?: SQLChallenge[];
  customTables?: CustomSqlTable[];
}

export const SqlPractice: React.FC<SqlPracticeProps> = ({ profile, onChallengeSolved, challengesList, customTables }) => {
  const tables = customTables && customTables.length > 0 ? customTables : initialCustomSqlTables;
  const challenges = challengesList && challengesList.length > 0 ? challengesList : sampleSqlChallenges;
  const [selectedChallenge, setSelectedChallenge] = useState<SQLChallenge>(challenges[0]);
  const [sqlQuery, setSqlQuery] = useState<string>(selectedChallenge.starterQuery);

  // Model Router preference selector
  const [modelPreference] = useState<'auto' | 'gemini' | 'openai'>('auto');

  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: any[];
    executionTimeMs: string;
    rowCount: number;
  } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isResultCorrect, setIsResultCorrect] = useState<boolean | null>(null);
  const [queryMatchStatus, setQueryMatchStatus] = useState<{
    isExactQueryMatch: boolean;
    isOutputMatch: boolean;
  } | null>(null);

  // Console / Output Active Tab: 'table' | 'mentor'
  const [activeTab, setActiveTab] = useState<'table' | 'mentor'>('table');

  // AI SQL Mentor guidance
  const [aiMentorGuidance, setAiMentorGuidance] = useState<AgentApiResponse | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const handleSelectChallenge = (c: SQLChallenge) => {
    setSelectedChallenge(c);
    setSqlQuery(c.starterQuery);
    setQueryResult(null);
    setQueryError(null);
    setIsResultCorrect(null);
    setQueryMatchStatus(null);
    setAiMentorGuidance(null);
    setActiveTab('table');
  };

  const handleRunSql = async () => {
    setIsRunning(true);
    setQueryError(null);
    setQueryResult(null);
    setIsResultCorrect(null);
    setQueryMatchStatus(null);

    try {
      const res = await runSqlApi(sqlQuery);
      if (res.success) {
        setQueryResult({
          columns: res.columns || [],
          rows: res.rows || [],
          executionTimeMs: res.executionTimeMs || '0.5',
          rowCount: res.rowCount || 0,
        });

        // Evaluate query match: check if written SQL query matches expected query (ignoring case & whitespace)
        // OR produces the exact expected dataset output
        const normalizedStudent = normalizeSqlQuery(sqlQuery);
        const normalizedExpected = normalizeSqlQuery(selectedChallenge.expectedQuery);
        const isQueryExact = normalizedStudent === normalizedExpected;

        let isOutputExact = false;
        try {
          const expRes = await runSqlApi(selectedChallenge.expectedQuery);
          if (expRes.success && expRes.rows) {
            isOutputExact = JSON.stringify(res.rows) === JSON.stringify(expRes.rows);
          }
        } catch { }

        const passed = isQueryExact || isOutputExact;
        setIsResultCorrect(passed);
        setQueryMatchStatus({
          isExactQueryMatch: isQueryExact,
          isOutputMatch: isOutputExact,
        });

        if (passed) {
          triggerConfetti();
          onChallengeSolved(
            selectedChallenge.id,
            selectedChallenge.difficulty === 'Hard' ? 80 : selectedChallenge.difficulty === 'Medium' ? 50 : 30
          );
        }
      } else {
        setQueryError(res.error || 'SQL Execution failed.');
      }
    } catch (err: any) {
      setQueryError(err.message || 'Execution error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleConsultAiMentor = async () => {
    setIsLoadingAi(true);
    setActiveTab('mentor');
    try {
      const res = await callAgentApi('sql-mentor', {
        challengeTitle: selectedChallenge.title,
        schemaDescription: selectedChallenge.relevantTables.join(', '),
        studentQuery: sqlQuery,
        errorOutput: queryError || undefined,
      }, modelPreference);
      setAiMentorGuidance(res);
    } catch {
      setAiMentorGuidance({
        text: `🤖 [AI Placement Mentor]\nVerify SELECT column names, verify table joins on foreign keys, and ensure GROUP BY includes all non-aggregated attributes.`,
        modelUsed: 'Gemini Cloud AI',
      });
    } finally {
      setIsLoadingAi(false);
    }
  };

  const isSolved = profile.solvedSqlIds.includes(selectedChallenge.id);

  return (
    <div className="space-y-4 font-sans max-w-[1720px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                SQL Practice & In-Memory AlaSQL Arena
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Execute queries against live database tables with case-insensitive expected query matching and instant feedback.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <span>Challenges Solved:</span>
            <span className="font-extrabold text-slate-900">
              {profile.solvedSqlIds.length} / {challenges.length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Navigator & Database Tables (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
              <span>SQL Challenges ({challenges.length})</span>
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {challenges.map((c) => {
                const isSelected = c.id === selectedChallenge.id;
                const isCSolved = profile.solvedSqlIds.includes(c.id);

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectChallenge(c)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${isSelected
                        ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate max-w-[220px]">{c.title}</span>
                      {isCSolved && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{c.topic}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-bold uppercase ${c.difficulty === 'Easy'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.difficulty === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                      >
                        {c.difficulty}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Database Tables Schema Viewer */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Table className="w-4 h-4 text-slate-700" />
                Available Database Tables & Schema
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                {tables.length} table{tables.length !== 1 ? 's' : ''}
              </span>
            </span>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800 space-y-2 max-h-52 overflow-y-auto">
              {tables.length === 0 ? (
                <div className="text-slate-500 italic text-[11px]">No tables registered yet. Admin can add tables in Admin Portal.</div>
              ) : (
                tables.map((t) => (
                  <div key={t.id || t.tableName} className="border-b border-slate-200/60 pb-1.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">• {t.tableName}</span>
                      <span className="text-[10px] text-slate-500 font-sans">({t.rows?.length || 0} rows)</span>
                    </div>
                    <div className="text-slate-500 text-[10px] pl-2 break-all">
                      ({t.columns?.map(c => `${c.name} ${c.type}`).join(', ') || 'no columns'})
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Problem Statement, SQL Editor & Result Arena (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Challenge Description Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  {selectedChallenge.title}
                  {isSolved && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      <Check className="w-3 h-3" /> Solved
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>Topic: <strong className="text-slate-700">{selectedChallenge.topic}</strong></span>
                  <span>•</span>
                  <span>Difficulty: <strong className="text-slate-700">{selectedChallenge.difficulty}</strong></span>
                  <span>•</span>
                  <span>
                    Validation: <strong className="text-slate-700">Case-Insensitive Query Match</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={handleConsultAiMentor}
                disabled={isLoadingAi}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                <span>{isLoadingAi ? 'Analyzing Query...' : 'Consult SQL Mentor'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
              {selectedChallenge.description}
            </p>
          </div>

          {/* SQL Editor Card - Large & Comfortable */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between bg-slate-100 px-4 py-2.5 border-b border-slate-200 text-xs font-semibold">
              <span className="text-slate-800 font-mono font-bold">SQL Query Workspace (AlaSQL Engine)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSqlQuery(selectedChallenge.starterQuery)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
                  title="Reset Query"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRunSql}
                  disabled={isRunning}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isRunning ? 'Executing SQL...' : 'Run & Test Query'}</span>
                </button>
              </div>
            </div>

            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              spellCheck={false}
              placeholder="SELECT ... FROM ..."
              className="w-full h-64 min-h-[240px] p-4 bg-slate-950 text-emerald-300 font-mono text-[13px] focus:outline-none leading-relaxed resize-none selection:bg-slate-700"
            />
          </div>

          {/* Results & Test Cases Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
            {/* Header Tabs */}
            {/* Output Tabs Navigation: Result & Mentor */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('table')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'table' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Query Execution & Match Result</span>
                </button>
                <button
                  onClick={() => setActiveTab('mentor')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'mentor' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>SQL Mentor</span>
                </button>
              </div>
            </div>

            {queryError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>{queryError}</div>
              </div>
            )}

            {/* TAB 1: QUERY RESULT TABLE & QUERY MATCH STATUS */}
            {activeTab === 'table' && (
              <div>
                {queryResult ? (
                  <div className="space-y-3">
                    {isResultCorrect !== null && (
                      <div
                        className={`p-3.5 rounded-xl border font-bold text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${isResultCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-amber-50 border-amber-300 text-amber-950'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {isResultCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                          )}
                          <div>
                            <div className="font-extrabold text-sm">
                              {isResultCorrect
                                ? (queryMatchStatus?.isExactQueryMatch
                                  ? '✓ SQL Query Matches Expected Solution Exactly!'
                                  : '✓ Query Produced Expected Dataset Output!')
                                : 'Query executed successfully, but does not match expected query solution.'}
                            </div>
                            <div className="text-[11px] font-sans font-normal opacity-90 mt-0.5">
                              {isResultCorrect
                                ? 'Your query matches the problem ground truth. Marks and XP awarded.'
                                : 'Please review your SELECT columns, JOIN conditions, or WHERE filters.'}
                            </div>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider self-start sm:self-auto shrink-0 ${isResultCorrect ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                          }`}>
                          {isResultCorrect ? 'Passed ✓' : 'Mismatch ✕'}
                        </span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 font-mono flex justify-between">
                      <span>Rows returned: {queryResult.rowCount}</span>
                      <span>Execution time: {queryResult.executionTimeMs}ms</span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-xs text-left text-slate-800">
                        <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200 uppercase text-[10px]">
                          <tr>
                            {queryResult.columns.map((col) => (
                              <th key={col} className="px-3.5 py-2.5 border-r border-slate-200 last:border-0">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white font-mono text-[11px]">
                          {queryResult.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              {queryResult.columns.map((col) => (
                                <td key={col} className="px-3.5 py-2 border-r border-slate-200 last:border-0 whitespace-nowrap">
                                  {String(row[col] !== undefined ? row[col] : '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  !queryError && (
                    <div className="text-xs text-slate-400 py-6 text-center space-y-1">
                      <Terminal className="w-6 h-6 mx-auto text-slate-300" />
                      <div>Click "Run & Test Query" to execute your SQL query and match against expected solution.</div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* TAB 2: SQL MENTOR */}
            {activeTab === 'mentor' && (
              <div className="space-y-3 font-mono text-xs">
                {aiMentorGuidance ? (
                  <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-900 space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-slate-900" />
                        SQL Mentor Guidance
                      </span>
                    </div>
                    <div className="whitespace-pre-line leading-relaxed text-[11px] font-mono">
                      {aiMentorGuidance.text}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 py-6 text-center font-sans text-xs">
                    Click "Consult SQL Mentor" to get automated guidance on joins, aggregation, and grouping.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
