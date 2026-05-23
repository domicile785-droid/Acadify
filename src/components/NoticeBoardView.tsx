import React, { useState } from "react";
import { 
  Megaphone, Plus, Calendar, Bell, ShieldAlert, Sparkles, X, Filter 
} from "lucide-react";
import { Notice } from "../types";

interface NoticeProps {
  notices: Notice[];
  onAddNotice: (item: Notice) => Promise<void>;
  isAdminOrTeacher: boolean;
}

export default function NoticeBoardView({ 
  notices, onAddNotice, isAdminOrTeacher 
}: NoticeProps) {
  
  const [filterType, setFilterType] = useState<"all" | "holiday" | "exam" | "emergency" | "general">("all");
  const [isAdding, setIsAdding] = useState(false);
  
  // New Notice form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"general" | "holiday" | "exam" | "emergency">("general");
  const [isLoading, setIsLoading] = useState(false);

  // Filter logic
  const filteredNotices = notices.filter(n => filterType === "all" || n.type === filterType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsLoading(true);
    const newNotice: Notice = {
      id: `not-${Date.now()}`,
      title,
      content,
      type,
      date: new Date().toISOString().split("T")[0],
      created_by: "School Administration"
    };

    await onAddNotice(newNotice);
    setIsLoading(false);
    setIsAdding(false);

    // Reset Form
    setTitle("");
    setContent("");
    setType("general");
    alert("Broadband notice announced to all channels and portals!");
  };

  return (
    <div className="space-y-6">
      
      {/* Banner & Control buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-755 shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Notice Board</h2>
          <p className="text-xs text-slate-400 mt-1">Review official administrative notifications, term holidays, and schedule notices</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick filter selection pill bar */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-750 p-1 rounded-xl flex items-center overflow-x-auto shrink-0 text-[11px] font-bold">
            {(["all", "holiday", "exam", "emergency", "general"] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                  filterType === type 
                    ? "bg-slate-850 text-white dark:bg-emerald-600 font-extrabold" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {isAdminOrTeacher && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="h-4 w-4" />
              Announce
            </button>
          )}
        </div>
      </div>

      {/* Announcements Adding modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform animate-in scale-in duration-200">
            
            <div className="p-5 border-b border-slate-150 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">Announce Official Notice</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">Notice Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-hidden text-slate-700 dark:text-slate-350"
                >
                  <option value="general">📢 General Announcement</option>
                  <option value="holiday">🏖️ Term / Holiday Closure</option>
                  <option value="exam">📝 Examination Timetable</option>
                  <option value="emergency">🚨 Emergency / Urgent Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">Title / Heading *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Science Exhibition Registration Open"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-hidden text-slate-700 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">Body Content / Information *</label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste details of the announcement here..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-hidden text-slate-700 dark:text-slate-300"
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
                  {isLoading ? "Broadcasting..." : "Publish Broadcast"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Notices Timeline Grid */}
      {filteredNotices.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border">
          <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">Quiet board</h4>
          <p className="text-xs text-slate-450 mt-1">No announcements registered under this card filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => {
            const colors = {
              emergency: {
                border: "border-rose-100 dark:border-rose-900/60",
                bg: "bg-rose-50/50 dark:bg-rose-950/10",
                badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-455",
                iconText: "🚨"
              },
              holiday: {
                border: "border-teal-100 dark:border-teal-900/60",
                bg: "bg-teal-50/50 dark:bg-teal-950/10",
                badge: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-455",
                iconText: "🏖️"
              },
              exam: {
                border: "border-indigo-100 dark:border-indigo-900/60",
                bg: "bg-indigo-50/50 dark:bg-indigo-950/10",
                badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-455",
                iconText: "📝"
              },
              general: {
                border: "border-slate-100 dark:border-slate-805",
                bg: "bg-white dark:bg-slate-800",
                badge: "bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-355",
                iconText: "📢"
              }
            }[notice.type];

            return (
              <div 
                key={notice.id} 
                className={`p-5 rounded-2xl border ${colors.border} ${colors.bg} tracking-tight shadow-3xs flex flex-col justify-between transition-all hover:scale-[1.005] duration-200`}
              >
                <div>
                  
                  <div className="flex items-center justify-between mb-3 text-[10px] font-bold">
                    <span className={`px-2.5 py-0.5 rounded-full ${colors.badge} flex items-center gap-1`}>
                      <span>{colors.iconText}</span>
                      <span className="uppercase tracking-wider">{notice.type}</span>
                    </span>
                    <span className="text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Ordered: {notice.date}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-150 leading-snug">
                    {notice.title}
                  </h3>

                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-2 leading-relaxed">
                    {notice.content}
                  </p>

                </div>

                <div className="border-t border-slate-105/10 dark:border-slate-700/65 pt-3.5 mt-4 flex items-center justify-between text-[11px] text-slate-450 font-medium">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Dispatcher: <strong className="text-slate-600 dark:text-slate-300">{notice.created_by}</strong>
                  </span>
                  
                  <span className="flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 font-bold font-mono uppercase bg-teal-50 dark:bg-teal-950/20 px-2 py-0.5 rounded">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" /> Active Broadcaster
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
