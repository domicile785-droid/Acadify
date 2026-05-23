import React, { useState } from "react";
import { 
  Award, Plus, Calendar, BookOpen, Layers, CheckSquare, Sparkles, Send, X, ShieldAlert, Download, Printer, Percent, BarChart2 
} from "lucide-react";
import { Result, Student } from "../types";

interface ResultsProps {
  students: Student[];
  results: Result[];
  onAddResult: (item: Result) => Promise<void>;
  isAdminOrTeacher: boolean;
}

export default function ResultsAnalytics({ 
  students, results, onAddResult, isAdminOrTeacher 
}: ResultsProps) {
  
  const [isAdding, setIsAdding] = useState(false);
  
  // Selection details for Report Card mock modal download
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // New markings form
  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [examName, setExamName] = useState("Midterm Exam");
  const [marks, setMarks] = useState<number>(85);
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [comments, setComments] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto populate first student
  React.useEffect(() => {
    if (students.length > 0 && !studentId) {
      setStudentId(students[0].id);
    }
  }, [students, studentId]);

  const handleCreateMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !subject || !marks) return;

    setIsLoading(true);
    const newResult: Result = {
      id: `res-${Date.now()}`,
      student_id: studentId,
      subject,
      marks: Number(marks),
      max_marks: Number(maxMarks),
      exam_name: examName,
      comments: comments || "Well rounded execution.",
      date: new Date().toISOString().split("T")[0]
    };

    await onAddResult(newResult);
    setIsLoading(false);
    setIsAdding(false);
    setComments("");
    alert("Results marking updated inside student database registries.");
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { l: "A+", c: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" };
    if (percentage >= 80) return { l: "A", c: "text-teal-600 bg-teal-50 dark:bg-teal-950/30" };
    if (percentage >= 70) return { l: "B", c: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" };
    if (percentage >= 60) return { l: "C", c: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" };
    return { l: "F", c: "text-rose-600 bg-rose-50 dark:bg-rose-950/30" };
  };

  return (
    <div className="space-y-6">
      
      {/* Upper options banner */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-755 shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Grades & Analytics</h2>
          <p className="text-xs text-slate-400 mt-1">Review student rankings, subject marking lists, and print official reports</p>
        </div>

        {isAdminOrTeacher && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-transform"
          >
            <Plus className="h-4 w-4" />
            Add Student Marks
          </button>
        )}
      </div>

      {/* Adding marks dialog overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform animate-in scale-in duration-200">
            
            <div className="p-5 border-b border-slate-150 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">Register Student Exam Marks</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMark} className="p-6 space-y-4 text-xs">
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Select Student Directory</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-200"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Roll: {s.roll_no} - {s.class_name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-200"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="English Literature">English Literature</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Exam Term</label>
                  <select
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-200"
                  >
                    <option value="Midterm Exam">Midterm Exam</option>
                    <option value="Final Term Exam">Final Term Exam</option>
                    <option value="Class Assessment Unit">Class Assessment Unit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Marks Acquired *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={maxMarks}
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Maximum Scale *</label>
                  <input
                    type="number"
                    required
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-250"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Academic Educator Guidelines / Feedback</label>
                <input
                  type="text"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="e.g. Exhibited thorough work parameters. Highly descriptive formulas."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:opacity-85"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                >
                  {isLoading ? "Submitting..." : "Submit Grades"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Main Results directories listing table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Results directory table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-755 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Subject-wise Result Sheet</h3>
            <span className="text-[10px] font-mono text-slate-400">Total Entries: {results.length}</span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-450 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5">Student</th>
                  <th className="py-2.5">Subject</th>
                  <th className="py-2.5">Exam Term</th>
                  <th className="py-2.5">Marks Scale</th>
                  <th className="py-2.5">Badge Grade</th>
                  <th className="py-2.5 text-right">Report Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700 text-slate-600 dark:text-slate-350">
                {results.map((res) => {
                  const student = students.find(s => s.id === res.student_id);
                  const percentage = Math.round((res.marks / res.max_marks) * 100);
                  const gr = getGrade(percentage);

                  return (
                    <tr key={res.id} className="hover:bg-slate-50/20">
                      <td className="py-2.5">
                        <span className="font-bold text-slate-800 dark:text-white block">{student ? student.name : "Unregistered pupil"}</span>
                        <span className="text-[10px] text-slate-400">Roll: {student ? student.roll_no : "---"} • {student ? student.class_name : "---"}</span>
                      </td>
                      <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">{res.subject}</td>
                      <td className="py-2.5 text-slate-400">{res.exam_name}</td>
                      <td className="py-2.5 font-mono">
                        <strong className="text-slate-850 dark:text-slate-100 font-bold">{res.marks}</strong>/{res.max_marks}
                        <span className="text-[10px] text-slate-400 block">({percentage}%)</span>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2.5 py-0.5 rounded-sm text-[10px] font-extrabold uppercase font-mono ${gr.c}`}>
                          {gr.l}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => student && setSelectedStudent(student)}
                          className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:text-emerald-500 hover:border-emerald-500/30 font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Download className="h-3 w-3" /> Report Card
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytic stats widget (Right side) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-755 shadow-2xs space-y-6">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-emerald-500" />
            Result Analytics
          </h3>
          
          <div className="space-y-4 text-xs">
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-755 rounded-2xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Class Average Pass percentage</span>
              <div className="flex items-center gap-2 mt-2">
                <Percent className="h-5 w-5 text-emerald-500" />
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white">88.5%</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-755 rounded-2xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Distinctions (Grade A+)</span>
              <div className="flex items-center gap-2 mt-2">
                <Award className="h-5 w-5 text-amber-500 fill-amber-500/20" />
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white">3 Pupils</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Subject pass rankings</span>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  <span>Mathematics</span>
                  <span>91%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full">
                  <div className="bg-emerald-500 h-1 rounded-full" style={{ width: "91%" }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  <span>Physics</span>
                  <span>84%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full">
                  <div className="bg-teal-500 h-1 rounded-full" style={{ width: "84%" }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  <span>English Literature</span>
                  <span>95%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full">
                  <div className="bg-indigo-550 h-1 bg-indigo-500 rounded-full" style={{ width: "95%" }}></div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* PDF Report Card Mock modal dialog display */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-4 animate-in fade-in duration-250">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl relative font-serif p-8 border-4 border-slate-105">
            
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-750 font-sans p-1 hover:bg-slate-100 rounded-full cursor-pointer print:hidden"
            >
              <X className="h-5 w-5" />
            </button>

            {/* School Watermark Header inside dialog */}
            <div className="text-center space-y-1 border-b-2 border-slate-900 pb-5">
              <span className="text-[10px] tracking-wider uppercase font-sans font-bold text-slate-400">Official Certification Academic Grade Record</span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-emerald-900 font-sans">Smart School International Academy</h1>
              <p className="text-xs text-slate-500 font-sans">Academic Session Year 2026 • Verified Online Portal Database Report</p>
            </div>

            {/* Student metadata */}
            <div className="grid grid-cols-2 gap-4 my-6 text-xs font-sans text-slate-705 border-b border-dashed border-slate-200 pb-5">
              <div>
                <p>NAME OF PUPIL: <strong className="font-bold text-slate-900 uppercase font-serif text-sm">{selectedStudent.name}</strong></p>
                <p className="mt-1">REGISTRATION ROLL NUMBER: <strong className="font-semibold text-slate-900 font-mono">{selectedStudent.roll_no}</strong></p>
              </div>
              <div className="text-right">
                <p>ACADEMIC RANGE: <strong className="font-bold text-slate-900">{selectedStudent.class_name} ({selectedStudent.section})</strong></p>
                <p className="mt-1">GUARDIAN LINKED: <strong className="font-semibold text-slate-900">{selectedStudent.parent_name}</strong></p>
              </div>
            </div>

            {/* Grades list table */}
            <div className="my-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 font-sans">Course Performance Checklist</h3>
              
              <table className="w-full text-xs font-sans text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5 px-2">COURSE SUBJECT DETAILS</th>
                    <th className="py-2.5 px-2">TERM TEST TYPE</th>
                    <th className="py-2.5 px-2">ACQUIRED MARKS</th>
                    <th className="py-2.5 px-2">MAXIMUM SCALE</th>
                    <th className="py-2.5 px-2 text-right">GRADE RATIO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-700">
                  {results.filter(x => x.student_id === selectedStudent.id).map((res) => {
                    const percentage = Math.round((res.marks / res.max_marks) * 100);
                    const gr = getGrade(percentage);
                    
                    return (
                      <tr key={res.id}>
                        <td className="py-2.5 px-2 font-bold font-serif text-slate-900">{res.subject}</td>
                        <td className="py-2.5 px-2 text-slate-500">{res.exam_name}</td>
                        <td className="py-2.5 px-2 font-mono">{res.marks}</td>
                        <td className="py-2.5 px-2 font-mono">{res.max_marks}</td>
                        <td className="py-2.5 px-2 text-right font-bold"><span className="p-1 px-2.5 rounded font-mono bg-slate-100 text-[10px]">{gr.l}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {results.filter(x => x.student_id === selectedStudent.id).length === 0 && (
                <p className="text-center py-6 text-slate-400 bg-slate-50 rounded">No grades registered for this student under midterm sessions.</p>
              )}
            </div>

            {/* Grading System Footnote */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-5 border-t border-slate-200 text-[9px] text-slate-400 font-sans leading-relaxed">
              <div>
                <strong className="block mb-1">Official Scale Legend:</strong>
                <p>90% - 100%: Distinction Honor (Grade A+)</p>
                <p>80% - 89%: First Division (Grade A)</p>
                <p>60% - 79%: Satisfactory Grade Balance</p>
                <p>Below 60%: Fail Remedial (Grade F)</p>
              </div>

              <div className="text-right flex flex-col justify-between items-end">
                <div className="font-serif italic border-b border-slate-900 w-32 pb-1 text-center text-slate-800">
                  Eminence Principal
                </div>
                <p className="mt-1 font-sans">Authorized Signature Stamp • Verification Code: #SMS-{selectedStudent.roll_no}</p>
              </div>
            </div>

            {/* Printable download actions */}
            <div className="mt-8 flex items-center justify-end gap-2 print:hidden font-sans text-xs">
              <button
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-slate-800 text-slate-50 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="h-4 w-4" /> Print PDF Report
              </button>
              <button
                onClick={() => {
                  alert("Suppled mock report card data packet compiled and dispatched onto your print file streams.");
                  setSelectedStudent(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer shadow-xs"
              >
                Keep File
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
