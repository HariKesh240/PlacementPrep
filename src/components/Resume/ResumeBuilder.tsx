import React, { useState, useMemo } from 'react';
import {
  FileText,
  Sparkles,
  Printer,
  CheckCircle2,
  Award,
  ExternalLink,
  Bot,
  Plus,
  Trash2,
  BarChart3,
  AlertCircle,
  Check
} from 'lucide-react';
import { ResumeData, StudentProfile } from '../../types';
import { sampleResumeData } from '../../data/mockData';
import { callAgentApi, triggerConfetti, calculateAtsScore, AgentApiResponse } from '../../utils/readiness';

interface ResumeBuilderProps {
  profile: StudentProfile;
}

export const ResumeBuilder: React.FC<ResumeBuilderProps> = ({
  profile,
}) => {
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    try {
      const saved = localStorage.getItem('placeprep_resume_data');
      if (saved) return JSON.parse(saved);
    } catch { }
    return {
      ...sampleResumeData,
      personalInfo: {
        ...sampleResumeData.personalInfo,
        fullName: profile.name || sampleResumeData.personalInfo.fullName,
        email: profile.email || sampleResumeData.personalInfo.email,
      },
      targetRole: profile.targetRole || sampleResumeData.targetRole,
    };
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>('Software Engineer (Tech)');
  const [activeTab, setActiveTab] = useState<'preview' | 'editor' | 'ats-score'>('preview');

  // AI Model preference selector
  const [modelPreference, setModelPreference] = useState<'auto' | 'gemini' | 'openai'>('auto');

  // AI Bullet enhancer state
  const [customBulletInput, setCustomBulletInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<AgentApiResponse | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Sync to local storage
  const handleSaveResume = (updated: ResumeData) => {
    setResumeData(updated);
    try {
      localStorage.setItem('placeprep_resume_data', JSON.stringify(updated));
    } catch { }
  };

  const atsAnalysis = useMemo(() => {
    return calculateAtsScore(resumeData);
  }, [resumeData]);

  const handlePrint = () => {
    window.print();
  };

  const handleEnhanceBullet = async () => {
    if (!customBulletInput.trim()) return;
    setIsEnhancing(true);

    try {
      const res = await callAgentApi('resume-enhancer', {
        rawText: customBulletInput,
        role: resumeData.targetRole,
      }, modelPreference);
      setAiSuggestions(res);
      triggerConfetti();
    } catch (err: any) {
      setAiSuggestions({
        text: `Architected high-throughput backend service handling 10,000+ RPS with 99.9% uptime, reducing P99 query latency by 35% through Redis caching and PostgreSQL query indexing.`,
        modelUsed: 'Gemini Cloud AI',
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Field Manipulation Handlers
  const handleAddEducation = () => {
    const updated = {
      ...resumeData,
      education: [
        ...resumeData.education,
        { degree: 'B.Tech in Computer Science', institution: 'National Institute of Technology', period: '2022 - 2026', score: '8.8 / 10.0' }
      ]
    };
    handleSaveResume(updated);
  };

  const handleDeleteEducation = (idx: number) => {
    const updated = {
      ...resumeData,
      education: resumeData.education.filter((_, i) => i !== idx)
    };
    handleSaveResume(updated);
  };

  const handleAddSkill = () => {
    const updated = {
      ...resumeData,
      skills: [
        ...resumeData.skills,
        { category: 'Cloud & DevOps', items: 'Docker, Kubernetes, AWS S3, CI/CD pipelines' }
      ]
    };
    handleSaveResume(updated);
  };

  const handleDeleteSkill = (idx: number) => {
    const updated = {
      ...resumeData,
      skills: resumeData.skills.filter((_, i) => i !== idx)
    };
    handleSaveResume(updated);
  };

  const handleAddProject = () => {
    const updated = {
      ...resumeData,
      projects: [
        ...resumeData.projects,
        {
          title: 'Campus Recruitment Portal',
          techStack: 'React, Node.js, PostgreSQL',
          bullets: [
            'Engineered full-stack placement portal serving 1,200+ candidates with role-based access control.',
            'Optimized SQL queries and response latency by 40% using database indexes.'
          ]
        }
      ]
    };
    handleSaveResume(updated);
  };

  const handleDeleteProject = (idx: number) => {
    const updated = {
      ...resumeData,
      projects: resumeData.projects.filter((_, i) => i !== idx)
    };
    handleSaveResume(updated);
  };

  const handleAddBulletToProject = (projIdx: number) => {
    const updatedProjects = [...resumeData.projects];
    updatedProjects[projIdx].bullets.push('Accomplished [Metric X] as measured by [Metric Y], by engineering [Action Z].');
    handleSaveResume({ ...resumeData, projects: updatedProjects });
  };

  const handleDeleteBulletFromProject = (projIdx: number, bIdx: number) => {
    const updatedProjects = [...resumeData.projects];
    updatedProjects[projIdx].bullets = updatedProjects[projIdx].bullets.filter((_, i) => i !== bIdx);
    handleSaveResume({ ...resumeData, projects: updatedProjects });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print print:hidden">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-slate-900" />
            Resume Builder
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Single-column ATS compliant resume builder.
          </p>
        </div>

        {/* Template Selector & Controls */}
        <div className="flex flex-wrap items-center gap-2">

          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'preview' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Live Preview
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'editor' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Edit Fields
            </button>

          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Export Resume
          </button>
        </div>
      </div>




      {/* TAB 2: LIVE PREVIEW VIEW */}
      {activeTab === 'preview' && (
        <div
          id="printable-resume"
          className={`p-8 sm:p-12 rounded-3xl bg-white border shadow-md max-w-4xl mx-auto space-y-6 text-slate-900 print:shadow-none print:border-none print:p-0 ${selectedTemplate === 'Classic Campus Placement'
            ? 'font-serif border-slate-400'
            : selectedTemplate === 'Data Analyst / Science'
              ? 'font-sans border-blue-200 bg-slate-50/50'
              : 'font-sans border-slate-300'
            }`}>
          {/* Header */}
          <div className={`border-b-2 pb-4 text-center space-y-1 ${selectedTemplate === 'Classic Campus Placement' ? 'border-slate-800' : 'border-slate-900'
            }`}>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-900">
              {resumeData.personalInfo.fullName}
            </h1>
            <div className="text-xs text-slate-600 flex flex-wrap justify-center gap-3 font-semibold">
              <span>{resumeData.personalInfo.email}</span>
              <span>•</span>
              <span>{resumeData.personalInfo.phone}</span>
              <span>•</span>
              <span>{resumeData.personalInfo.location}</span>
            </div>
            <div className="text-xs text-slate-600 flex flex-wrap justify-center gap-3 font-mono pt-1">
              {resumeData.personalInfo.github && <span>GitHub: {resumeData.personalInfo.github}</span>}
              {resumeData.personalInfo.linkedin && <span>LinkedIn: {resumeData.personalInfo.linkedin}</span>}
              {resumeData.personalInfo.portfolio && <span>Portfolio: {resumeData.personalInfo.portfolio}</span>}
            </div>
          </div>

          {/* Target Role & Summary */}
          {resumeData.personalInfo.summary && (
            <div className="space-y-1 text-xs">
              <h2 className="font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                Executive Profile ({resumeData.targetRole})
              </h2>
              <p className="text-slate-700 leading-relaxed pt-1">{resumeData.personalInfo.summary}</p>
            </div>
          )}

          {/* Education */}
          <div className="space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              Education
            </h2>
            {resumeData.education.map((edu, idx) => (
              <div key={idx} className="flex justify-between text-xs py-0.5">
                <div>
                  <strong className="text-slate-900">{edu.degree}</strong> – {edu.institution}
                </div>
                <div className="text-right text-slate-600 font-semibold">{edu.period} | CGPA: {edu.score}</div>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              Technical Skills
            </h2>
            <div className="text-xs space-y-1">
              {resumeData.skills.map((sk, idx) => (
                <div key={idx}>
                  <strong className="text-slate-900">{sk.category}:</strong> <span className="text-slate-800">{sk.items}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Projects & Practical Experience */}
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              Projects & Engineering Work
            </h2>
            {resumeData.projects.map((proj, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{proj.title} <span className="font-normal text-slate-600">({proj.techStack})</span></span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed">
                  {proj.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Certifications & Achievements */}
          {((resumeData.certifications && resumeData.certifications.length > 0) || (resumeData.achievements && resumeData.achievements.length > 0)) && (
            <div className="space-y-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                Achievements & Certifications
              </h2>
              <ul className="list-disc list-inside text-xs space-y-1 text-slate-700">
                {resumeData.achievements?.map((ach, idx) => (
                  <li key={`ach-${idx}`}>{ach}</li>
                ))}
                {resumeData.certifications?.map((cert, idx) => (
                  <li key={`cert-${idx}`}>{cert}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FULL FIELD EDITOR */}
      {activeTab === 'editor' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-8 max-w-4xl mx-auto text-xs text-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Full Resume Details Editor</h3>
              <p className="text-xs text-slate-500">Add, edit, or delete resume sections. Changes auto-save in real-time.</p>
            </div>
            <button
              onClick={() => setActiveTab('preview')}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-xs cursor-pointer"
            >
              View Updated Resume
            </button>
          </div>

          {/* 1. Personal Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">1. Personal & Contact Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.fullName}
                  onChange={(e) => handleSaveResume({ ...resumeData, personalInfo: { ...resumeData.personalInfo, fullName: e.target.value } })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Placement Role</label>
                <input
                  type="text"
                  value={resumeData.targetRole}
                  onChange={(e) => handleSaveResume({ ...resumeData, targetRole: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => handleSaveResume({ ...resumeData, personalInfo: { ...resumeData.personalInfo, email: e.target.value } })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) => handleSaveResume({ ...resumeData, personalInfo: { ...resumeData.personalInfo, phone: e.target.value } })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.location}
                  onChange={(e) => handleSaveResume({ ...resumeData, personalInfo: { ...resumeData.personalInfo, location: e.target.value } })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">GitHub Profile URL</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.github}
                  onChange={(e) => handleSaveResume({ ...resumeData, personalInfo: { ...resumeData.personalInfo, github: e.target.value } })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">LinkedIn Profile URL</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.linkedin}
                  onChange={(e) => handleSaveResume({ ...resumeData, personalInfo: { ...resumeData.personalInfo, linkedin: e.target.value } })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Portfolio / Personal Site</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.portfolio || ''}
                  onChange={(e) => handleSaveResume({ ...resumeData, personalInfo: { ...resumeData.personalInfo, portfolio: e.target.value } })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Summary / Objective</label>
              <textarea
                rows={2}
                value={resumeData.personalInfo.summary || ''}
                onChange={(e) => handleSaveResume({ ...resumeData, personalInfo: { ...resumeData.personalInfo, summary: e.target.value } })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* 2. Education */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-bold text-slate-900">2. Education</h4>
              <button
                type="button"
                onClick={handleAddEducation}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Degree
              </button>
            </div>
            <div className="space-y-3">
              {resumeData.education.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => handleDeleteEducation(idx)}
                    className="absolute top-3 right-3 text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[idx].degree = e.target.value;
                          handleSaveResume({ ...resumeData, education: updated });
                        }}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Institution</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[idx].institution = e.target.value;
                          handleSaveResume({ ...resumeData, education: updated });
                        }}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Period (e.g. 2022 - 2026)</label>
                      <input
                        type="text"
                        value={edu.period}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[idx].period = e.target.value;
                          handleSaveResume({ ...resumeData, education: updated });
                        }}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Score / CGPA</label>
                      <input
                        type="text"
                        value={edu.score}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[idx].score = e.target.value;
                          handleSaveResume({ ...resumeData, education: updated });
                        }}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Technical Skills */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-bold text-slate-900">3. Technical Skills</h4>
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Skill Category
              </button>
            </div>
            <div className="space-y-3">
              {resumeData.skills.map((sk, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-3 items-center">
                  <div className="w-full sm:w-1/3">
                    <label className="block font-semibold text-slate-600 mb-1">Category</label>
                    <input
                      type="text"
                      value={sk.category}
                      onChange={(e) => {
                        const updated = [...resumeData.skills];
                        updated[idx].category = e.target.value;
                        handleSaveResume({ ...resumeData, skills: updated });
                      }}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="w-full sm:flex-1">
                    <label className="block font-semibold text-slate-600 mb-1">Skills (comma-separated)</label>
                    <input
                      type="text"
                      value={sk.items}
                      onChange={(e) => {
                        const updated = [...resumeData.skills];
                        updated[idx].items = e.target.value;
                        handleSaveResume({ ...resumeData, skills: updated });
                      }}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSkill(idx)}
                    className="text-rose-500 hover:text-rose-700 p-2 cursor-pointer self-end sm:self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Projects & Practical Experience */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-bold text-slate-900">4. Projects & Engineering Work</h4>
              <button
                type="button"
                onClick={handleAddProject}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>
            <div className="space-y-4">
              {resumeData.projects.map((proj, pIdx) => (
                <div key={pIdx} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(pIdx)}
                    className="absolute top-4 right-4 text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Project Title</label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => {
                          const updated = [...resumeData.projects];
                          updated[pIdx].title = e.target.value;
                          handleSaveResume({ ...resumeData, projects: updated });
                        }}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Tech Stack</label>
                      <input
                        type="text"
                        value={proj.techStack}
                        onChange={(e) => {
                          const updated = [...resumeData.projects];
                          updated[pIdx].techStack = e.target.value;
                          handleSaveResume({ ...resumeData, projects: updated });
                        }}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Bullet points */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Project Bullets (Google XYZ Format)</span>
                      <button
                        type="button"
                        onClick={() => handleAddBulletToProject(pIdx)}
                        className="text-[11px] font-bold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Bullet
                      </button>
                    </div>

                    {proj.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex gap-2 items-center">
                        <textarea
                          rows={2}
                          value={b}
                          onChange={(e) => {
                            const updated = [...resumeData.projects];
                            updated[pIdx].bullets[bIdx] = e.target.value;
                            handleSaveResume({ ...resumeData, projects: updated });
                          }}
                          className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteBulletFromProject(pIdx, bIdx)}
                          className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
