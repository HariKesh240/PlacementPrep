import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  Calculator,
  ChevronRight,
  ShieldCheck,
  Bot,
  Brain,
  Cpu,
  Clock,
  Flag,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { AptitudeQuestion, StudentProfile, AptitudeSection } from '../../types';
import { sampleAptitudeQuestions } from '../../data/mockData';
import { triggerConfetti, callAgentApi, AgentApiResponse } from '../../utils/readiness';

interface AptitudeModuleProps {
  profile: StudentProfile;
  onQuestionCompleted: (questionId: string, isCorrect: boolean, xpGain: number) => void;
  questionsList?: AptitudeQuestion[];
}

export const AptitudeModule: React.FC<AptitudeModuleProps> = ({
  profile,
  onQuestionCompleted,
  questionsList,
}) => {
  const allQuestions = questionsList && questionsList.length > 0 ? questionsList : sampleAptitudeQuestions;

  // Mode: Practice vs Timed Placement Exam
  const [examMode, setExamMode] = useState<'practice' | 'exam'>('practice');

  const [activeSection, setActiveSection] = useState<'All' | AptitudeSection>('All');
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showFormula, setShowFormula] = useState(false);

  // Model Router preference selector
  const [modelPreference, setModelPreference] = useState<'auto' | 'gemini' | 'openai'>('auto');

  // Socratic AI Tutor states
  const [aiTutorHintLevel, setAiTutorHintLevel] = useState<number>(0);
  const [aiTutorResponse, setAiTutorResponse] = useState<AgentApiResponse | null>(null);
  const [isLoadingAiTutor, setIsLoadingAiTutor] = useState(false);

  // Timed Exam State
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(15 * 60); // 15 mins
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [examScorecard, setExamScorecard] = useState<{
    total: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    score: number;
    accuracy: number;
  } | null>(null);

  const filteredQuestions = allQuestions.filter((q) => {
    if (activeSection === 'All') return true;
    return q.section === activeSection;
  });

  const currentQuestion: AptitudeQuestion | undefined = filteredQuestions[selectedQuestionIndex] || filteredQuestions[0];

  // Timer Effect for Exam Mode
  useEffect(() => {
    if (examMode !== 'exam' || isExamCompleted) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examMode, isExamCompleted, examAnswers]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (idx: number) => {
    if (examMode === 'exam') {
      if (isExamCompleted || !currentQuestion) return;
      setExamAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: idx,
      }));
      return;
    }

    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !currentQuestion) return;

    setIsAnswerSubmitted(true);
    const isCorrect = selectedOption === currentQuestion.correctIndex;
    const xpGain = isCorrect ? 50 : 10;

    if (isCorrect) {
      triggerConfetti();
    }

    onQuestionCompleted(currentQuestion.id, isCorrect, xpGain);
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setShowFormula(false);
    setAiTutorResponse(null);
    setAiTutorHintLevel(0);
    if (selectedQuestionIndex < filteredQuestions.length - 1) {
      setSelectedQuestionIndex((prev) => prev + 1);
    } else {
      setSelectedQuestionIndex(0);
    }
  };

  // Socratic AI Tutor progressive hints
  const handleRequestAiTutorHint = async () => {
    if (!currentQuestion) return;
    const nextHintLevel = aiTutorHintLevel + 1;
    setIsLoadingAiTutor(true);

    try {
      const res = await callAgentApi('aptitude-tutor', {
        questionText: currentQuestion.question,
        topic: currentQuestion.topic,
        options: currentQuestion.options,
        studentAnswer: selectedOption !== null ? currentQuestion.options[selectedOption] : undefined,
        hintLevel: nextHintLevel,
      }, modelPreference);

      setAiTutorResponse(res);
      setAiTutorHintLevel(nextHintLevel);
    } catch (err: any) {
      setAiTutorResponse({
        text: `🤖 [AI Placement Mentor]\nFocus on breaking down the prompt into basic equations before substituting options.`,
        modelUsed: 'Gemini Cloud AI',
      });
      setAiTutorHintLevel(nextHintLevel);
    } finally {
      setIsLoadingAiTutor(false);
    }
  };

  // Exam Mode: Finish & Calculate Score (+1 for correct, -0.25 for incorrect)
  const handleFinishExam = () => {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    filteredQuestions.forEach((q) => {
      const ans = examAnswers[q.id];
      if (ans === undefined) {
        unattempted++;
      } else if (ans === q.correctIndex) {
        correct++;
        onQuestionCompleted(q.id, true, 50);
      } else {
        incorrect++;
        onQuestionCompleted(q.id, false, 10);
      }
    });

    const rawScore = correct * 1 - incorrect * 0.25;
    const totalAttempted = correct + incorrect;
    const accuracy = totalAttempted > 0 ? Math.round((correct / totalAttempted) * 100) : 0;

    setExamScorecard({
      total: filteredQuestions.length,
      correct,
      incorrect,
      unattempted,
      score: Math.max(0, Number(rawScore.toFixed(2))),
      accuracy,
    });
    setIsExamCompleted(true);
    triggerConfetti();
  };

  const handleResetExam = () => {
    setTimeRemainingSeconds(15 * 60);
    setExamAnswers({});
    setMarkedForReview({});
    setIsExamCompleted(false);
    setExamScorecard(null);
    setSelectedQuestionIndex(0);
  };

  const toggleMarkForReview = (qId: string) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const isSolved = currentQuestion ? profile.solvedAptitudeIds.includes(currentQuestion.id) : false;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-slate-900" />
            Aptitude & Logical Reasoning Master
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quantitative Aptitude, Logical Reasoning & Verbal Ability with Socratic AI Mentor & Timed Exam Mode.
          </p>
        </div>

        {/* Mode Selector & Engine Preference */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold">
            <button
              onClick={() => {
                setExamMode('practice');
                setIsExamCompleted(false);
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${examMode === 'practice' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Practice Mode
            </button>
            <button
              onClick={() => {
                setExamMode('exam');
                handleResetExam();
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${examMode === 'exam' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Timed Exam Mode
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            {(['All', 'Quantitative', 'Logical', 'Verbal'] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => {
                  setActiveSection(sec);
                  setSelectedQuestionIndex(0);
                  setSelectedOption(null);
                  setIsAnswerSubmitted(false);
                  setAiTutorResponse(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeSection === sec
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TIMED EXAM SCORECARD MODAL */}
      {examMode === 'exam' && isExamCompleted && examScorecard && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assessment Results</span>
              <h3 className="text-xl font-extrabold text-slate-900">Placement Aptitude Test Scorecard</h3>
            </div>
            <button
              onClick={handleResetExam}
              className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Retake Exam
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-2xl font-black text-slate-900">{examScorecard.score}</div>
              <div className="text-xs font-semibold text-slate-600">Final Score (+1 / -0.25)</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-2xl font-black text-emerald-700">{examScorecard.correct}</div>
              <div className="text-xs font-semibold text-emerald-800">Correct Answers</div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <div className="text-2xl font-black text-rose-700">{examScorecard.incorrect}</div>
              <div className="text-xs font-semibold text-rose-800">Incorrect Answers</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <div className="text-2xl font-black text-blue-700">{examScorecard.accuracy}%</div>
              <div className="text-xs font-semibold text-blue-800">Accuracy Rate</div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-bold text-slate-900">Question-by-Question Review</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {filteredQuestions.map((q, idx) => {
                const userChoice = examAnswers[q.id];
                const isCorrect = userChoice === q.correctIndex;
                const wasAttempted = userChoice !== undefined;

                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-900">Q{idx + 1}: {q.topic}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${!wasAttempted
                          ? 'bg-slate-200 text-slate-700'
                          : isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                        {!wasAttempted ? 'Unattempted' : isCorrect ? 'Correct (+1.0)' : 'Incorrect (-0.25)'}
                      </span>
                    </div>
                    <p className="text-slate-800">{q.question}</p>
                    <div className="pt-1 text-[11px] text-slate-600">
                      <strong>Correct Answer:</strong> {q.options[q.correctIndex]}
                    </div>
                    {q.explanation && (
                      <div className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Question & Arena */}
      {(!isExamCompleted || examMode === 'practice') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Navigator (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Exam Mode Timer Bar */}
            {examMode === 'exam' && (
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <Clock className={`w-5 h-5 ${timeRemainingSeconds < 300 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Exam Timer</div>
                    <div className="text-lg font-mono font-black">{formatTimer(timeRemainingSeconds)}</div>
                  </div>
                </div>
                <button
                  onClick={handleFinishExam}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Submit Exam
                </button>
              </div>
            )}

            <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-800">
                  {examMode === 'exam' ? 'Question Palette' : `Questions (${filteredQuestions.length})`}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {activeSection}
                </span>
              </div>

              {/* Status Legend in Exam Mode */}
              {examMode === 'exam' && (
                <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-slate-600 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-purple-500"></span>
                    <span>Review</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-slate-200"></span>
                    <span>Unvisited</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
                {filteredQuestions.map((q, idx) => {
                  const isCurrent = idx === selectedQuestionIndex;
                  const isAnswered = examMode === 'exam' ? examAnswers[q.id] !== undefined : profile.solvedAptitudeIds.includes(q.id);
                  const isMarked = markedForReview[q.id];

                  let btnColor = 'bg-slate-50 text-slate-700 border-slate-200';
                  if (examMode === 'exam') {
                    if (isMarked) btnColor = 'bg-purple-100 border-purple-400 text-purple-900';
                    else if (isAnswered) btnColor = 'bg-emerald-100 border-emerald-400 text-emerald-900';
                  } else {
                    if (isAnswered) btnColor = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold';
                  }

                  if (isCurrent) {
                    btnColor = 'bg-slate-900 text-white border-slate-900 font-black shadow-xs';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setSelectedQuestionIndex(idx);
                        setSelectedOption(null);
                        setIsAnswerSubmitted(false);
                        setAiTutorResponse(null);
                        setAiTutorHintLevel(0);
                      }}
                      className={`h-10 rounded-xl border text-xs font-bold transition flex items-center justify-center cursor-pointer ${btnColor}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Question Arena (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {currentQuestion && (
              <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                {/* Question Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-xs">
                      Question {selectedQuestionIndex + 1} of {filteredQuestions.length}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px]">
                      {currentQuestion.topic}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px]">
                      {currentQuestion.difficulty}
                    </span>
                  </div>

                  {examMode === 'exam' && (
                    <button
                      onClick={() => toggleMarkForReview(currentQuestion.id)}
                      className={`px-3 py-1 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1 ${markedForReview[currentQuestion.id]
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      {markedForReview[currentQuestion.id] ? 'Marked for Review' : 'Mark for Review'}
                    </button>
                  )}
                </div>

                {/* Question Statement */}
                <div className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
                  {currentQuestion.question}
                </div>

                {/* Options List */}
                <div className="space-y-3">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = examMode === 'exam'
                      ? examAnswers[currentQuestion.id] === idx
                      : selectedOption === idx;

                    let optionStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';

                    if (examMode === 'practice' && isAnswerSubmitted) {
                      if (idx === currentQuestion.correctIndex) {
                        optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
                      } else if (isSelected) {
                        optionStyle = 'bg-rose-50 border-rose-500 text-rose-950';
                      }
                    } else if (isSelected) {
                      optionStyle = 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-white text-slate-900' : 'bg-white border border-slate-200 text-slate-700'
                            }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </div>

                        {examMode === 'practice' && isAnswerSubmitted && idx === currentQuestion.correctIndex && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        )}
                        {examMode === 'practice' && isAnswerSubmitted && isSelected && idx !== currentQuestion.correctIndex && (
                          <XCircle className="w-5 h-5 text-rose-600" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {examMode === 'practice' && (
                      <>
                        <button
                          onClick={handleRequestAiTutorHint}
                          disabled={isLoadingAiTutor || aiTutorHintLevel >= 3}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Bot className="w-4 h-4 text-emerald-600" />
                          <span>{isLoadingAiTutor ? 'Analyzing Logic...' : `Socratic Hint (${aiTutorHintLevel}/3)`}</span>
                        </button>

                        {currentQuestion.formula && (
                          <button
                            onClick={() => setShowFormula(!showFormula)}
                            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                          >
                            <Calculator className="w-3.5 h-3.5 text-slate-600" />
                            <span>{showFormula ? 'Hide Formula' : 'Formula Reveal'}</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {examMode === 'practice' ? (
                      !isAnswerSubmitted ? (
                        <button
                          onClick={handleSubmitAnswer}
                          disabled={selectedOption === null}
                          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                        >
                          Submit Answer
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuestion}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <span>Next Challenge</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
                      >
                        <span>Next Question</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Socratic AI Tutor Response Display */}
                {aiTutorResponse && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-emerald-600" /> Socratic AI Placement Guidance
                      </span>
                    </div>
                    <div className="whitespace-pre-line text-slate-700 leading-relaxed">
                      {aiTutorResponse.text}
                    </div>
                  </div>
                )}

                {/* Formula Display */}
                {showFormula && currentQuestion.formula && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-mono text-amber-900">
                    <strong>Placement Shortcut Formula:</strong> {currentQuestion.formula}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
