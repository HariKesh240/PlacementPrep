import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  TrendingUp,
  Plus,
  Trash2,
  BookOpen,
  Code2,
  Award,
  Database,
  Layers,
  CheckCircle2,
  BarChart3,
  Search,
  UploadCloud,
  FileText,
  Sparkles,
  FileType,
  FileCheck,
  ArrowRight,
  Eye,
  Check,
  AlertCircle,
  Bot,
  Edit3,
  X,
  Save,
  Copy,
  Download,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AptitudeQuestion, DSAProblem, SQLChallenge, Flashcard, CustomSqlTable } from '../../types';
import { sampleAptitudeQuestions, sampleDsaProblems, sampleSqlChallenges, sampleFlashcards, initialCustomSqlTables } from '../../data/mockData';
import { getAuthToken, publishBatchQuestionsApi, saveAdminSqlTableApi, deleteAdminSqlTableApi, fetchAdminSqlTablesApi } from '../../utils/readiness';

interface AdminDashboardProps {
  onAddAptitudeQuestion?: (q: AptitudeQuestion) => void;
  onAddDsaProblem?: (p: DSAProblem) => void;
  onAddSqlChallenge?: (s: SQLChallenge) => void;
  onBatchUpdateStudentPortal?: (items: {
    aptitude?: AptitudeQuestion[];
    dsa?: DSAProblem[];
    sql?: SQLChallenge[];
    flashcard?: Flashcard[];
    customTables?: CustomSqlTable[];
  }) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onAddAptitudeQuestion,
  onAddDsaProblem,
  onAddSqlChallenge,
  onBatchUpdateStudentPortal,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'doc-upload' | 'aptitude' | 'dsa' | 'sql' | 'tables' | 'flashcards'>('doc-upload');

  // Content states loaded from local storage or defaults
  const [aptitudeList, setAptitudeList] = useState<AptitudeQuestion[]>(() => {
    try {
      const saved = localStorage.getItem('placeprep_aptitude_questions');
      if (saved) return JSON.parse(saved);
    } catch { }
    return sampleAptitudeQuestions;
  });

  const [dsaList, setDsaList] = useState<DSAProblem[]>(() => {
    try {
      const saved = localStorage.getItem('placeprep_dsa_problems');
      if (saved) return JSON.parse(saved);
    } catch { }
    return sampleDsaProblems;
  });

  const [sqlList, setSqlList] = useState<SQLChallenge[]>(() => {
    try {
      const saved = localStorage.getItem('placeprep_sql_challenges');
      if (saved) return JSON.parse(saved);
    } catch { }
    return sampleSqlChallenges;
  });

  const [tableList, setTableList] = useState<CustomSqlTable[]>(() => {
    try {
      const saved = localStorage.getItem('placeprep_custom_sql_tables');
      if (saved) return JSON.parse(saved);
    } catch { }
    return initialCustomSqlTables;
  });

  const [flashcardList, setFlashcardList] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem('placeprep_flashcards');
      if (saved) return JSON.parse(saved);
    } catch { }
    return sampleFlashcards;
  });

  // Edit & Add Modal State
  const [editingItem, setEditingItem] = useState<{
    category: 'aptitude' | 'dsa' | 'sql' | 'flashcard';
    item: any;
    isNew?: boolean;
  } | null>(null);

  // Table Edit / Add Modal State
  const [editingTable, setEditingTable] = useState<{
    table: CustomSqlTable;
    isNew?: boolean;
    rawRowsJson?: string;
  } | null>(null);

  // Document Upload & AI Extraction State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [extractedDocQuestions, setExtractedDocQuestions] = useState<any[]>([]);
  const [selectedQuestionIndices, setSelectedQuestionIndices] = useState<number[]>([]);
  const [docUploadSuccessMessage, setDocUploadSuccessMessage] = useState<string | null>(null);
  const [targetCategoryHint, setTargetCategoryHint] = useState<string>('auto-detect');

  // Format Guide states
  const [showFormatGuide, setShowFormatGuide] = useState(true);
  const [formatTab, setFormatTab] = useState<'combined' | 'aptitude' | 'dsa' | 'sql'>('combined');
  const [copiedFormat, setCopiedFormat] = useState(false);

  // Question format sample template definitions
  const sampleTemplates: Record<'combined' | 'aptitude' | 'dsa' | 'sql', string> = {
    combined: `CAMPUS PLACEMENT ASSESSMENT 2026 - TIER-1 TEST PAPER
Subject: Quantitative Aptitude, Data Structures & SQL Database

Q1. [Aptitude] Two pipes A and B can fill a cistern in 20 and 30 minutes respectively. If both pipes are opened together, the time taken to fill the cistern is:
A) 12 minutes
B) 15 minutes
C) 25 minutes
D) 50 minutes
Answer: A
Explanation: Part filled by A in 1 min = 1/20. Part filled by B in 1 min = 1/30. Together in 1 min = (1/20 + 1/30) = 5/60 = 1/12. Hence the cistern fills in 12 minutes.
Formula: Total time = (A * B) / (A + B)
Topic: Pipes & Cisterns
Difficulty: Easy

Q2. [DSA] Two Sum: Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
Code: function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}
Explanation: Using a Hash Map allows O(1) average lookup time, resulting in an overall O(N) linear time complexity.
Topic: Arrays & Hash Maps
Difficulty: Medium

Q3. [SQL] Top Salaries by Department: Write a SQL query to find all employees who earn more than the average salary of their respective departments.
Query: SELECT e.first_name, e.salary, e.dept_id FROM employees e WHERE e.salary > (SELECT AVG(salary) FROM employees WHERE dept_id = e.dept_id);
Explanation: Correlated subquery compares each employee's salary against the average salary calculated for their specific department.
Topic: Subqueries & Joins
Difficulty: Medium`,

    aptitude: `CAMPUS RECRUITMENT DRIVE 2026 - QUANTITATIVE & LOGICAL APTITUDE

Q1. A train running at 60 km/hr crosses a pole in 9 seconds. What is the length of the train?
A) 120 metres
B) 150 metres
C) 180 metres
D) 324 metres
Answer: B
Explanation: Speed = 60 * (5/18) = 50/3 m/sec. Length of train = Speed * Time = (50/3) * 9 = 150 metres.
Formula: Distance = Speed * Time
Topic: Speed, Time & Distance
Difficulty: Easy

Q2. In how many different ways can the letters of the word 'LEADING' be arranged so that the vowels always come together?
A) 360
B) 480
C) 720
D) 5040
Answer: C
Explanation: The vowels are E, A, I (3 vowels). Treat (E, A, I) as one unit. Remaining consonants: L, D, N, G (4 consonants). Total units = 4 + 1 = 5. Ways = 5! * 3! = 120 * 6 = 720.
Formula: Permutations = n! * r!
Topic: Permutations & Combinations
Difficulty: Intermediate

Q3. What is the probability of getting a sum of 9 from two throws of a dice?
A) 1/6
B) 1/8
C) 1/9
D) 1/12
Answer: C
Explanation: Total possible outcomes = 6 * 6 = 36. Favorable outcomes for sum 9 are (3,6), (4,5), (5,4), (6,3) = 4 outcomes. Probability = 4/36 = 1/9.
Formula: P(E) = n(E) / n(S)
Topic: Probability
Difficulty: Intermediate`,

    dsa: `TECHNICAL CODING ASSESSMENT 2026 - ALGORITHMS & DATA STRUCTURES

Q1. [DSA] Reverse a Singly Linked List: Given the head of a singly linked list, reverse the list, and return the reversed list.
Code: function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    let next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}
Explanation: Iterate through the nodes, reversing each link pointer iteratively. Requires O(N) time and O(1) auxiliary space.
Topic: Linked Lists
Difficulty: Easy

Q2. [DSA] Valid Parentheses: Given a string s containing '(', ')', '{', '}', '[' and ']', determine if the input string is valid.
Code: function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (let char of s) {
    if (['(', '{', '['].includes(char)) {
      stack.push(char);
    } else if (stack.pop() !== map[char]) {
      return false;
    }
  }
  return stack.length === 0;
}
Explanation: Use a Stack data structure (LIFO) to ensure closing brackets match the most recently opened bracket. Time: O(N), Space: O(N).
Topic: Stacks
Difficulty: Easy`,

    sql: `DATABASE & SQL ASSESSMENT 2026 - RELATIONAL QUERIES

Q1. [SQL] Second Highest Salary: Write a SQL query to find the second highest distinct salary from the employees table.
Query: SELECT MAX(salary) AS SecondHighestSalary FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);
Explanation: Subquery extracts the maximum salary. The outer query finds the maximum salary strictly less than the top salary.
Topic: Subqueries & Aggregations
Difficulty: Medium

Q2. [SQL] Department Wise Employee Count: Write a SQL query to display department name along with the total count of employees working in each department.
Query: SELECT d.dept_name, COUNT(e.id) AS total_employees FROM departments d LEFT JOIN employees e ON d.id = e.dept_id GROUP BY d.dept_name ORDER BY total_employees DESC;
Explanation: Uses a LEFT JOIN to include departments even if they currently have 0 employees, and GROUP BY on department name.
Topic: Joins & Group By
Difficulty: Medium`
  };

  const handleCopyTemplate = () => {
    const text = sampleTemplates[formatTab];
    navigator.clipboard.writeText(text);
    setCopiedFormat(true);
    setTimeout(() => setCopiedFormat(false), 2200);
  };

  const handleDownloadTemplate = () => {
    const text = sampleTemplates[formatTab];
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PlacePrep_Sample_Format_${formatTab.toUpperCase()}_Template.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadTemplateDirectly = (tab: 'combined' | 'aptitude' | 'dsa' | 'sql') => {
    const sampleText = sampleTemplates[tab];
    const base64 = btoa(unescape(encodeURIComponent(sampleText)));
    setUploadedFile(new File([sampleText], `Sample_${tab.toUpperCase()}_Test_Paper.txt`, { type: 'text/plain' }));
    setFileBase64(base64);
    setDocUploadSuccessMessage(`Loaded "${tab.toUpperCase()}" template into extraction queue. Click "Extract & Structure Questions" below to test!`);
    setExtractedDocQuestions([]);
  };

  // Search/Filter state for lists
  const [searchQuery, setSearchQuery] = useState('');

  // Handle local drive file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setDocUploadSuccessMessage(null);
    setExtractedDocQuestions([]);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || result;
      setFileBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  // Preload sample placement test paper featuring Aptitude, DSA, and SQL
  const handleLoadSamplePaper = () => {
    const sampleText = `CAMPUS RECRUITMENT ASSESSMENT 2026 - TIER-1 TEST PAPER
Subject: Quantitative Aptitude, Data Structures & SQL Database

Q1: Two pipes A and B can fill a cistern in 20 and 30 minutes respectively. If both pipes are opened together, the time taken to fill the cistern is:
A) 12 minutes
B) 15 minutes
C) 25 minutes
D) 50 minutes
Answer: A
Explanation: Part filled by A in 1 min = 1/20. Part filled by B in 1 min = 1/30. Together in 1 min = (1/20 + 1/30) = 5/60 = 1/12. Hence the cistern fills in 12 minutes.
Formula: Total time = (A * B) / (A + B)

Q2: [DSA] Find Two Sum in an Array: Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
Code: function twoSum(nums, target) { const map = new Map(); for(let i=0; i<nums.length; i++) { if(map.has(target - nums[i])) return [map.get(target - nums[i]), i]; map.set(nums[i], i); } }
Explanation: Hash Map lookup takes O(1) time per element, reducing overall time complexity from O(N^2) to O(N).

Q3: [SQL] Top Salaries by Department: Write a SQL query to find all employees who earn more than the average salary of their respective departments.
Query: SELECT e.first_name, e.salary, e.dept_id FROM employees e WHERE e.salary > (SELECT AVG(salary) FROM employees WHERE dept_id = e.dept_id);
Explanation: Correlated subquery compares each employee's salary against the average salary calculated for their specific department.`;

    const base64 = btoa(unescape(encodeURIComponent(sampleText)));
    setUploadedFile(new File([sampleText], 'Placement_Comprehensive_Drive_2026.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    setFileBase64(base64);
    setDocUploadSuccessMessage(null);
    setExtractedDocQuestions([]);
  };

  // Submit file to backend extraction endpoint
  const handleAnalyzeAndExtractQuestions = async () => {
    if (!fileBase64 || !uploadedFile) return;
    setIsAnalyzingDoc(true);
    setDocUploadSuccessMessage(null);

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/admin/parse-questions-doc', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fileBase64,
          fileName: uploadedFile.name,
          fileType: uploadedFile.type,
          targetCategory: targetCategoryHint,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract questions');
      }

      const questions = data.questions || [];
      setExtractedDocQuestions(questions);
      setSelectedQuestionIndices(questions.map((_: any, i: number) => i));
    } catch (err: any) {
      alert(`Error extracting document: ${err.message}`);
    } finally {
      setIsAnalyzingDoc(false);
    }
  };

  const toggleSelectQuestion = (idx: number) => {
    setSelectedQuestionIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handlePublishToStudentPortal = () => {
    const selected = extractedDocQuestions.filter((_, idx) => selectedQuestionIndices.includes(idx));
    if (selected.length === 0) return;

    const newAptitude: AptitudeQuestion[] = [];
    const newDsa: DSAProblem[] = [];
    const newSql: SQLChallenge[] = [];

    selected.forEach((q, idx) => {
      const qType = q.type || 'aptitude';
      if (qType === 'dsa') {
        newDsa.push({
          id: q.id || `dsa-doc-${Date.now()}-${idx}`,
          title: q.title || q.question.split('\n')[0].substring(0, 45) || 'Coding Problem',
          difficulty: q.difficulty || 'Medium',
          category: q.topic || 'Arrays',
          companies: ['Placement Assessment'],
          acceptance: '75%',
          description: q.question,
          examples: [{ input: 'Standard Input', output: 'Expected Output' }],
          constraints: ['N <= 10^5'],
          starterCodes: {
            javascript: q.starterCode || `function solution(input) {\n  // Solved algorithm\n  return true;\n}`,
            python: `def solution(input):\n    return True`,
            cpp: `int solution(int n) {\n    return n;\n}`,
            java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input from System.in and print result\n    }\n}`
          },
          testCases: [{ input: "test", expected: "test" }],
          hints: [q.explanation || 'Analyze constraints and data structures'],
          optimalSolution: {
            language: 'java',
            code: q.starterCode || 'public class Main {\n    public static void main(String[] args) {}\n}',
            timeComplexity: 'O(N)',
            spaceComplexity: 'O(1)',
            explanation: q.explanation || 'Optimal approach'
          }
        });
      } else if (qType === 'sql') {
        newSql.push({
          id: q.id || `sql-doc-${Date.now()}-${idx}`,
          title: q.title || q.question.split('\n')[0].substring(0, 45) || 'SQL Query Challenge',
          difficulty: q.difficulty || 'Medium',
          topic: q.topic || 'Joins',
          description: q.question,
          relevantTables: ['employees', 'departments'],
          starterQuery: q.starterQuery || 'SELECT * FROM employees;',
          expectedQuery: q.starterQuery || 'SELECT * FROM employees;',
          hints: [q.explanation || 'Use standard ANSI SQL syntax']
        });
      } else {
        newAptitude.push({
          id: q.id || `apt-doc-${Date.now()}-${idx}`,
          section: (q.section as any) || 'Quantitative',
          topic: q.topic || 'Campus Aptitude',
          difficulty: (q.difficulty as any) || 'Intermediate',
          question: q.question,
          options: q.options && q.options.length >= 2 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctIndex: q.correctIndex !== undefined ? q.correctIndex : 0,
          explanation: q.explanation || 'Step-by-step logic',
          formula: q.formula,
          companyTags: ['Tier-1 Campus Drive']
        });
      }
    });

    if (newAptitude.length > 0) {
      setAptitudeList(prev => [...newAptitude, ...prev]);
      try { localStorage.setItem('placeprep_aptitude_questions', JSON.stringify([...newAptitude, ...aptitudeList])); } catch { }
    }

    if (newDsa.length > 0) {
      setDsaList(prev => [...newDsa, ...prev]);
      try { localStorage.setItem('placeprep_dsa_problems', JSON.stringify([...newDsa, ...dsaList])); } catch { }
    }

    if (newSql.length > 0) {
      setSqlList(prev => [...newSql, ...prev]);
      try { localStorage.setItem('placeprep_sql_challenges', JSON.stringify([...newSql, ...sqlList])); } catch { }
    }

    if (onBatchUpdateStudentPortal) {
      onBatchUpdateStudentPortal({ aptitude: newAptitude, dsa: newDsa, sql: newSql });
    }

    // Persist to central server store
    publishBatchQuestionsApi({ aptitude: newAptitude, dsa: newDsa, sql: newSql });

    setDocUploadSuccessMessage(`Successfully published ${selected.length} questions directly to the Student Portal & Central Database!`);
    setExtractedDocQuestions([]);
  };

  // Handlers for Save and Delete in Admin lists
  const handleSaveEdit = () => {
    if (!editingItem) return;
    const { category, item, isNew } = editingItem;

    if (category === 'aptitude') {
      const updated = isNew
        ? [item, ...aptitudeList]
        : aptitudeList.map(q => q.id === item.id ? item : q);
      setAptitudeList(updated);
      try { localStorage.setItem('placeprep_aptitude_questions', JSON.stringify(updated)); } catch { }
      if (onBatchUpdateStudentPortal) onBatchUpdateStudentPortal({ aptitude: updated });
      publishBatchQuestionsApi({ aptitude: [item] });
    } else if (category === 'dsa') {
      // Clean and sanitize test cases: parse JSON inputs/outputs if provided as strings
      const sanitizedTestCases = (item.testCases || []).map((tc: any) => {
        let cleanInput = tc.input;
        let cleanExpected = tc.expected;

        if (typeof tc.input === 'string') {
          const trimmed = tc.input.trim();
          if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try { cleanInput = JSON.parse(trimmed); } catch { }
          } else if (trimmed === 'true') cleanInput = true;
          else if (trimmed === 'false') cleanInput = false;
          else if (!isNaN(Number(trimmed)) && trimmed !== '') cleanInput = Number(trimmed);
        }

        if (typeof tc.expected === 'string') {
          const trimmed = tc.expected.trim();
          if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
            try { cleanExpected = JSON.parse(trimmed); } catch { }
          } else if (trimmed === 'true') cleanExpected = true;
          else if (trimmed === 'false') cleanExpected = false;
          else if (!isNaN(Number(trimmed)) && trimmed !== '') cleanExpected = Number(trimmed);
        }

        return {
          ...tc,
          input: cleanInput,
          expected: cleanExpected,
          isHidden: !!tc.isHidden
        };
      });

      const sanitizedItem = { ...item, testCases: sanitizedTestCases };
      const updated = isNew
        ? [sanitizedItem, ...dsaList]
        : dsaList.map(p => p.id === item.id ? sanitizedItem : p);
      setDsaList(updated);
      try { localStorage.setItem('placeprep_dsa_problems', JSON.stringify(updated)); } catch { }
      if (onBatchUpdateStudentPortal) onBatchUpdateStudentPortal({ dsa: updated });
      publishBatchQuestionsApi({ dsa: [sanitizedItem] });
    } else if (category === 'sql') {
      const updated = isNew
        ? [item, ...sqlList]
        : sqlList.map(s => s.id === item.id ? item : s);
      setSqlList(updated);
      try { localStorage.setItem('placeprep_sql_challenges', JSON.stringify(updated)); } catch { }
      if (onBatchUpdateStudentPortal) onBatchUpdateStudentPortal({ sql: updated });
      publishBatchQuestionsApi({ sql: [item] });
    } else if (category === 'flashcard') {
      const updated = isNew
        ? [item, ...flashcardList]
        : flashcardList.map(f => f.id === item.id ? item : f);
      setFlashcardList(updated);
      try { localStorage.setItem('placeprep_flashcards', JSON.stringify(updated)); } catch { }
      if (onBatchUpdateStudentPortal) onBatchUpdateStudentPortal({ flashcard: updated });
      publishBatchQuestionsApi({ flashcard: [item] });
    }

    setEditingItem(null);
  };

  const handleDeleteTable = async (id: string, tableName: string) => {
    if (!confirm(`Are you sure you want to delete table "${tableName}"? This will remove it from the SQL database.`)) return;

    try {
      await deleteAdminSqlTableApi(id);
    } catch (e) {
      console.warn('Failed to delete on server:', e);
    }

    const updated = tableList.filter(t => t.id !== id && t.tableName.toLowerCase() !== tableName.toLowerCase());
    setTableList(updated);
    try { localStorage.setItem('placeprep_custom_sql_tables', JSON.stringify(updated)); } catch { }
    if (onBatchUpdateStudentPortal) onBatchUpdateStudentPortal({ customTables: updated });
  };

  const handleSaveTable = async () => {
    if (!editingTable) return;
    const { table, isNew, rawRowsJson } = editingTable;

    if (!table.tableName || !table.tableName.trim()) {
      alert('Please enter a valid table name.');
      return;
    }

    const safeName = table.tableName.trim().replace(/[^a-zA-Z0-9_]/g, '');
    let parsedRows: any[] = table.rows || [];
    if (rawRowsJson && rawRowsJson.trim()) {
      try {
        const parsed = JSON.parse(rawRowsJson);
        if (Array.isArray(parsed)) {
          parsedRows = parsed;
        } else {
          alert('Rows JSON must be an array of objects.');
          return;
        }
      } catch (err: any) {
        alert('Invalid JSON in rows data: ' + err.message);
        return;
      }
    }

    const savedTable: CustomSqlTable = {
      ...table,
      id: table.id || `tbl-${Date.now()}`,
      tableName: safeName,
      rows: parsedRows,
      createdAt: table.createdAt || new Date().toISOString(),
    };

    try {
      await saveAdminSqlTableApi(savedTable);
    } catch (e) {
      console.warn('Failed to save table to server:', e);
    }

    const updated = isNew
      ? [savedTable, ...tableList.filter(t => t.tableName.toLowerCase() !== safeName.toLowerCase())]
      : tableList.map(t => t.id === savedTable.id ? savedTable : t);

    setTableList(updated);
    try { localStorage.setItem('placeprep_custom_sql_tables', JSON.stringify(updated)); } catch { }
    if (onBatchUpdateStudentPortal) onBatchUpdateStudentPortal({ customTables: updated });

    setEditingTable(null);
  };

  const handleAddNewTable = () => {
    const timestamp = Date.now();
    const newTable: CustomSqlTable = {
      id: `tbl-${timestamp}`,
      tableName: 'new_table',
      description: 'Custom table created by admin for student practice.',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'name', type: 'STRING' },
        { name: 'score', type: 'FLOAT' },
      ],
      rows: [
        { id: 1, name: 'Alice', score: 92.5 },
        { id: 2, name: 'Bob', score: 85.0 },
      ],
      createdAt: new Date().toISOString(),
    };

    setEditingTable({
      table: newTable,
      isNew: true,
      rawRowsJson: JSON.stringify(newTable.rows, null, 2),
    });
  };

  const handleDeleteItem = (category: 'aptitude' | 'dsa' | 'sql' | 'flashcard', id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    if (category === 'aptitude') {
      const updated = aptitudeList.filter(q => q.id !== id);
      setAptitudeList(updated);
      try { localStorage.setItem('placeprep_aptitude_questions', JSON.stringify(updated)); } catch { }
    } else if (category === 'dsa') {
      const updated = dsaList.filter(p => p.id !== id);
      setDsaList(updated);
      try { localStorage.setItem('placeprep_dsa_problems', JSON.stringify(updated)); } catch { }
    } else if (category === 'sql') {
      const updated = sqlList.filter(s => s.id !== id);
      setSqlList(updated);
      try { localStorage.setItem('placeprep_sql_challenges', JSON.stringify(updated)); } catch { }
    } else if (category === 'flashcard') {
      const updated = flashcardList.filter(f => f.id !== id);
      setFlashcardList(updated);
      try { localStorage.setItem('placeprep_flashcards', JSON.stringify(updated)); } catch { }
    }
  };

  // Create empty templates for new items
  const handleAddNewItem = (category: 'aptitude' | 'dsa' | 'sql' | 'flashcard') => {
    const timestamp = Date.now();
    if (category === 'aptitude') {
      const newItem: AptitudeQuestion = {
        id: `apt-${timestamp}`,
        section: 'Quantitative',
        topic: 'New Topic',
        difficulty: 'Intermediate',
        question: 'Enter question text here...',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: 0,
        explanation: 'Enter step-by-step logic here...',
        formula: '',
        companyTags: ['Campus Drive']
      };
      setEditingItem({ category: 'aptitude', item: newItem, isNew: true });
    } else if (category === 'dsa') {
      const newItem: DSAProblem = {
        id: `dsa-${timestamp}`,
        title: 'New DSA Problem',
        difficulty: 'Medium',
        category: 'Arrays',
        companies: ['Tech Drive'],
        acceptance: '70%',
        description: 'Enter problem description here...',
        examples: [{ input: 'nums = [1, 2, 3]', output: '6' }],
        constraints: ['1 <= nums.length <= 10^5'],
        starterCodes: {
          javascript: 'function solution(nums) {\n  // Write solution\n}',
          python: 'def solution(nums):\n    pass',
          cpp: 'int solution(vector<int>& nums) {\n    return 0;\n}',
          java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write solution\n    }\n}'
        },
        testCases: [
          { input: '{"nums": [1, 2, 3], "target": 5}', expected: '[1, 2]', isHidden: false },
          { input: '{"nums": [10, 20, 30], "target": 50}', expected: '[1, 2]', isHidden: true },
        ],
        hints: ['Hint 1'],
        optimalSolution: {
          language: 'java',
          code: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Optimal solution\n    }\n}',
          timeComplexity: 'O(N)',
          spaceComplexity: 'O(1)',
          explanation: 'Explanation of optimal approach'
        }
      };
      setEditingItem({ category: 'dsa', item: newItem, isNew: true });
    } else if (category === 'sql') {
      const newItem: SQLChallenge = {
        id: `sql-${timestamp}`,
        title: 'New SQL Challenge',
        difficulty: 'Medium',
        topic: 'Joins',
        description: 'Enter SQL problem statement here...',
        relevantTables: ['employees', 'departments'],
        starterQuery: 'SELECT * FROM employees;',
        expectedQuery: 'SELECT * FROM employees WHERE salary > 50000;',
        testCases: [
          { id: `sql-tc-sample-${timestamp}`, name: 'Sample Output Match', description: 'Validates columns and row data', isHidden: false },
          { id: `sql-tc-hidden-${timestamp}`, name: 'Hidden Test Case: Filter & Sort Validation', description: 'Evaluates edge conditions and ordering', isHidden: true },
        ],
        hints: ['Consider using INNER JOIN']
      };
      setEditingItem({ category: 'sql', item: newItem, isNew: true });
    } else if (category === 'flashcard') {
      const newItem: Flashcard = {
        id: `fc-${timestamp}`,
        subject: 'Operating Systems',
        topic: 'Process & Memory',
        front: 'What is a deadlock?',
        back: 'A state where a set of processes are blocked because each process holds a resource and waits for another resource held by another process.',
        codeSnippet: ''
      };
      setEditingItem({ category: 'flashcard', item: newItem, isNew: true });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Admin Portal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-amber-50 border border-amber-200 p-6 rounded-3xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            <span>Placement Officer & Curriculum Admin Portal</span>
          </div>
          <h2 className="text-2xl font-extrabold text-amber-950 tracking-tight">
            Curriculum Ingestion & Repository Manager
          </h2>
          <p className="text-xs text-amber-800 mt-1">
            Upload test papers, manage question banks, verify test cases & query executions, and publish directly to students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveAdminTab('doc-upload')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'doc-upload'
                ? 'bg-amber-900 text-white shadow-xs'
                : 'bg-white text-amber-900 hover:bg-amber-100 border border-amber-300'
              }`}
          >
            📄 Ingest Test Document
          </button>
        </div>
      </div>

      {/* Main Admin Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto pb-2 text-xs font-bold">
        {[
          { id: 'doc-upload', label: 'PDF/Word Question Parser', icon: UploadCloud },
          { id: 'aptitude', label: `Aptitude Bank (${aptitudeList.length})`, icon: Award },
          { id: 'dsa', label: `DSA Problems (${dsaList.length})`, icon: Code2 },
          { id: 'sql', label: `SQL Repository (${sqlList.length})`, icon: Database },
          { id: 'tables', label: `SQL Tables Manager (${tableList.length})`, icon: Layers },
          { id: 'flashcards', label: `Core Flashcards (${flashcardList.length})`, icon: BookOpen },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${isActive ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. DOCUMENT UPLOAD & PARSER TAB */}
      {activeAdminTab === 'doc-upload' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-slate-900" />
                Word (.docx) & PDF Placement Paper Extractor
              </h3>
              <button
                onClick={handleLoadSamplePaper}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold border border-slate-200 transition cursor-pointer"
              >
                ⚡ Load Sample Tier-1 Test Paper (Aptitude, DSA & SQL)
              </button>
            </div>

            {docUploadSuccessMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {docUploadSuccessMessage}
              </div>
            )}

            {/* Drag & Drop File Zone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-slate-900 rounded-2xl p-8 text-center space-y-4 transition bg-slate-50">
              <input
                type="file"
                id="docFileInput"
                accept=".docx,.doc,.pdf,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="docFileInput" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-900 shadow-xs">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {uploadedFile ? uploadedFile.name : 'Click to upload Word (.docx) or PDF Test Paper'}
                </div>
                <p className="text-xs text-slate-500">
                  Supports question papers with Aptitude MCQs, DSA algorithms, and SQL database queries.
                </p>
              </label>

              {uploadedFile && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handleAnalyzeAndExtractQuestions}
                    disabled={isAnalyzingDoc}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    {isAnalyzingDoc ? 'Parsing Document Questions...' : 'Extract & Structure Questions'}
                  </button>
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setFileBase64(null);
                      setExtractedDocQuestions([]);
                      setDocUploadSuccessMessage(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Admin Sample Format Guide & Templates */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <HelpCircle className="w-4 h-4 text-amber-800" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Standard Question Upload Format & Sample Templates
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Format your test questions using these standard patterns in Word/Docs or plain text before saving as PDF.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFormatGuide(!showFormatGuide)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    {showFormatGuide ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        Hide Guide
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        Show Guide
                      </>
                    )}
                  </button>
                </div>
              </div>

              {showFormatGuide && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Quick Format Key Rules */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="font-extrabold text-slate-900 block">1. Question Prefix</span>
                      <p className="text-slate-600 font-mono text-[10px]">Q1. | Question 1: | 1.</p>
                      <p className="text-[10px] text-slate-500">Start each question block with a clear number identifier.</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="font-extrabold text-slate-900 block">2. MCQ Options</span>
                      <p className="text-slate-600 font-mono text-[10px]">A) ... | B) ... | C) ... | D) ...</p>
                      <p className="text-[10px] text-slate-500">Put each choice on a new line (A through D).</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="font-extrabold text-slate-900 block">3. Answer & Key</span>
                      <p className="text-slate-600 font-mono text-[10px]">Answer: A | Ans: B</p>
                      <p className="text-[10px] text-slate-500">Specify correct letter or matching option text.</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="font-extrabold text-slate-900 block">4. Code & Queries</span>
                      <p className="text-slate-600 font-mono text-[10px]">Code: ... | Query: SELECT ...</p>
                      <p className="text-[10px] text-slate-500">Use "Code:" for DSA problems and "Query:" for SQL challenges.</p>
                    </div>
                  </div>

                  {/* Format Category Tabs & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {(['combined', 'aptitude', 'dsa', 'sql'] as const).map(tabKey => (
                        <button
                          key={tabKey}
                          onClick={() => setFormatTab(tabKey)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer capitalize ${
                            formatTab === tabKey
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {tabKey === 'combined' ? '📑 Combined Test Paper' :
                           tabKey === 'aptitude' ? '✏️ Aptitude (MCQ)' :
                           tabKey === 'dsa' ? '💻 DSA Code' : '🗄️ SQL Query'}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyTemplate}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-900 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="Copy template to clipboard"
                      >
                        {copiedFormat ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-600" />
                            <span>Copy Template</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleDownloadTemplate}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-900 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="Download sample template as .txt"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>Download (.txt)</span>
                      </button>

                      <button
                        onClick={() => handleLoadTemplateDirectly(formatTab)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        title="Load this sample format directly into the extractor"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Try Sample in Extractor</span>
                      </button>
                    </div>
                  </div>

                  {/* Template Code Viewer */}
                  <div className="relative rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-[11px] leading-relaxed max-h-72 overflow-y-auto border border-slate-800 shadow-inner">
                    <pre className="whitespace-pre-wrap">{sampleTemplates[formatTab]}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Extracted Preview List */}
            {extractedDocQuestions.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Detected {extractedDocQuestions.length} Extracted Items ({selectedQuestionIndices.length} Selected for Publishing)
                  </span>

                  <button
                    onClick={handlePublishToStudentPortal}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    Publish Selected to Student Portal ✓
                  </button>
                </div>

                <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                  {extractedDocQuestions.map((q, idx) => {
                    const isSelected = selectedQuestionIndices.includes(idx);
                    const qType = q.type || 'aptitude';
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border text-xs cursor-pointer transition ${isSelected
                            ? 'bg-white border-slate-900 ring-2 ring-slate-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 opacity-70'
                          }`}
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900 mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectQuestion(idx)}
                              className="w-4 h-4 rounded text-slate-900 accent-slate-900 cursor-pointer"
                            />
                            <span>Q{idx + 1}. {q.topic || (qType === 'dsa' ? 'DSA Problem' : qType === 'sql' ? 'SQL Challenge' : 'Aptitude Question')}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-extrabold ${qType === 'dsa' ? 'bg-purple-100 text-purple-900' :
                                qType === 'sql' ? 'bg-blue-100 text-blue-900' : 'bg-emerald-100 text-emerald-900'
                              }`}>
                              {qType === 'dsa' ? '💻 DSA Code' : qType === 'sql' ? '🗄️ SQL Query' : '✏️ Aptitude MCQ'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem({ category: qType as any, item: { ...q }, isNew: false });
                              }}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold text-slate-800 flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" /> Edit Item
                            </button>
                          </div>
                        </div>

                        <p className="font-semibold text-slate-900 mb-2 leading-relaxed">{q.question}</p>

                        {/* Aptitude MCQ Options */}
                        {qType === 'aptitude' && q.options && (
                          <div className="grid grid-cols-2 gap-1.5 text-slate-700 font-mono text-[11px] mb-2">
                            {q.options.map((opt: string, i: number) => (
                              <div key={i} className={`p-1.5 rounded ${i === q.correctIndex ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300' : 'bg-slate-100'}`}>
                                {String.fromCharCode(65 + i)}. {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* DSA Problem Preview */}
                        {qType === 'dsa' && (
                          <div className="p-2.5 rounded bg-slate-900 text-slate-100 font-mono text-[11px] mb-2 space-y-1">
                            <span className="text-purple-400 font-bold block">// Starter Code Preview</span>
                            <pre className="whitespace-pre-wrap max-h-24 overflow-y-auto">{q.starterCode || `function solution(input) {\n  // Code algorithm\n}`}</pre>
                          </div>
                        )}

                        {/* SQL Challenge Preview */}
                        {qType === 'sql' && (
                          <div className="p-2.5 rounded bg-slate-900 text-emerald-400 font-mono text-[11px] mb-2 space-y-1">
                            <span className="text-blue-400 font-bold block">-- Target SQL Query</span>
                            <pre className="whitespace-pre-wrap max-h-24 overflow-y-auto">{q.starterQuery || 'SELECT * FROM table;'}</pre>
                          </div>
                        )}

                        {q.explanation && (
                          <p className="text-[11px] text-slate-600 bg-slate-100 p-2 rounded italic">
                            💡 Explanation: {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. APTITUDE BANK TAB */}
      {activeAdminTab === 'aptitude' && (
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Aptitude Question Repository</h3>
              <p className="text-xs text-slate-500">View, create, and edit aptitude questions.</p>
            </div>
            <button
              onClick={() => handleAddNewItem('aptitude')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Aptitude Question
            </button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {aptitudeList.map((q) => (
              <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 hover:bg-slate-100/60 transition">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white text-[10px]">{q.section}</span>
                    <span>{q.topic}</span>
                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-700">{q.difficulty}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Answer Key Verified (Option {q.correctIndex + 1})
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingItem({ category: 'aptitude', item: { ...q }, isNew: false })}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem('aptitude', q.id)}
                      className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>

                <p className="font-semibold text-slate-900 leading-relaxed">{q.question}</p>

                {q.options && (
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                    {q.options.map((opt, i) => (
                      <div key={i} className={`p-1.5 rounded ${i === q.correctIndex ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300' : 'bg-white border border-slate-200'}`}>
                        {String.fromCharCode(65 + i)}. {opt}
                      </div>
                    ))}
                  </div>
                )}

                {q.explanation && (
                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 italic">
                    💡 Logic: {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. DSA PROBLEMS TAB */}
      {activeAdminTab === 'dsa' && (
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">DSA Problem Repository</h3>
              <p className="text-xs text-slate-500">View, create, and edit Data Structures & Algorithms coding challenges.</p>
            </div>
            <button
              onClick={() => handleAddNewItem('dsa')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add DSA Problem
            </button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {dsaList.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 hover:bg-slate-100/60 transition">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-purple-900 text-white text-[10px]">{p.category}</span>
                    <span className="text-sm font-extrabold">{p.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${p.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                        p.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {p.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Validated & Executable ({p.testCases?.length || 0} Test Cases)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingItem({ category: 'dsa', item: { ...p }, isNew: false })}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem('dsa', p.id)}
                      className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed">{p.description}</p>

                {p.starterCodes?.javascript && (
                  <div className="p-2.5 rounded bg-slate-900 text-slate-100 font-mono text-[11px] space-y-1">
                    <span className="text-purple-400 font-bold block">// JavaScript Starter Code</span>
                    <pre className="whitespace-pre-wrap max-h-24 overflow-y-auto">{p.starterCodes.javascript}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SQL REPOSITORY TAB */}
      {activeAdminTab === 'sql' && (
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">SQL Challenge Repository</h3>
              <p className="text-xs text-slate-500">View, create, and edit SQL query challenges.</p>
            </div>
            <button
              onClick={() => handleAddNewItem('sql')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add SQL Challenge
            </button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {sqlList.map((s) => (
              <div key={s.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 hover:bg-slate-100/60 transition">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-blue-900 text-white text-[10px]">{s.topic}</span>
                    <span className="text-sm font-extrabold">{s.title}</span>
                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-700">{s.difficulty}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      AlaSQL Executable ({s.relevantTables?.join(', ') || 'Live Table'})
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingItem({ category: 'sql', item: { ...s }, isNew: false })}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem('sql', s.id)}
                      className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed">{s.description}</p>

                {s.starterQuery && (
                  <div className="p-2.5 rounded bg-slate-900 text-emerald-400 font-mono text-[11px] space-y-1">
                    <span className="text-blue-400 font-bold block">-- Starter SQL Query</span>
                    <pre className="whitespace-pre-wrap max-h-24 overflow-y-auto">{s.starterQuery}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. SQL TABLES MANAGER TAB (ADMIN CREATES AND MANAGES LIVE DATABASE TABLES) */}
      {activeAdminTab === 'tables' && (
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-extrabold text-slate-900">Live Database Tables Manager</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin-controlled database tables. Add custom schemas, columns, and sample rows for students to query in SQL practice.
              </p>
            </div>
            <button
              onClick={handleAddNewTable}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              + Add Database Table
            </button>
          </div>

          <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1">
            {tableList.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Database className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-800">No database tables defined yet.</p>
                <p className="text-xs text-slate-500 mt-1">Click "+ Add Database Table" to create a new SQL table for students.</p>
              </div>
            ) : (
              tableList.map((t) => (
                <div key={t.id || t.tableName} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3 hover:bg-slate-100/60 transition">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded bg-emerald-900 text-white font-mono text-[11px]">
                        TABLE: {t.tableName}
                      </span>
                      <span className="text-[11px] bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                        {t.columns?.length || 0} Columns
                      </span>
                      <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                        {t.rows?.length || 0} Data Rows
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingTable({
                          table: { ...t },
                          isNew: false,
                          rawRowsJson: JSON.stringify(t.rows || [], null, 2),
                        })}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Table
                      </button>
                      <button
                        onClick={() => handleDeleteTable(t.id, t.tableName)}
                        className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>

                  {t.description && (
                    <p className="text-slate-600 text-[11px]">{t.description}</p>
                  )}

                  {/* Schema Columns Pill View */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Table Schema Columns:</span>
                    <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                      {t.columns?.map((c, cIdx) => (
                        <span key={cIdx} className="px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-800 shadow-2xs">
                          <strong className="text-slate-900">{c.name}</strong> <span className="text-slate-500 text-[10px]">({c.type})</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sample Rows Preview */}
                  {t.rows && t.rows.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">First 2 Sample Records:</span>
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                        <table className="min-w-full divide-y divide-slate-200 text-[11px] font-mono">
                          <thead className="bg-slate-100">
                            <tr>
                              {t.columns?.map((c, i) => (
                                <th key={i} className="px-3 py-1.5 text-left font-bold text-slate-700">{c.name}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {t.rows.slice(0, 2).map((row, rIdx) => (
                              <tr key={rIdx}>
                                {t.columns?.map((col, cIdx) => (
                                  <td key={cIdx} className="px-3 py-1 text-slate-800">{String(row[col.name] ?? '-')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. CORE FLASHCARDS TAB */}
      {activeAdminTab === 'flashcards' && (
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Core CS Flashcards Repository</h3>
              <p className="text-xs text-slate-500">View, create, and edit OS, DBMS, Networks & OOP flashcards.</p>
            </div>
            <button
              onClick={() => handleAddNewItem('flashcard')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Flashcard
            </button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {flashcardList.map((f) => (
              <div key={f.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 hover:bg-slate-100/60 transition">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-900 text-white text-[10px]">{f.subject}</span>
                    <span className="text-xs font-extrabold">{f.topic}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingItem({ category: 'flashcard', item: { ...f }, isNew: false })}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem('flashcard', f.id)}
                      className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">❓ Front (Question):</span>
                    <p className="text-slate-900">{f.front}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">💡 Back (Answer):</span>
                    <p className="text-slate-900">{f.back}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= EDIT / CREATE ITEM MODAL ================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-slate-900" />
                {editingItem.isNew ? 'Create New' : 'Edit Existing'} {editingItem.category.toUpperCase()} Item
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* APTITUDE EDIT FORM */}
            {editingItem.category === 'aptitude' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Section</label>
                    <select
                      value={editingItem.item.section || 'Quantitative'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, section: e.target.value } })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                    >
                      <option value="Quantitative">Quantitative</option>
                      <option value="Logical">Logical</option>
                      <option value="Verbal">Verbal</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Difficulty</label>
                    <select
                      value={editingItem.item.difficulty || 'Intermediate'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, difficulty: e.target.value } })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Topic</label>
                  <input
                    type="text"
                    value={editingItem.item.topic || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, topic: e.target.value } })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                    placeholder="e.g. Time & Work"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Question Statement</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.question || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, question: e.target.value } })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                    placeholder="Enter question statement..."
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Multiple Choice Options (4)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(editingItem.item.options || ['A', 'B', 'C', 'D']).map((opt: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-500">{String.fromCharCode(65 + idx)}:</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(editingItem.item.options || [])];
                            newOpts[idx] = e.target.value;
                            setEditingItem({ ...editingItem, item: { ...editingItem.item, options: newOpts } });
                          }}
                          className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Correct Answer Option</label>
                  <select
                    value={editingItem.item.correctIndex ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, correctIndex: parseInt(e.target.value, 10) } })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-emerald-800"
                  >
                    {(editingItem.item.options || []).map((opt: string, idx: number) => (
                      <option key={idx} value={idx}>
                        Option {String.fromCharCode(65 + idx)}: {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Step-by-Step Logic Explanation</label>
                  <textarea
                    rows={2}
                    value={editingItem.item.explanation || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, explanation: e.target.value } })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>
            )}

            {/* DSA EDIT FORM */}
            {editingItem.category === 'dsa' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Problem Title</label>
                    <input
                      type="text"
                      value={editingItem.item.title || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Difficulty</label>
                    <select
                      value={editingItem.item.difficulty || 'Medium'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, difficulty: e.target.value } })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Category</label>
                  <input
                    type="text"
                    value={editingItem.item.category || 'Arrays'}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Problem Description</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Java Starter Code (Required for Java-Only Compiler)</label>
                  <textarea
                    rows={4}
                    value={editingItem.item.starterCodes?.java || ''}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      item: {
                        ...editingItem.item,
                        starterCodes: { ...editingItem.item.starterCodes, java: e.target.value }
                      }
                    })}
                    placeholder="import java.util.*;&#10;&#10;public class Main {&#10;    public static void main(String[] args) {&#10;        Scanner sc = new Scanner(System.in);&#10;    }&#10;}"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono bg-slate-900 text-emerald-400 text-[11px]"
                  />
                </div>

                {/* DSA Test Cases Management: Sample & Hidden Test Cases */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3.5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">
                          DSA Test Cases Inventory
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800">
                          {editingItem.item.testCases?.length || 0} total
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Configure sample test cases (visible during practice) and hidden test cases (for final submission).
                      </span>
                    </div>

                    {/* Prominent Top Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const currentTcs = editingItem.item.testCases || [];
                          const templateInput = currentTcs.length > 0 ? (typeof currentTcs[0].input === 'object' ? JSON.stringify(currentTcs[0].input) : currentTcs[0].input) : '{"nums": [1, 2, 3], "target": 5}';
                          const templateExpected = currentTcs.length > 0 ? (typeof currentTcs[0].expected === 'object' ? JSON.stringify(currentTcs[0].expected) : currentTcs[0].expected) : '[0, 1]';
                          const newTc = { input: templateInput, expected: templateExpected, isHidden: false };
                          setEditingItem({
                            ...editingItem,
                            item: { ...editingItem.item, testCases: [...currentTcs, newTc] }
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        title="Add a sample test case visible to students"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Sample Case</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const currentTcs = editingItem.item.testCases || [];
                          const templateInput = currentTcs.length > 0 ? (typeof currentTcs[0].input === 'object' ? JSON.stringify(currentTcs[0].input) : currentTcs[0].input) : '{"nums": [10, 20, 30], "target": 50}';
                          const templateExpected = currentTcs.length > 0 ? (typeof currentTcs[0].expected === 'object' ? JSON.stringify(currentTcs[0].expected) : currentTcs[0].expected) : '[1, 2]';
                          const newTc = { input: templateInput, expected: templateExpected, isHidden: true };
                          setEditingItem({
                            ...editingItem,
                            item: { ...editingItem.item, testCases: [...currentTcs, newTc] }
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        title="Add a hidden test case locked during practice"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Hidden Case</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {(!editingItem.item.testCases || editingItem.item.testCases.length === 0) ? (
                      <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-3">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                        <div>
                          <p className="font-bold text-slate-800 text-sm">No test cases registered for this problem yet</p>
                          <p className="text-xs text-slate-500">Every DSA problem needs at least 1 sample and 1 hidden test case for validation.</p>
                        </div>
                        <div className="flex justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const newTc = { input: '{"nums": [2, 7, 11, 15], "target": 9}', expected: '[0, 1]', isHidden: false };
                              setEditingItem({
                                ...editingItem,
                                item: { ...editingItem.item, testCases: [newTc] }
                              });
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Plus className="w-4 h-4" /> Add Sample Test Case
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newTc = { input: '{"nums": [1, 5, 8, 12, 19], "target": 20}', expected: '[2, 3]', isHidden: true };
                              setEditingItem({
                                ...editingItem,
                                item: { ...editingItem.item, testCases: [newTc] }
                              });
                            }}
                            className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Plus className="w-4 h-4" /> Add Hidden Test Case
                          </button>
                        </div>
                      </div>
                    ) : (
                      editingItem.item.testCases.map((tc: any, tcIdx: number) => (
                        <div
                          key={tcIdx}
                          className={`p-3.5 rounded-xl border transition-all ${tc.isHidden ? 'border-purple-300 bg-purple-50/30' : 'border-slate-200 bg-white'
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-xs">Test Case #{tcIdx + 1}</span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${tc.isHidden
                                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  }`}
                              >
                                {tc.isHidden ? '🔒 Hidden (Locked)' : '👁️ Sample (Visible)'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Toggle visibility pills */}
                              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[10px] font-bold">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedTcs = [...editingItem.item.testCases];
                                    updatedTcs[tcIdx] = { ...updatedTcs[tcIdx], isHidden: false };
                                    setEditingItem({
                                      ...editingItem,
                                      item: { ...editingItem.item, testCases: updatedTcs }
                                    });
                                  }}
                                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${!tc.isHidden ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                  Sample
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedTcs = [...editingItem.item.testCases];
                                    updatedTcs[tcIdx] = { ...updatedTcs[tcIdx], isHidden: true };
                                    setEditingItem({
                                      ...editingItem,
                                      item: { ...editingItem.item, testCases: updatedTcs }
                                    });
                                  }}
                                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${tc.isHidden ? 'bg-purple-700 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                  Hidden
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const updatedTcs = editingItem.item.testCases.filter((_: any, i: number) => i !== tcIdx);
                                  setEditingItem({
                                    ...editingItem,
                                    item: { ...editingItem.item, testCases: updatedTcs }
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                title="Delete this test case"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            <div>
                              <span className="text-[10px] font-bold text-slate-600 block mb-1">
                                Input Parameters (JSON object, array, or scalar):
                              </span>
                              <input
                                type="text"
                                value={typeof tc.input === 'object' ? JSON.stringify(tc.input) : tc.input}
                                onChange={(e) => {
                                  const updatedTcs = [...editingItem.item.testCases];
                                  updatedTcs[tcIdx] = { ...updatedTcs[tcIdx], input: e.target.value };
                                  setEditingItem({
                                    ...editingItem,
                                    item: { ...editingItem.item, testCases: updatedTcs }
                                  });
                                }}
                                placeholder='e.g. {"nums": [2, 7, 11, 15], "target": 9} or "hello"'
                                className="w-full p-2 rounded-lg border border-slate-300 font-mono text-[11px] bg-slate-900 text-emerald-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-600 block mb-1">
                                Expected Return Value (JSON array, number, boolean, etc.):
                              </span>
                              <input
                                type="text"
                                value={typeof tc.expected === 'object' ? JSON.stringify(tc.expected) : tc.expected}
                                onChange={(e) => {
                                  const updatedTcs = [...editingItem.item.testCases];
                                  updatedTcs[tcIdx] = { ...updatedTcs[tcIdx], expected: e.target.value };
                                  setEditingItem({
                                    ...editingItem,
                                    item: { ...editingItem.item, testCases: updatedTcs }
                                  });
                                }}
                                placeholder='e.g. [0, 1] or true or 42'
                                className="w-full p-2 rounded-lg border border-slate-300 font-mono text-[11px] bg-slate-900 text-amber-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SQL EDIT FORM */}
            {editingItem.category === 'sql' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Challenge Title</label>
                    <input
                      type="text"
                      value={editingItem.item.title || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Difficulty</label>
                    <select
                      value={editingItem.item.difficulty || 'Medium'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, difficulty: e.target.value } })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">SQL Topic</label>
                  <input
                    type="text"
                    value={editingItem.item.topic || 'Joins'}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, topic: e.target.value } })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Challenge Description</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Starter SQL Query (Student Template)</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.starterQuery || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, starterQuery: e.target.value } })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono bg-slate-900 text-emerald-400 text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Expected Solution SQL Query (Evaluation Ground Truth)</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.expectedQuery || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, expectedQuery: e.target.value } })}
                    placeholder="SELECT d.dept_name, MAX(e.salary) FROM employees e JOIN departments d ON e.dept_id = d.dept_id GROUP BY d.dept_name;"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono bg-slate-900 text-blue-400 text-[11px]"
                  />
                </div>
              </div>
            )}

            {/* FLASHCARD EDIT FORM */}
            {editingItem.category === 'flashcard' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Subject</label>
                    <select
                      value={editingItem.item.subject || 'Operating Systems'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, subject: e.target.value } })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                    >
                      <option value="Operating Systems">Operating Systems</option>
                      <option value="Computer Networks">Computer Networks</option>
                      <option value="Database Management Systems">Database Management Systems</option>
                      <option value="Object-Oriented Programming">Object-Oriented Programming</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Topic</label>
                    <input
                      type="text"
                      value={editingItem.item.topic || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, topic: e.target.value } })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Front (Question / Prompt)</label>
                  <textarea
                    rows={2}
                    value={editingItem.item.front || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, front: e.target.value } })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Back (Answer / Explanation)</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.back || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, back: e.target.value } })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / ADD MODAL FOR DATABASE TABLES */}
      {editingTable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-900" />
                  {editingTable.isNew ? 'Create New Database Table' : `Edit Table: ${editingTable.table.tableName}`}
                </h3>
                <p className="text-xs text-slate-500">Define table name, columns with data types, and initial records in JSON format.</p>
              </div>
              <button
                onClick={() => setEditingTable(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Table Name (Identifier)</label>
                  <input
                    type="text"
                    value={editingTable.table.tableName || ''}
                    onChange={(e) => setEditingTable({
                      ...editingTable,
                      table: { ...editingTable.table, tableName: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') }
                    })}
                    placeholder="e.g. products, students, orders"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Only alphanumeric characters and underscores</span>
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Description / Purpose</label>
                  <input
                    type="text"
                    value={editingTable.table.description || ''}
                    onChange={(e) => setEditingTable({
                      ...editingTable,
                      table: { ...editingTable.table, description: e.target.value }
                    })}
                    placeholder="e.g. Catalog of retail products"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Columns Editor */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Columns Schema ({editingTable.table.columns?.length || 0})</span>
                  <button
                    type="button"
                    onClick={() => {
                      const currentCols = editingTable.table.columns || [];
                      const newCol = { name: `col_${currentCols.length + 1}`, type: 'STRING' };
                      setEditingTable({
                        ...editingTable,
                        table: { ...editingTable.table, columns: [...currentCols, newCol] }
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> + Add Column
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editingTable.table.columns?.map((col, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        value={col.name}
                        onChange={(e) => {
                          const updated = [...editingTable.table.columns];
                          updated[cIdx] = { ...updated[cIdx], name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') };
                          setEditingTable({ ...editingTable, table: { ...editingTable.table, columns: updated } });
                        }}
                        placeholder="Column name"
                        className="flex-1 p-1.5 rounded-lg border border-slate-300 font-mono text-[11px] font-bold"
                      />
                      <select
                        value={col.type}
                        onChange={(e) => {
                          const updated = [...editingTable.table.columns];
                          updated[cIdx] = { ...updated[cIdx], type: e.target.value };
                          setEditingTable({ ...editingTable, table: { ...editingTable.table, columns: updated } });
                        }}
                        className="p-1.5 rounded-lg border border-slate-300 bg-white font-mono text-[11px] font-semibold"
                      >
                        <option value="STRING">STRING</option>
                        <option value="INT">INT</option>
                        <option value="FLOAT">FLOAT</option>
                        <option value="BOOLEAN">BOOLEAN</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingTable.table.columns.filter((_, i) => i !== cIdx);
                          setEditingTable({ ...editingTable, table: { ...editingTable.table, columns: updated } });
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Rows JSON Editor */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Sample Data Records (JSON Array of Objects)
                </label>
                <textarea
                  rows={6}
                  value={editingTable.rawRowsJson || ''}
                  onChange={(e) => setEditingTable({
                    ...editingTable,
                    rawRowsJson: e.target.value
                  })}
                  placeholder='[\n  { "id": 1, "name": "Item A", "score": 90 }\n]'
                  className="w-full p-3 rounded-xl border border-slate-300 font-mono text-[11px] bg-slate-900 text-emerald-400"
                />
                <span className="text-[10px] text-slate-500">Provide records conforming to the columns declared above.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setEditingTable(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTable}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Table & Sync DB
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
