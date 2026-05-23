import React, { useState } from "react";
import { 
  FileText, Plus, Calendar, BookOpen, Layers, CheckSquare, Sparkles, Send, X, ShieldAlert 
} from "lucide-react";
import { Homework } from "../types";

interface HomeworkProps {
  homeworkList: Homework[];
  onAddHomework: (item: Homework) => Promise<void>;
  isAdminOrTeacher: boolean;
  teacherName: string;
}

export default function HomeworkBoard({ 
  homeworkList, onAddHomework, isAdminOrTeacher, teacherName 
}: HomeworkProps) {
  
  const [isAdding, setIsAdding] = useState(false);
  
  // New homework form state
  const [subject, setSubject] = useState("Mathematics");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(new Date().toISOString().split("T")[0]);
  const [selectedClass, setSelectedClass] = useState("Class 10");
  const [selectedSection, setSelectedSection] = useState("A");

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setIsLoading(true);
    const newHw: Homework = {
      id: `hw-${Date.now()}`,
      subject,
      title,
      description,
      deadline,
      class_name: selectedClass,
      section: selectedSection,
      teacher_name: teacherName || "Elena Rostova",
      created_at: new Date().toISOString().split("T")[0]
    };

    await onAddHomework(newHw);
    setIsLoading(false);
    setIsAdding(false);
    
    // Reset form
    setTitle("");
    setDescription("");
  };

  return (
    <div className="space-y-6">
      
      {/* Banner & Trigger */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-75) shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Active Assignments</h2>
          <p className="text-xs text-slate-400 mt-1">Review active curricula homeworks, download templates, and log completion goals</p>
        </div>

        {isAdminOrTeacher && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-transform"
          >
            <Plus className="h-4 w-4" />
            Assign Homework
          </button>
        )}
      </div>

      {/* Adding Model Overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs transition-opacity p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform animate-in scale-in duration-200">
            
            <div className="p-5 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">Post New Homework Task</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Subject Area</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 focus:outline-hidden"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="English Literature">English Literature</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Deadline Date</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Target Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-700 dark:text-slate-200"
                  >
                    <option value="Class 10">Class 10</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 8">Class 8</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Section</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-700 dark:text-slate-200"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Exercises 4.1 Quadratic Curves"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-700 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Detailed Worksheet Instructions *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline the steps, textbook pages, reading sources or custom worksheets here..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-700 dark:text-slate-350"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:opacity-80 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  {isLoading ? "Posting..." : "Dispatch Task"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Homework Grid list */}
      {homeworkList.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">Clean slate</h3>
          <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto">
            No homework has been dispatched for your section loads. Enjoy the extra reading rest!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {homeworkList.map((hw) => (
            <div 
              key={hw.id} 
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-755 p-5 shadow-2xs relative flex flex-col justify-between group hover:border-indigo-500/10 transition-all duration-300"
            >
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 font-extrabold px-3 py-1 rounded-full">
                    {hw.subject}
                  </span>
                  
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-750 px-2 py-1 rounded">
                    {hw.class_name}-{hw.section}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 dark:text-slate-150 leading-snug tracking-tight text-sm">
                  {hw.title}
                </h3>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed whitespace-pre-line">
                  {hw.description}
                </p>
              </div>

              {/* Bottom footer bar */}
              <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-450 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  Due: <strong className="text-rose-600 dark:text-rose-400 font-bold">{hw.deadline}</strong>
                </span>

                <span className="font-mono text-[10px] text-slate-400">
                  Assigned by: {hw.teacher_name}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
