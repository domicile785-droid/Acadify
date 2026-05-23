import React from "react";
import { 
  Users, Award, Calendar, FileText, CheckCircle, TrendingUp, AlertTriangle, Clock, MapPin, Gift, BellRing, ChevronRight
} from "lucide-react";
import { Student, Teacher, Notice, Fee, Homework } from "../types";

interface DashboardViewProps {
  role: "admin" | "teacher" | "student" | "parent";
  students: Student[];
  teachers: Teacher[];
  notices: Notice[];
  fees: Fee[];
  homework: Homework[];
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ 
  role, students, teachers, notices, fees, homework, onNavigate 
}: DashboardViewProps) {
  
  // Custom statistics calculation
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const activeStudents = students.filter(s => s.status === "Active").length;
  const offlineNotices = notices.slice(0, 3);
  
  // Fee summaries
  const totalUnpaidFees = fees
    .filter(f => f.status !== "Paid")
    .reduce((sum, current) => sum + current.amount, 0);

  const activeHomeworkCount = homework.length;

  return (
    <div className="space-y-6">
      
      {/* Dynamic Role Greeting Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-teal-950 to-slate-950 p-6 sm:p-8 text-white border border-teal-920 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            Smart School Portal • {role} Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-300 bg-clip-text text-transparent">GOVT HSS HAIGAM App</span>
          </h1>
          <p className="text-slate-300 max-w-2xl text-sm leading-relaxed">
            Manage student registrations, marked attendances, homework tasks, results charts, fees collection, and ask questions to Smarty AI anytime.
          </p>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat Card 1 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-750 shadow-2xs flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-300 transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Student Body</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{totalStudents}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-emerald-500 font-bold">{activeStudents}</span> Active Today
            </p>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-750 shadow-2xs flex flex-col justify-between group hover:border-teal-500/30 transition-all duration-300 transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Faculty Strength</span>
            <div className="p-2 bg-teal-50 dark:bg-teal-950/40 rounded-xl text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{totalTeachers}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">Subject Specialized</p>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-750 shadow-2xs flex flex-col justify-between group hover:border-indigo-500/30 transition-all duration-300 transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Homework</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{activeHomeworkCount}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">Deadline Tracks Active</p>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-750 shadow-2xs flex flex-col justify-between group hover:border-rose-500/30 transition-all duration-300 transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Fees Ledger Outstanding</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">${totalUnpaidFees}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">Pending Reminders Set</p>
          </div>
        </div>

      </div>

      {/* Main Grid: Left Side Feature list & Right Side Quick Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Dynamic Overview & Activities */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick Tasks Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-750 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-500" />
                Actions & Quick Navigation
              </h2>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-medium" onClick={() => onNavigate("students")}>
                View Directory
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => onNavigate("attendance")} 
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 hover:border-emerald-500/20 text-left cursor-pointer transition-all"
              >
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Attendance System</h4>
                  <p className="text-xs text-slate-400 mt-1">Mark daily present & absent history logs</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>

              <button 
                onClick={() => onNavigate("homework")} 
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 hover:border-emerald-500/20 text-left cursor-pointer transition-all"
              >
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Homework Tracker</h4>
                  <p className="text-xs text-slate-400 mt-1">Upload exercises & check completion rates</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>

              <button 
                onClick={() => onNavigate("results")} 
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 hover:border-emerald-500/20 text-left cursor-pointer transition-all"
              >
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Exam & Results</h4>
                  <p className="text-xs text-slate-400 mt-1">Download report cards & view analytics</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>

              <button 
                onClick={() => onNavigate("timetable")} 
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 hover:border-emerald-500/20 text-left cursor-pointer transition-all"
              >
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Class Timetable</h4>
                  <p className="text-xs text-slate-400 mt-1">Check lessons timeline & assigned rooms</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>
            </div>
          </div>

          {/* Attendance visual analytics */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-750 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Attendance Overview</h2>
              <span className="text-xs font-mono bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded">Target 95%</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  <span>Present Rate (Average)</span>
                  <span>92.4%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                  <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: "92.4%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  <span>Late Rate (Average)</span>
                  <span>4.8%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                  <div className="bg-amber-400 h-2.5 rounded-full transition-all duration-1000" style={{ width: "4.8%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  <span>Absent Rate (Average)</span>
                  <span>2.8%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                  <div className="bg-rose-400 h-2.5 rounded-full transition-all duration-1000" style={{ width: "2.8%" }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6 border-t border-slate-100 dark:border-slate-700 pt-4 text-center">
              <div>
                <span className="text-xs text-slate-400 block">Class 10A</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">96.1%</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Class 10B</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">89.4%</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Class 9A</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">93.2%</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Notice Board Overview & Exam reminders */}
        <div className="space-y-6">
          
          {/* Active Notice Board Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-750 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BellRing className="h-5 w-5 text-amber-500 animate-bounce" />
                Latest Announcements
              </h3>
              <button 
                onClick={() => onNavigate("notices")} 
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                See All
              </button>
            </div>

            <div className="space-y-4">
              {offlineNotices.map((notice) => {
                const badgeColor = {
                  emergency: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-900",
                  holiday: "bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border-teal-200 dark:border-teal-900",
                  exam: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900",
                  general: "bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400 border-slate-200 dark:border-slate-900"
                }[notice.type];

                return (
                  <div key={notice.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        {notice.type.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{notice.date}</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 tracking-tight leading-snug">
                      {notice.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {notice.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming exam timeline widget */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-105 dark:border-slate-750 p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Semester Midterms Schedule</h3>
            
            <div className="space-y-3 font-sans">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Calculus & Geometry</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">June 15th, 09:00 AM • Main Hall</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-teal-500 mt-1.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Electrodynamics (Physics)</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">June 17th, 10:45 AM • Room 302</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">World History Exam</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">June 20th, 09:00 AM • Auditorium</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
