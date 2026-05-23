import React, { useState } from "react";
import { 
  Calendar, Clock, Filter, BookOpen, Layers, MapPin, UserCheck 
} from "lucide-react";
import { TimetableEntry } from "../types";

interface TimetableProps {
  entries: TimetableEntry[];
}

export default function TimetableGrid({ entries }: TimetableProps) {
  
  const [selectedClass, setSelectedClass] = useState("Class 10");
  const [selectedSection, setSelectedSection] = useState("A");

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

  // Filter schedules matching target criteria
  const getSchedulesForDay = (day: string) => {
    return entries
      .filter(
        e => e.class_name === selectedClass && 
             e.section === selectedSection && 
             e.day_of_week === day
      )
      .sort((a,b) => a.start_time.localeCompare(b.start_time));
  };

  return (
    <div className="space-y-6">
      
      {/* Filters options banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-755 shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-105 tracking-tight">Weekly Lecture Schedule</h2>
          <p className="text-xs text-slate-400 mt-1">Check lesson subject blocks, teacher assignments, and classroom logs</p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs px-3.5 py-2.5 border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-200 outline-hidden"
          >
            <option value="Class 10">Class 10</option>
            <option value="Class 9">Class 9</option>
            <option value="Class 8">Class 8</option>
          </select>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="text-xs px-3.5 py-2.5 border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-705 dark:text-slate-200 underline-hidden outline-hidden"
          >
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>
        </div>
      </div>

      {/* Week Timeline columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {DAYS.map((day) => {
          const dayLessons = getSchedulesForDay(day);

          return (
            <div key={day} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-755 overflow-hidden shadow-3xs flex flex-col justify-between">
              
              {/* Day Header */}
              <div className="bg-slate-50 dark:bg-slate-900/10 p-3.5 border-b border-slate-100 dark:border-slate-700/60 text-center">
                <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                  {day}
                </h3>
              </div>

              {/* Day Lessons stack */}
              <div className="p-3 space-y-3 flex-1 min-h-[350px]">
                {dayLessons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-350 dark:text-slate-550 border border-dashed border-slate-100 dark:border-slate-750 rounded-xl">
                    <Calendar className="h-6 w-6 opacity-30 mb-2" />
                    <span className="text-[10px] font-bold">No Scheduled lectures</span>
                  </div>
                ) : (
                  dayLessons.map((lesson) => {
                    const mathOrScienceColor = {
                      Mathematics: "border-l-4 border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10",
                      Physics: "border-l-4 border-l-teal-500 bg-teal-50/20 dark:bg-teal-950/10",
                      Chemistry: "border-l-4 border-l-cyan-500 bg-cyan-50/20 dark:bg-cyan-950/10",
                      "English Literature": "border-l-4 border-l-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10",
                      "Computer Science": "border-l-4 border-l-purple-500 bg-purple-50/20 dark:bg-purple-950/10"
                    }[lesson.subject] || "border-l-4 border-l-slate-400 bg-slate-50/40 dark:bg-slate-900/40";

                    return (
                      <div 
                        key={lesson.id} 
                        className={`p-3 rounded-xl border border-slate-100/50 dark:border-slate-700/60 group hover:shadow-xs transition-shadow ${mathOrScienceColor}`}
                      >
                        
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-450 dark:text-slate-500 font-bold font-mono">
                          <Clock className="h-3 w-3 text-slate-405 shrink-0" />
                          <span>{lesson.start_time} - {lesson.end_time}</span>
                        </div>

                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-white mt-1.5 tracking-tight truncate leading-tight">
                          {lesson.subject}
                        </h4>

                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 truncate">
                          Teacher: {lesson.teacher_name}
                        </span>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
