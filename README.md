  # PlacePrep AI - Campus Placement Preparation Platform

> **Comprehensive, AI-powered campus recruitment and placement enablement platform for engineering students and college Training & Placement Offices (TPOs).**

---

## 🌟 Key Features

### 1. 🎯 0–100 Placement Readiness Engine
*   **Weighted Multi-Dimensional Score**: Computes an objective placement readiness score:
    *   **DSA (30%)**
    *   **Aptitude (25%)**
    *   **SQL (20%)**
    *   **Core CS (15%)**
    *   **Consistency Streak (10%)**
*   **Tier Classification**: *Placement Ready*, *Almost Ready*, *Needs Improvement*, *Beginner*.
*   **Targeted 7-Day Sprint Planner**: Automatically identifies weak topics and structures a customized 7-day preparation schedule.

### 2. 💻 Multi-Language DSA Coding Arena
*   **Supported Languages**: Real execution, syntax validation, and test case evaluation for **JavaScript**, **Python**, **C++**, and **Java**.
*   **Sandboxed VM Execution**: Safe execution with infinite loop detection and memory/time benchmarking.
*   **6-Stage Progressive AI Hints**: Guides students through *Intuition &rarr; Data Structure Selection &rarr; Edge Cases &rarr; Pseudo-Code &rarr; Bug Spotting &rarr; Big-O Complexity*.
*   **Custom Test Cases**: Run both default pre-configured test suites and arbitrary custom JSON inputs.

### 3. ⏱️ Aptitude & Reasoning Mastery
*   **Dual Modes**:
    *   **Practice Mode**: Socratic AI hints, formula reveals, and step-by-step logic.
    *   **Timed Placement Exam Mode**: 15-minute countdown, question palette with *Marked for Review*, negative marking (+1.0 / -0.25), and comprehensive post-exam scorecard.
*   **Categorized Modules**: Quantitative Aptitude, Logical Reasoning, and Verbal Ability.

### 4. 🗄️ Interactive SQL Database Arena
*   **Real-time In-Memory Engine**: Powered by **AlaSQL** with pre-seeded campus databases (`departments`, `employees`, `projects`, `student_placements`).
*   **Automated Solution Verification**: Compares query output directly with expected result sets.
*   **AI SQL Mentor**: Socratic guidance for aggregations, complex joins, and window functions.

### 5. 🎙️ AI Mock Interview Simulator (with Web Speech Voice)
*   **Voice-Enabled Interaction**:
    *   **Text-to-Speech (TTS)**: The AI Interviewer speaks out loud with natural inflection (toggle Mute/Voice).
    *   **Speech-to-Text (STT)**: Candidates can speak their responses into the microphone.
*   **Interview Tracks**: Technical DSA, Core CS & System Design, and HR / Behavioral (STAR method).
*   **Interactive Slot Booking & History**: Schedule upcoming sessions and review past performance scorecards.

### 6. 📄 ATS Resume Architect & XYZ Enhancer
*   **Google XYZ Bullet Converter**: Transforms raw statements into metrics-driven achievements (*Accomplished [X] as measured by [Y] by doing [Z]*).
*   **Full CRUD Field Editor**: Add, edit, or delete Education, Skills, and Projects with ease.
*   **Real-Time ATS Diagnostic Scorer**: Analyzes quantifiable metrics, strong action verbs, and structural completeness.
*   **Multi-Template Preview & PDF Export**: Instant printable resumes in *SDE Tech*, *Data & Analytics*, and *Classic Campus Placement* formats.

### 7. 🛡️ Admin & Placement Officer (TPO) Portal
*   **Word (.docx) & PDF Question Parser**: Upload campus question papers; AI extracts MCQs, DSA, and SQL challenges directly into the platform repository.
*   **Cohort Analytics**: Real-time readiness distribution, branch benchmarks (CSE, IT, ECE, Data Science), and CSV roster export.
*   **Central Persistence**: Question updates and custom problems automatically sync to the server's database.

---

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React, Motion, Canvas Confetti.
*   **Backend**: Node.js, Express 4, `tsx`, `esbuild`, `alasql`, `mammoth`.
*   **Security & Persistence**: In-memory and file-backed JSON database (`data/store.json`), salted SHA-256 password hashing, and HMAC-SHA256 JWT tokens.
*   **AI Engine**:
    *   **Google Gemini 3.8 Flash** (`@google/genai`) for multimodal paper parsing and reasoning.
    *   **OpenAI GPT-4o** for advanced out-of-box mock interviews.
    *   **Local LLM / Deterministic Fallback** for low-latency syntax checks and formula hints.

---

## 🚀 Running Locally

### Prerequisites
*   Node.js (v18+)
*   npm or pnpm

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (or `.env.local`):
```bash
cp .env.example .env
```
Fill in your API keys (optional if using local engine):
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
OPENAI_API_KEY="YOUR_OPENAI_API_KEY" # optional
PORT=3000
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Pre-Seeded Demo Accounts

You can login with one-click demo buttons or use these credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Placement Admin (TPO)** | `admin@placeprep.edu` | `Admin@123` |
| **Student Candidate** | `student@placeprep.edu` | `Student@123` |
"# Placement_Prep" 
