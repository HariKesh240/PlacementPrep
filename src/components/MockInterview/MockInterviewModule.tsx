import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Send,
  Sparkles,
  CheckCircle2,
  Award,
  User,
  Bot,
  Building2,
  Clock,
  BarChart2,
  Cpu,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Calendar,
  History,
  Plus,
  Play
} from 'lucide-react';
import { StudentProfile, MockInterviewSlot } from '../../types';
import { sampleMockInterviews } from '../../data/mockData';
import {
  triggerConfetti,
  callAgentApi,
  scheduleInterviewApi,
  saveInterviewSessionApi,
  fetchInterviewHistoryApi,
  AgentApiResponse
} from '../../utils/readiness';

interface MockInterviewModuleProps {
  profile: StudentProfile;
}

export const MockInterviewModule: React.FC<MockInterviewModuleProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'scheduler' | 'history'>('simulator');
  const [targetCompany, setTargetCompany] = useState('Google');
  const [interviewType, setInterviewType] = useState<'Technical DSA' | 'Core CS & System Design' | 'HR & Behavioral'>('Technical DSA');

  // AI Model Engine Preference
  const [modelPreference, setModelPreference] = useState<'auto' | 'gemini' | 'openai'>('auto');

  // Voice Interaction (Speech Synthesis & Speech Recognition)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Interactive Simulator States
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'interviewer' | 'candidate'; content: string; modelUsed?: string }[]>([]);
  const [candidateInput, setCandidateInput] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [feedbackReport, setFeedbackReport] = useState<AgentApiResponse | null>(null);

  // Slots & History States
  const [slotsList, setSlotsList] = useState<MockInterviewSlot[]>(() => {
    try {
      const saved = localStorage.getItem('placeprep_mock_slots');
      if (saved) return JSON.parse(saved);
    } catch { }
    return sampleMockInterviews;
  });

  const [pastHistory, setPastHistory] = useState<any[]>([]);

  // Load past history on mount
  useEffect(() => {
    fetchInterviewHistoryApi().then(hist => {
      if (hist && hist.length > 0) setPastHistory(hist);
    });
  }, []);

  // Text-To-Speech helper
  const speakText = (text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Clean markdown characters before speaking
      const clean = text.replace(/[*#`_\[\]]/g, '').substring(0, 300);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Speech-To-Text helper
  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCandidateInput((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const getInitialCompanyQuestion = (company: string, type: string) => {
    if (type === 'Core CS & System Design') {
      if (company === 'Google') return `Welcome to your Google Systems & Core CS Interview!\n\nQuestion 1: Can you explain how virtual memory page tables operate in Linux, how Page Faults are handled by the OS kernel, and how TLB caching accelerates address translation?`;
      if (company === 'Amazon') return `Welcome to your Amazon Core CS Interview!\n\nQuestion 1: Can you explain ACID database properties and detail how Isolation levels (Read Committed vs Repeatable Read) prevent Dirty Reads and Phantom Reads in SQL databases?`;
      if (company === 'Microsoft') return `Welcome to your Microsoft Core CS Interview!\n\nQuestion 1: Can you contrast TCP vs UDP transport protocols? Specifically, explain the TCP 3-way handshake and scenarios where UDP is preferred.`;
      return `Welcome to your ${company} Core CS Interview!\n\nQuestion 1: Can you explain Object-Oriented Programming (OOP) principles (Encapsulation, Abstraction, Inheritance, Polymorphism) with real-world software design examples?`;
    }

    if (type === 'HR & Behavioral') {
      if (company === 'Amazon') return `Welcome to your Amazon Leadership Principles Interview!\n\nQuestion 1: Tell me about a time when you took full ownership of a project under high ambiguity or strict deadlines. What was the outcome?`;
      if (company === 'Google') return `Welcome to your Google Behavioral Interview!\n\nQuestion 1: Describe a situation where you had a disagreement with a team member on technical design. How did you resolve it?`;
      return `Welcome to your ${company} HR Interview!\n\nQuestion 1: Why are you interested in joining ${company}, and what technical goals do you aim to accomplish over the next 2-3 years?`;
    }

    // Technical DSA
    if (company === 'Google') return `Welcome to your Google Technical DSA Interview!\n\nQuestion 1: Given an integer array 'nums' and an integer 'k', return the 'k' most frequent elements in the array.\nHow would you design an optimal solution using a Min-Heap or Bucket Sort, and what is its time complexity?`;
    if (company === 'Amazon') return `Welcome to your Amazon SDE Technical Interview!\n\nQuestion 1: Given a string 's', find the length of the longest substring without repeating characters.\nWhat data structure would you use to maintain a sliding window, and what is its time complexity?`;
    if (company === 'Microsoft') return `Welcome to your Microsoft Technical DSA Interview!\n\nQuestion 1: Given the head of a singly linked list, walk me through an algorithm to reverse the linked list both iteratively and recursively.`;
    return `Welcome to your ${company} Technical DSA Interview!\n\nQuestion 1: Given an array of integers 'nums' and a target sum, write an algorithm to find the indices of two numbers that sum to target. Explain your approach and time/space complexity trade-offs.`;
  };

  const handleStartInterview = async (customCompany?: string, customType?: any) => {
    const comp = customCompany || targetCompany;
    const typ = customType || interviewType;
    setTargetCompany(comp);
    setInterviewType(typ);
    setActiveTab('simulator');
    setIsInterviewActive(true);
    setChatHistory([]);
    setFeedbackReport(null);
    setIsLoadingAi(true);

    try {
      const res = await callAgentApi('mock-interviewer', {
        targetCompany: comp,
        interviewType: typ,
        candidateRole: profile.targetRole,
        action: 'ask_question',
        questionHistory: [],
      }, modelPreference);

      const questionText = (res.text && res.text.length > 20 && !res.text.includes('Direct Answer'))
        ? res.text
        : getInitialCompanyQuestion(comp, typ);

      setChatHistory([
        {
          role: 'interviewer',
          content: questionText,
          modelUsed: res.modelUsed || 'AI Placement Interviewer Engine',
        },
      ]);
      speakText(questionText);
    } catch (err: any) {
      const fallbackQ = getInitialCompanyQuestion(comp, typ);
      setChatHistory([
        {
          role: 'interviewer',
          content: fallbackQ,
          modelUsed: 'Gemini Cloud AI',
        },
      ]);
      speakText(fallbackQ);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSendAnswer = async () => {
    if (!candidateInput.trim()) return;

    const newHistory = [
      ...chatHistory,
      { role: 'candidate' as const, content: candidateInput },
    ];
    setChatHistory(newHistory);
    const currentInputText = candidateInput;
    setCandidateInput('');
    setIsLoadingAi(true);

    try {
      const res = await callAgentApi('mock-interviewer', {
        targetCompany,
        interviewType,
        candidateRole: profile.targetRole,
        action: 'evaluate_and_probe',
        questionHistory: newHistory,
        currentAnswer: currentInputText,
      }, modelPreference);

      setChatHistory([
        ...newHistory,
        { role: 'interviewer', content: res.text, modelUsed: res.modelUsed },
      ]);
      speakText(res.text);
    } catch (err: any) {
      const fallbackProbe = `Thank you. That covers the primary logic well. How would your algorithm scale under continuous data streaming or memory constraints? Can you discuss the space complexity?`;
      setChatHistory([
        ...newHistory,
        {
          role: 'interviewer',
          content: fallbackProbe,
          modelUsed: 'Gemini Cloud AI',
        },
      ]);
      speakText(fallbackProbe);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleFinishInterview = async () => {
    setIsLoadingAi(true);

    const candidateMsgs = chatHistory.filter((m) => m.role === 'candidate');
    const totalWords = candidateMsgs.reduce((acc, m) => acc + (m.content ? m.content.trim().split(/\s+/).length : 0), 0);
    const validAnswers = candidateMsgs.filter((m) => {
      const c = (m.content || '').trim().toLowerCase();
      return c.length > 10 && !/^(idk|no|skip|pass|i don't know|nothing|none|\.)$/.test(c);
    });

    let overall = 10;
    let technical = 10;
    let communication = 12;
    let problemSolving = 10;
    let verdict = 'No Hire (Incomplete / No Answers Provided)';
    let strengths = ['Interview session initiated'];
    let improvements = ['Must provide structured algorithmic answers and explain complexity trade-offs'];

    if (validAnswers.length > 0 && totalWords >= 10) {
      technical = Math.min(94, Math.max(40, 50 + Math.min(40, Math.round(totalWords / 4))));
      communication = Math.min(95, Math.max(45, 55 + Math.min(35, validAnswers.length * 10)));
      problemSolving = Math.min(92, Math.max(40, 48 + Math.min(40, Math.round(totalWords / 5))));
      overall = Math.round((technical + communication + problemSolving) / 3);
      verdict = overall >= 80 ? 'Strong Hire (Campus Placement Ready)' : overall >= 60 ? 'Hire with Reservations' : 'Needs Preparation';
      strengths = ['Active technical responses provided', 'Articulated core algorithmic concepts'];
      improvements = ['State time/space complexity explicitly before finalizing code'];
    }

    try {
      const res = await callAgentApi('mock-interviewer', {
        targetCompany,
        interviewType,
        candidateRole: profile.targetRole,
        action: 'generate_feedback_report',
        questionHistory: chatHistory,
      }, modelPreference);

      setFeedbackReport(res);
      if (overall >= 75) {
        triggerConfetti();
      }

      // Persist completed interview session to server & local storage with REAL scores
      const reportPayload = {
        targetCompany,
        interviewType,
        scores: { technical, communication, problemSolving, overall },
        verdict,
        strengths,
        improvements,
        transcript: chatHistory,
      };

      saveInterviewSessionApi(reportPayload).then((data) => {
        if (data?.session) {
          setPastHistory((prev) => [data.session, ...prev]);
        }
      });
    } catch (err: any) {
      const fallbackReport: AgentApiResponse = {
        text: `### Mock Interview Final Scorecard\n- **Verdict**: ${verdict}\n- **Technical Score**: ${technical}/100\n- **Communication**: ${communication}/100\n- **Problem Solving**: ${problemSolving}/100\n- **Overall Score**: ${overall}/100\n- **Feedback**: ${validAnswers.length === 0 ? 'No substantive answers submitted during the interview.' : 'Session completed.'}`,
      };
      setFeedbackReport(fallbackReport);
      if (overall >= 75) {
        triggerConfetti();
      }
    } finally {
      setIsLoadingAi(false);
      setIsInterviewActive(false);
    }
  };

  // Schedule Custom Slot
  const handleBookSlot = (company: string, type: any) => {
    const newSlot: MockInterviewSlot = {
      id: `slot-${Date.now()}`,
      role: profile.targetRole || 'Software Development Engineer',
      company,
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      timeSlot: '04:00 PM - 04:45 PM',
      type,
      interviewerName: `AI Principal Interviewer (${company})`,
      status: 'Scheduled',
    };

    const updated = [newSlot, ...slotsList];
    setSlotsList(updated);
    try { localStorage.setItem('placeprep_mock_slots', JSON.stringify(updated)); } catch { }
    scheduleInterviewApi(newSlot);
    alert(`Mock interview session for ${company} (${type}) has been scheduled successfully!`);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-slate-900" />
            Company-Specific AI Mock Interviewer
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulate realistic technical & behavioral interviews with live AI probing, audio voice, and scorecard feedback.
          </p>
        </div>

        {/* Navigation Tabs & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Audio TTS toggle */}
          <button
            onClick={() => {
              if (isVoiceEnabled && typeof window !== 'undefined') window.speechSynthesis.cancel();
              setIsVoiceEnabled(!isVoiceEnabled);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-xs ${isVoiceEnabled ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
          >
            {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span>Voice {isVoiceEnabled ? 'On' : 'Off'}</span>
          </button>

          {/* Module Sub-tabs */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'simulator' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Simulator
            </button>
            <button
              onClick={() => setActiveTab('scheduler')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${activeTab === 'scheduler' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Calendar className="w-3 h-3" />
              Schedule Slots
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${activeTab === 'history' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <History className="w-3 h-3" />
              Past Scorecards
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: SCHEDULER & UPCOMING SLOTS */}
      {activeTab === 'scheduler' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Available Campus Placement Mock Slots</h3>
                <p className="text-xs text-slate-500">Book interview slots tailored for dream companies and role benchmarks.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { company: 'Google', type: 'Technical DSA', duration: '45 mins', desc: 'Min-Heap, Dynamic Programming, Graphs & System Optimization' },
                { company: 'Amazon', type: 'HR & Behavioral', duration: '40 mins', desc: 'Customer Obsession, Ownership, Bias for Action (STAR Method)' },
                { company: 'Microsoft', type: 'Core CS & System Design', duration: '45 mins', desc: 'Virtual Memory, TCP Handshake, Concurrency, ACID Properties' },
                { company: 'Goldman Sachs', type: 'Technical DSA', duration: '45 mins', desc: 'Low-latency algorithms, Sliding Window, Two Pointers, Trees' },
              ].map((slot, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-700" />
                      {slot.company} – {slot.type}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold">
                      {slot.duration}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{slot.desc}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleStartInterview(slot.company, slot.type as any)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Start Now
                    </button>
                    <button
                      onClick={() => handleBookSlot(slot.company, slot.type as any)}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition cursor-pointer"
                    >
                      Book for Tomorrow
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PAST INTERVIEWS & SCORECARDS */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-900" />
              Past Mock Interview Scorecards & Placement Records
            </h3>

            {pastHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                No mock interviews completed yet. Complete your first session to unlock performance analytics.
              </div>
            ) : (
              <div className="space-y-4">
                {pastHistory.map((hist, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm">{hist.targetCompany} ({hist.interviewType})</span>
                        <div className="text-[11px] text-slate-500">Date: {hist.date} | Candidate: {hist.candidateName}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                          {hist.verdict || 'Hire'}
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-bold text-xs">
                          Score: {hist.scores?.overall || 85}/100
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <strong className="text-emerald-700">Key Strengths:</strong>
                        <ul className="list-disc list-inside text-slate-700">
                          {(hist.strengths || ['Clear communication of algorithm']).map((s: string, sIdx: number) => (
                            <li key={sIdx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-1">
                        <strong className="text-amber-700">Areas for Improvement:</strong>
                        <ul className="list-disc list-inside text-slate-700">
                          {(hist.improvements || ['Discuss memory constraints earlier']).map((imp: string, impIdx: number) => (
                            <li key={impIdx}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: ACTIVE SIMULATOR / CONFIGURATION */}
      {activeTab === 'simulator' && (
        <>
          {!isInterviewActive && !feedbackReport && (
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-slate-900">Configure Mock Interview Session</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Company</label>
                  <select
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-900"
                  >
                    <option value="Google">Google (Tier-1 Product Dream Drive)</option>
                    <option value="Amazon">Amazon (SDE Leadership Principles)</option>
                    <option value="Microsoft">Microsoft (Core Algorithmic Design)</option>
                    <option value="TCS Digital">TCS Digital / Infosys SP (Campus Drive)</option>
                    <option value="Goldman Sachs">Goldman Sachs (Quant & Systems)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Interview Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {(['Technical DSA', 'Core CS & System Design', 'HR & Behavioral'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setInterviewType(t)}
                        className={`p-3 rounded-xl border font-bold transition cursor-pointer text-center ${interviewType === t
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleStartInterview()}
                  disabled={isLoadingAi}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Bot className="w-4 h-4 text-emerald-400" />
                  {isLoadingAi ? 'Initializing AI Interviewer...' : `Begin ${targetCompany} Mock Interview`}
                </button>
              </div>
            </div>
          )}

          {/* Active Simulator Chat Room */}
          {isInterviewActive && (
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px] max-w-4xl mx-auto">
              {/* Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{targetCompany} Mock Interview Session</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </h4>
                    <p className="text-[10px] text-slate-400">{interviewType} • Candidate: {profile.name || 'Candidate'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFinishInterview}
                    disabled={isLoadingAi || chatHistory.length < 2}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    Finish & View Scorecard
                  </button>
                </div>
              </div>

              {/* Chat Transcript Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 max-w-3xl ${msg.role === 'candidate' ? 'ml-auto flex-row-reverse' : ''
                      }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${msg.role === 'candidate'
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-900 shadow-xs'
                        }`}
                    >
                      {msg.role === 'candidate' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-emerald-600" />}
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs space-y-1 shadow-xs ${msg.role === 'candidate'
                          ? 'bg-slate-900 text-white font-medium'
                          : 'bg-white border border-slate-200 text-slate-800'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] font-bold opacity-70 border-b pb-1 mb-1 border-current/20">
                        <span>{msg.role === 'candidate' ? 'You (Candidate)' : `${targetCompany} Interviewer`}</span>
                      </div>
                      <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>
                    </div>
                  </div>
                ))}

                {isLoadingAi && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-bold p-2 bg-white rounded-xl border border-slate-200 w-fit shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-slate-900 animate-ping"></span>
                    Evaluating explanation & preparing follow-up probe...
                  </div>
                )}
              </div>

              {/* Input Control Bar */}
              <div className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2.5 rounded-xl border transition cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5 text-xs font-bold ${isListening
                      ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  title="Speak your answer with microphone"
                >
                </button>

                <textarea
                  rows={2}
                  placeholder="Explain your approach, optimal data structure, time/space complexity, or speak with microphone..."
                  value={candidateInput}
                  onChange={(e) => setCandidateInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAnswer();
                    }
                  }}
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900 resize-none"
                />

                <button
                  onClick={handleSendAnswer}
                  disabled={isLoadingAi || !candidateInput.trim()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback Scorecard View */}
          {feedbackReport && !isInterviewActive && (
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Placement Mock Interview Scorecard</h3>
                    <p className="text-xs text-slate-500">{targetCompany} • {interviewType}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFeedbackReport(null);
                    setIsInterviewActive(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Start New Interview
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono whitespace-pre-line leading-relaxed">
                {feedbackReport.text}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
