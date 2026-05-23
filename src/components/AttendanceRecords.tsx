import React, { useState } from "react";
import { 
  Users, Check, X, Clock, Calendar, CheckSquare, Save, Search, History, BookOpen, UserCheck, AlertCircle 
} from "lucide-react";
import { Student, Attendance } from "../types";

interface AttendanceProps {
  students: Student[];
  attendanceLogs: Attendance[];
  onSaveAttendance: (items: Attendance[]) => Promise<void>;
  onTriggerNotification: (title: string, content: string, role: "student" | "parent" | "teacher" | "all") => Promise<void>;
  userName: string;
  teacherId?: string;
  classId?: string;
  sectionName?: string;
  academicSession?: string;
}

export default function AttendanceRecords({ 
  students, attendanceLogs, onSaveAttendance, onTriggerNotification, userName, teacherId, classId, sectionName, academicSession 
}: AttendanceProps) {
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeSubTab, setActiveSubTab] = useState<"mark" | "history">("mark");

  // Local buffer map of selected student IDs onto marked states: "Present" | "Absent" | "Late"
  const [currentMarks, setCurrentMarks] = useState<Record<string, "Present" | "Absent" | "Late">>({});

  // Use all students passed in the prop directly, as they are already filtered by the teacher's assignment.
  const classStudents = students;

  // Load existing records if any
  const handleLoadStudentsList = () => {
    const marks: Record<string, "Present" | "Absent" | "Late"> = {};
    
    // Default everyone to present first
    classStudents.forEach(s => {
      marks[s.id] = "Present";
    });

    // Check if logs already exist for this date
    const logsForDate = attendanceLogs.filter(l => l.attendance_date === selectedDate);
    logsForDate.forEach(l => {
      if (marks[l.student_id] !== undefined || students.some(x => x.id === l.student_id)) {
        marks[l.student_id] = l.status;
      }
    });

    setCurrentMarks(marks);
  };

  React.useEffect(() => {
    handleLoadStudentsList();
  }, [selectedDate, students, attendanceLogs]);

  const handleUpdateStatus = (sid: string, status: "Present" | "Absent" | "Late") => {
    setCurrentMarks(prev => ({
      ...prev,
      [sid]: status
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const items: Attendance[] = Object.entries(currentMarks).map(([student_id, status]) => ({
        id: `att-${student_id}-${selectedDate}`,
        student_id,
        attendance_date: selectedDate,
        status: status as "Present" | "Absent" | "Late",
        marked_by: userName,
        teacher_id: teacherId,
        class_id: classId,
        section_name: sectionName,
        academic_session: academicSession
      }));

      // NOTE: The parent `onSaveAttendance` will be responsible for the actual Supabase UPSERT logic 
      // as requested. We just send the payload now.
      await onSaveAttendance(items);
    
      // Parent notification triggers automatic warning for Absentees!
      const absentees = items.filter(x => x.status === "Absent");
      for (const item of absentees) {
        const studentObj = students.find(s => s.id === item.student_id);
        if (studentObj) {
          await onTriggerNotification(
            "Student Attendance Alert",
            `Dear Parent, your child ${studentObj.name} has been marked ABSENT on ${selectedDate}. Contact counselor if this is an issue.`,
            "parent"
          );
        }
      }

      // Inform of Success
      alert(`Attendance saved successfully`);
    } catch (err) {
      console.error(err);
      alert("Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="space-y-6">
      
      {/* Sub Tabs Selection */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab("mark")}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "mark" 
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold" 
              : "border-transparent text-slate-450 hover:text-slate-800"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Mark Daily Checklist
        </button>

        <button
          onClick={() => setActiveSubTab("history")}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "history" 
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold" 
              : "border-transparent text-slate-450 hover:text-slate-800"
          }`}
        >
          <History className="h-4 w-4" />
          Attendance History Logs
        </button>
      </div>

      {activeSubTab === "mark" ? (
        <div className="space-y-6">
          
          {/* Class Filters Control */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-755 shadow-3xs max-w-5xl">
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-450 uppercase block">Check-In Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-hidden focus:border-emerald-500 text-slate-700 dark:text-slate-350"
              />
            </div>

            <div className="flex items-end pt-3 sm:pt-0">
              <button
                onClick={handleSaveAll}
                disabled={isSaving || classStudents.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform cursor-pointer disabled:opacity-40"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Submit marked checklist"}
              </button>
            </div>

          </div>


          {/* Student Status List */}
          {classStudents.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border p-12 text-center max-w-xl">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700 dark:text-slate-200">No student enrollment loads</h4>
              <p className="text-xs text-slate-400 mt-1">There are no students listed. Head over to 'Student Management' first to enroll students in your assigned class.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-750 shadow-3xs overflow-hidden max-w-5xl">
              <div className="p-5 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Mark student checklist: {classStudents.length} loaded</span>
                <span className="text-xs text-slate-400 font-mono">Status registers instantly in memory before database commit</span>
              </div>

              <div className="divide-y divide-slate-50 dark:divide-slate-700/60">
                {classStudents.map((student) => {
                  const markedStatus = currentMarks[student.id] || "Present";
                  
                  return (
                    <div key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-3">
                        <img
                          src={student.photo_url}
                          alt="avatar"
                          className="h-10 w-10 rounded-lg object-cover ring-2 ring-slate-150"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{student.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">Roll: {student.roll_no} • Guardian: {student.parent_name}</span>
                        </div>
                      </div>

                      {/* Status selectors */}
                      <div className="flex items-center gap-1">
                        
                        {/* Present Button */}
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(student.id, "Present")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                            markedStatus === "Present"
                              ? "bg-emerald-500 text-white font-extrabold shadow-sm"
                              : "bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Present
                        </button>

                        {/* Late Button */}
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(student.id, "Late")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                            markedStatus === "Late"
                              ? "bg-amber-500 text-white font-extrabold shadow-sm"
                              : "bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Late
                        </button>

                        {/* Absent Button */}
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(student.id, "Absent")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                            markedStatus === "Absent"
                              ? "bg-rose-500 text-white font-extrabold shadow-sm"
                              : "bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          <X className="h-3.5 w-3.5" />
                          Absent
                        </button>

                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* History logs */
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-755 p-5 shadow-3xs space-y-4 max-w-5xl">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700 pb-3">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Past Marked Attendances</h3>
            <span className="text-xs text-slate-400 font-mono">Review previous checklists flagged in database</span>
          </div>

          {attendanceLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No historical checks inside the timeline.
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-450 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5">Student ID / Roll</th>
                    <th className="py-2.5">Status Check</th>
                    <th className="py-2.5">Date Marked</th>
                    <th className="py-2.5">Authorizing Educator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700 font-sans text-slate-600 dark:text-slate-350">
                  {attendanceLogs.map((log) => {
                    const matchedStud = students.find(s => s.id === log.student_id);
                    
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/20">
                        <td className="py-2.5">
                          <span className="font-bold text-slate-800 dark:text-slate-250 block">
                            {matchedStud ? matchedStud.name : `ID: ${log.student_id}`}
                          </span>
                          <span className="text-[10px] text-slate-400">Roll: {matchedStud ? matchedStud.roll_no : 'Unknown'}</span>
                        </td>
                        <td className="py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            log.status === "Present" 
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" 
                              : log.status === "Late" 
                                ? "bg-amber-55 text-amber-600 dark:bg-amber-955/20" 
                                : "bg-rose-50 text-rose-600 dark:bg-rose-950/20"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono">{log.attendance_date}</td>
                        <td className="py-2.5 font-semibold text-slate-700 dark:text-slate-300">{log.marked_by || userName}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
