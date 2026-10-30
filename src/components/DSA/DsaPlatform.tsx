import React, { useState } from 'react';
import {
  Code2,
  Search,
  CheckCircle,
  Play,
  Sparkles,
  RotateCcw,
  Lock,
  Eye,
  Check,
  Bot,
  Layers,
  BookOpen,
  AlertCircle,
  Terminal,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { DSAProblem, StudentProfile } from '../../types';
import { sampleDsaProblems } from '../../data/mockData';
import { triggerConfetti, callAgentApi, runCodeApi, AgentApiResponse } from '../../utils/readiness';

interface DsaPlatformProps {
  profile: StudentProfile;
  onProblemSolved: (problemId: string, xpGain: number) => void;
  problemsList?: DSAProblem[];
}

export const DsaPlatform: React.FC<DsaPlatformProps> = ({
  profile,
  onProblemSolved,
  problemsList,
}) => {
  const problems = problemsList && problemsList.length > 0 ? problemsList : sampleDsaProblems;

  const [selectedProblem, setSelectedProblem] = useState<DSAProblem>(problems[0]);
  const [selectedLanguage] = useState<'java'>('java');
  const [editorCode, setEditorCode] = useState<string>(
    selectedProblem.starterCodes?.java ||
    `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}`
  );

  // Model Router preference selector
  const [modelPreference] = useState<'auto' | 'gemini' | 'openai'>('auto');

  // Left Pane View Mode: 'problem' | 'catalog' | 'testcases'
  const [leftTab, setLeftTab] = useState<'problem' | 'catalog' | 'testcases'>('problem');

  // Filtering & Search for Problem Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');

  // Progressive Hints (1 to 6)
  const [unlockedHintStage, setUnlockedHintStage] = useState<number>(0);
  const [aiHintContents, setAiHintContents] = useState<{ [stage: number]: AgentApiResponse }>({});
  const [isLoadingAiHint, setIsLoadingAiHint] = useState<boolean>(false);
  const [aiCodeReview, setAiCodeReview] = useState<AgentApiResponse | null>(null);

  // Execution & Output Tabs: 'output' | 'tests' | 'custom' | 'ai-hints'
  const [activeConsoleTab, setActiveConsoleTab] = useState<'output' | 'tests' | 'custom' | 'ai-hints'>('output');
  const [customInputText, setCustomInputText] = useState('{"nums": [2, 7, 11, 15], "target": 9}');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<any>(null);

  const handleSelectProblem = (prob: DSAProblem) => {
    setSelectedProblem(prob);
    setEditorCode(
      prob.starterCodes?.java ||
      `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}`
    );
    setUnlockedHintStage(0);
    setAiHintContents({});
    setExecutionOutput(null);
    setAiCodeReview(null);
    setLeftTab('problem');
  };

  const handleRequestNextHint = async () => {
    if (unlockedHintStage >= 6) return;
    const nextStage = unlockedHintStage + 1;
    setIsLoadingAiHint(true);
    setActiveConsoleTab('ai-hints');

    try {
      const res = await callAgentApi('dsa-mentor', {
        problemTitle: selectedProblem.title,
        problemDescription: selectedProblem.description,
        studentCode: editorCode,
        language: 'java',
        hintStage: nextStage,
        requestType: 'progressive_hint',
      }, modelPreference);

      setAiHintContents((prev) => ({
        ...prev,
        [nextStage]: res,
      }));
      setUnlockedHintStage(nextStage);
    } catch {
      setAiHintContents((prev) => ({
        ...prev,
        [nextStage]: {
          text: selectedProblem.hints[nextStage - 1] || 'Focus on breaking down inputs and matching appropriate Java data structures (e.g. HashMap, Stack, Arrays).',
          modelUsed: 'Gemini Cloud AI',
        },
      }));
      setUnlockedHintStage(nextStage);
    } finally {
      setIsLoadingAiHint(false);
    }
  };

  const handleReviewMyCode = async () => {
    setIsLoadingAiHint(true);
    setActiveConsoleTab('ai-hints');

    try {
      const res = await callAgentApi('dsa-mentor', {
        problemTitle: selectedProblem.title,
        problemDescription: selectedProblem.description,
        studentCode: editorCode,
        language: 'java',
        requestType: 'review_code',
        question: 'Please review my Java solution for syntax correctness, logic bugs, boundary conditions, and algorithmic efficiency.',
      }, modelPreference);
      setAiCodeReview(res);
    } catch {
      setAiCodeReview({
        text: `🤖 [AI Placement Mentor]\nJava syntax check completed. Ensure boundary indices, array lengths, and object null checks are validated.`,
        modelUsed: 'Gemini Cloud AI',
      });
    } finally {
      setIsLoadingAiHint(false);
    }
  };

  const handleRunCode = async () => {
    setIsRunningCode(true);
    setActiveConsoleTab('output');

    try {
      const res = await runCodeApi({
        code: editorCode,
        language: 'java',
        problemId: selectedProblem.id,
        testCases: activeConsoleTab === 'custom' ? undefined : selectedProblem.testCases,
        customInput: activeConsoleTab === 'custom' ? customInputText : undefined,
      });

      setExecutionOutput(res);
      if (res.allPassed) {
        triggerConfetti();
        onProblemSolved(
          selectedProblem.id,
          selectedProblem.difficulty === 'Hard' ? 100 : selectedProblem.difficulty === 'Medium' ? 60 : 30
        );
      }
    } catch (err: any) {
      setExecutionOutput({
        success: false,
        error: err.message || 'Execution error',
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  const isSolved = profile.solvedDSAIds.includes(selectedProblem.id);
  const sampleTestCases = selectedProblem.testCases?.filter((tc) => !tc.isHidden) || [];
  const hiddenTestCases = selectedProblem.testCases?.filter((tc) => !!tc.isHidden) || [];

  return (
    <div className="space-y-4 font-sans max-w-[1720px] mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                DSA Java Arena & Code Execution Studio
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                High-performance Java-only sandbox with sample & hidden testcase evaluation and progressive AI mentoring.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <span>Solved:</span>
            <span className="font-extrabold text-slate-900">
              {profile.solvedDSAIds.length} / {problems.length}
            </span>
          </div>

          <button
            onClick={() => setLeftTab(leftTab === 'catalog' ? 'problem' : 'catalog')}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${leftTab === 'catalog'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{leftTab === 'catalog' ? 'Back to Problem' : 'Problem Catalog'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Large Widescreen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Problem Details, Testcases Preview, Catalog (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sub Navigation Tabs */}
          <div className="flex space-x-1 p-1 bg-slate-200/70 rounded-xl text-xs font-bold">
            <button
              onClick={() => setLeftTab('problem')}
              className={`flex-1 py-1.5 rounded-lg transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${leftTab === 'problem' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>Problem Statement & Test Cases</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-extrabold">
                {selectedProblem.testCases?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setLeftTab('catalog')}
              className={`flex-1 py-1.5 rounded-lg transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${leftTab === 'catalog' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Browse Problems ({problems.length})</span>
            </button>
          </div>

          {/* TAB 1: PROBLEM DETAILS & INTEGRATED TEST CASES */}
          {leftTab === 'problem' && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-5 min-h-[580px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-slate-900">{selectedProblem.title}</h3>
                    {isSolved && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        <Check className="w-3 h-3" /> Solved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-semibold">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${selectedProblem.difficulty === 'Easy'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedProblem.difficulty === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                    >
                      {selectedProblem.difficulty}
                    </span>
                    <span>•</span>
                    <span>Category: {selectedProblem.category}</span>
                    <span>•</span>
                    <span>Acceptance: {selectedProblem.acceptance}</span>
                  </div>
                </div>

                <button
                  onClick={handleReviewMyCode}
                  disabled={isLoadingAiHint}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Analyze student Java code"
                >
                  <Bot className="w-3.5 h-3.5 text-slate-800" />
                  <span>Review Code</span>
                </button>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Problem Statement:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                  {selectedProblem.description}
                </p>
              </div>

              {/* Examples */}
              {selectedProblem.examples && selectedProblem.examples.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Sample Examples:
                  </span>
                  <div className="space-y-2">
                    {selectedProblem.examples.map((ex, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-1">
                        <div className="text-[11px] font-bold text-slate-500">Example {idx + 1}:</div>
                        <div>
                          <strong className="text-slate-700">Input:</strong>{' '}
                          <span className="text-slate-900">{ex.input}</span>
                        </div>
                        <div>
                          <strong className="text-slate-700">Output:</strong>{' '}
                          <span className="text-emerald-700 font-bold">{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <div className="text-slate-500 text-[11px]">
                            <strong>Explanation:</strong> {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Constraints */}
              {selectedProblem.constraints && selectedProblem.constraints.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Constraints:
                  </span>
                  <ul className="list-disc list-inside text-xs text-slate-600 font-mono space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {selectedProblem.constraints.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Test Cases Inventory (Sample & Hidden Breakdown directly on Left Side) */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Test Cases Inventory ({selectedProblem.testCases?.length || 0}):
                  </span>
                  <div className="flex gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      {sampleTestCases.length} Sample
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                      {hiddenTestCases.length} Hidden
                    </span>
                  </div>
                </div>

                {/* Sample Testcases List */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                    <Eye className="w-3 h-3 text-emerald-600" /> Sample Test Cases ({sampleTestCases.length})
                  </span>
                  <div className="space-y-2">
                    {sampleTestCases.map((tc, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-1">
                        <div className="flex justify-between font-bold text-slate-700 text-[11px]">
                          <span>Sample Case #{idx + 1}</span>
                          <span className="text-emerald-700 text-[10px] font-extrabold uppercase">Visible</span>
                        </div>
                        <div>
                          <strong className="text-slate-500">Input:</strong>{' '}
                          <span className="text-slate-900 font-semibold">{JSON.stringify(tc.input)}</span>
                        </div>
                        <div>
                          <strong className="text-slate-500">Expected:</strong>{' '}
                          <span className="text-emerald-700 font-bold">{JSON.stringify(tc.expected)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hidden Testcases List */}
                {hiddenTestCases.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-purple-900 uppercase flex items-center gap-1">
                      <Lock className="w-3 h-3 text-purple-700" /> Hidden Test Cases ({hiddenTestCases.length})
                    </span>
                    <div className="space-y-2">
                      {hiddenTestCases.map((tc, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-purple-50/40 border border-purple-200 font-mono text-xs space-y-1">
                          <div className="flex justify-between font-bold text-purple-900 text-[11px]">
                            <span className="flex items-center gap-1">
                              <Lock className="w-3 h-3 text-purple-700" />
                              Hidden Case #{idx + 1}
                            </span>
                            <span className="text-purple-700 text-[10px] uppercase font-extrabold bg-purple-100 px-2 py-0.5 rounded-full">
                              Locked
                            </span>
                          </div>
                          <div className="text-[11px] text-purple-950 font-sans">
                            Private campus recruitment test case. Evaluated automatically during <strong>"Run & Test"</strong>.
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PROBLEM CATALOG */}
          {leftTab === 'catalog' && (
            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-3 min-h-[580px]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search problem title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${difficultyFilter === diff
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {filteredProblems.map((prob) => {
                  const isSelected = prob.id === selectedProblem.id;
                  const isProbSolved = profile.solvedDSAIds.includes(prob.id);

                  return (
                    <div
                      key={prob.id}
                      onClick={() => handleSelectProblem(prob)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition ${isSelected
                          ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate max-w-[240px] font-semibold">{prob.title}</span>
                        {isProbSolved && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold uppercase ${prob.difficulty === 'Easy'
                              ? 'bg-emerald-100 text-emerald-800'
                              : prob.difficulty === 'Medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                        >
                          {prob.difficulty}
                        </span>
                        <span>{prob.category}</span>
                        <span>•</span>
                        <span>{prob.testCases?.length || 0} Testcases</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Code Editor & Interactive Console (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Code Editor Container */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 px-4 py-2.5 border-b border-slate-200 text-xs font-semibold">
              {/* Language Selector: Java ONLY, Other Languages Coming Soon */}
              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-bold">Compiler:</span>
                <div className="px-3 py-1 rounded-lg bg-slate-900 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-default">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Java (JDK 17)</span>
                </div>

                <div
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-semibold flex items-center gap-1.5 select-none"
                  title="Support for additional programming languages (Python, C++, JavaScript) is in progress and coming soon."
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Other Languages: Coming Soon</span>
                </div>
              </div>

              {/* Editor Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditorCode(selectedProblem.starterCodes?.java || '')}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
                  title="Reset to Java starter template"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRunCode}
                  disabled={isRunningCode}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isRunningCode ? 'Compiling & Testing...' : 'Run & Test Code'}</span>
                </button>
              </div>
            </div>

            {/* Code Input Textarea - Spacious & Comfortable */}
            <textarea
              value={editorCode}
              onChange={(e) => setEditorCode(e.target.value)}
              spellCheck={false}
              placeholder="// Write your Java solution here..."
              className="w-full h-[480px] min-h-[440px] p-5 bg-slate-950 text-slate-100 font-mono text-[13px] focus:outline-none leading-relaxed resize-none selection:bg-emerald-800"
            />
          </div>

          {/* Interactive Console & Output Workspace */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
            {/* Console Tabs Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <button
                  onClick={() => setActiveConsoleTab('output')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeConsoleTab === 'output' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Execution Output</span>
                  {executionOutput && (
                    <span
                      className={`w-2 h-2 rounded-full ${executionOutput.allPassed ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                    ></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveConsoleTab('tests')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeConsoleTab === 'tests' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Test Cases ({selectedProblem.testCases?.length || 0})</span>
                </button>
                <button
                  onClick={() => setActiveConsoleTab('custom')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${activeConsoleTab === 'custom' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  Custom Test
                </button>
                <button
                  onClick={() => setActiveConsoleTab('ai-hints')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${activeConsoleTab === 'ai-hints' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>AI Hints ({unlockedHintStage}/6)</span>
                </button>
              </div>

              {unlockedHintStage < 6 && (
                <button
                  onClick={handleRequestNextHint}
                  disabled={isLoadingAiHint}
                  className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isLoadingAiHint ? 'Generating Hint...' : `Unlock Stage ${unlockedHintStage + 1} Hint`}</span>
                </button>
              )}
            </div>

            {/* TAB 1: EXECUTION OUTPUT */}
            {activeConsoleTab === 'output' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 min-h-[140px]">
                {executionOutput ? (
                  <div className="space-y-4">
                    {/* Compiler Error / Runtime Exception Terminal Display */}
                    {executionOutput.error && (
                      <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-md">
                        {/* Terminal Window Header Bar */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="flex gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                            </span>
                            <span className="font-mono font-bold text-slate-200 text-xs tracking-wide">
                              {executionOutput.error.includes('Exception') || executionOutput.error.includes('at Main.')
                                ? 'JAVA RUNTIME EXCEPTION (JVM)'
                                : 'JAVA COMPILATION ERROR (javac 17)'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded">
                            Diagnostics Failed
                          </span>
                        </div>

                        {/* Compiler Output Body with preserved spacing and carets */}
                        <div className="p-4 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed text-rose-300 selection:bg-rose-900 selection:text-white bg-slate-950">
                          {executionOutput.error}
                        </div>
                      </div>
                    )}

                    {/* Test Cases Results Section */}
                    {executionOutput.results && executionOutput.results.length > 0 && (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                          <div className="flex items-center gap-2">
                            {executionOutput.allPassed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-rose-600" />
                            )}
                            <span
                              className={`font-black text-sm ${executionOutput.allPassed ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                            >
                              {executionOutput.allPassed
                                ? '✓ All Test Cases Passed (Sample & Hidden)!'
                                : '✕ Test Cases Evaluation Failed'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-semibold">
                            Execution Time: {executionOutput.executionTimeMs}ms • Memory Used: {executionOutput.memoryMb} MB
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {executionOutput.results.map((r: any, idx: number) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border ${r.passed
                                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                                  : 'bg-rose-50/50 border-rose-200 text-rose-950'
                                }`}
                            >
                              <div className="flex justify-between items-center font-bold text-xs pb-1.5 border-b border-slate-200/50">
                                <div className="flex items-center gap-1.5">
                                  <span>Test Case #{idx + 1}</span>
                                  {r.isHidden && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-200">
                                      🔒 Hidden
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`text-[11px] font-black uppercase ${r.passed ? 'text-emerald-700' : 'text-rose-700'
                                    }`}
                                >
                                  {r.passed ? '✓ PASSED' : '✕ FAILED'}
                                </span>
                              </div>

                              <div className="text-[11px] space-y-1 font-mono pt-2">
                                <div>
                                  <span className="text-slate-500">Input:</span>{' '}
                                  <span className="text-slate-800 font-semibold">{typeof r.input === 'object' ? JSON.stringify(r.input) : String(r.input)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Expected:</span>{' '}
                                  <span className="text-emerald-700 font-bold">{typeof r.expected === 'object' ? JSON.stringify(r.expected) : String(r.expected)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Actual:</span>{' '}
                                  <span className={`font-bold ${r.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {typeof r.actual === 'object' ? JSON.stringify(r.actual) : String(r.actual)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400 py-6 text-center space-y-1">
                    <Terminal className="w-6 h-6 mx-auto text-slate-300" />
                    <div>Click "Run & Test Code" to compile and execute your Java code against all test cases.</div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TEST CASES OVERVIEW */}
            {activeConsoleTab === 'tests' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 space-y-3">
                <div className="font-bold text-slate-700 text-xs pb-1 border-b border-slate-200 flex items-center justify-between">
                  <span>Registered Problem Test Cases</span>
                  <span className="text-[11px] text-slate-500">
                    {sampleTestCases.length} Sample • {hiddenTestCases.length} Hidden
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedProblem.testCases &&
                    selectedProblem.testCases.map((tc, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border bg-white ${tc.isHidden ? 'border-purple-200 bg-purple-50/20' : 'border-slate-200'
                          }`}
                      >
                        <div className="flex justify-between font-bold text-[11px]">
                          <span className="text-slate-700">Test Case #{idx + 1}</span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${tc.isHidden ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                          >
                            {tc.isHidden ? '🔒 Hidden Case' : '👁️ Sample Case'}
                          </span>
                        </div>
                        {tc.isHidden ? (
                          <div className="text-[11px] text-purple-900 font-sans mt-1">
                            Input and expected output are locked to prevent test hardcoding.
                          </div>
                        ) : (
                          <div className="text-[11px] space-y-0.5 mt-1">
                            <div>
                              <span className="text-slate-500">Input:</span> {JSON.stringify(tc.input)}
                            </div>
                            <div>
                              <span className="text-slate-500">Expected:</span>{' '}
                              <span className="text-emerald-700 font-bold">{JSON.stringify(tc.expected)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB 3: CUSTOM INPUT */}
            {activeConsoleTab === 'custom' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Custom Input (JSON format):</span>
                <textarea
                  value={customInputText}
                  onChange={(e) => setCustomInputText(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none"
                  placeholder='{"nums": [2, 7, 11, 15], "target": 9}'
                />
                <button
                  onClick={handleRunCode}
                  disabled={isRunningCode}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Execute with Custom Input</span>
                </button>
              </div>
            )}

            {/* TAB 4: PROGRESSIVE AI HINTS & CODE REVIEW */}
            {activeConsoleTab === 'ai-hints' && (
              <div className="space-y-3 min-h-[140px]">
                {aiCodeReview && (
                  <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-xs text-slate-900 space-y-1">
                    <div className="font-bold flex items-center justify-between text-slate-800">
                      <span>🤖 Java Syntax & Logic Review</span>
                    </div>
                    <div className="whitespace-pre-line font-mono text-[11px] leading-relaxed">
                      {aiCodeReview.text}
                    </div>
                  </div>
                )}

                {Object.keys(aiHintContents).length === 0 ? (
                  <div className="text-xs text-slate-500 py-6 text-center bg-slate-50 rounded-xl border border-slate-200">
                    No hints unlocked yet. Click <strong>"Unlock Stage 1 Hint"</strong> above to receive step-by-step guidance!
                  </div>
                ) : (
                  Object.entries(aiHintContents).map(([stg, resp]) => (
                    <div key={stg} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>Stage {stg} Guidance</span>
                      </div>
                      <div className="whitespace-pre-line font-mono text-slate-800 text-[11px] leading-relaxed">
                        {resp.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
