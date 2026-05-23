import React, { useState } from "react";
import { 
  Bell, Send, Trash2, ShieldAlert, Sparkles, Filter, CheckCircle2, UserCheck 
} from "lucide-react";
import { SchoolNotification } from "../types";

interface PushProps {
  notifications: SchoolNotification[];
  onTriggerNotification: (title: string, content: string, role: "student" | "parent" | "teacher" | "all") => Promise<void>;
  onClearNotification: (id: string) => Promise<void>;
  isAdmin: boolean;
}

export default function PushNotificationCenter({ 
  notifications, onTriggerNotification, onClearNotification, isAdmin 
}: PushProps) {
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState<"student" | "parent" | "teacher" | "all">("all");
  const [filterRole, setFilterRole] = useState<"all" | "student" | "parent" | "teacher">("all");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsLoading(true);
    await onTriggerNotification(title, content, targetRole);
    setIsLoading(false);

    // Reset Form
    setTitle("");
    setContent("");
    alert("Universal Push notification dispatched onto role-specific channel channels!");
  };

  const filteredNotices = notifications.filter(
    n => filterRole === "all" || n.target_role === filterRole
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Upper options banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-755 shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Notification Center</h2>
          <p className="text-xs text-slate-400 mt-1">Review live dispatched mobile push alerts or dispatch critical updates</p>
        </div>

        {/* Filter selection pill bar */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-1 rounded-xl flex items-center overflow-x-auto text-[11px] font-bold">
          <span className="text-slate-400 text-[10px] px-2 uppercase shrink-0">Show Category:</span>
          {(["all", "student", "parent", "teacher"] as const).map(role => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                filterRole === role 
                  ? "bg-slate-900 text-white dark:bg-emerald-600 font-extrabold" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Create Notification (Admin Only) */}
        <div className={`md:col-span-1 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-755 shadow-2xs space-y-4 h-fit ${!isAdmin && "opacity-50 pointer-events-none"}`}>
          <div className="border-b border-slate-50 dark:border-slate-705 pb-3">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-emerald-500" /> Dispatch Push Alert
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Dispatches instant toast notification logs to targets</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Target User Role Channel</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as any)}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-705 dark:text-slate-350"
              >
                <option value="all">🌍 Broadcaster (All Active roles)</option>
                <option value="student">🎓 Students portal channel</option>
                <option value="parent">🏡 Parents coordinates feed</option>
                <option value="teacher">🍎 Faculty Staff directory</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-505 dark:text-slate-404 mb-1">Notification Title *</label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Science Fair Postponed"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-300"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Alert content *</label>
              <textarea
                required
                rows={4}
                disabled={!isAdmin}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type complete alert guidelines..."
                className="w-full px-3 py-2 border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-350"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !isAdmin || !title || !content}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              {isLoading ? "Broadcasting..." : "Dispatch Alert Live"}
            </button>

          </form>
        </div>

        {/* Right Side: Notification Logs Feed */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-755 shadow-2xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-slate-705 text-xs">
            <h3 className="font-bold text-slate-850 dark:text-slate-205 text-sm">Dispatched Alerts Feed</h3>
            <span className="text-[10px] text-slate-400 font-mono">Total Feed logs: {filteredNotices.length}</span>
          </div>

          {filteredNotices.length === 0 ? (
            <div className="py-16 text-center text-slate-450 space-y-2">
              <CheckCircle2 className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="font-bold">No active push alerts</h4>
              <p className="text-[11px] max-w-xs mx-auto">All systems are operational and quiet. Dispatched alerts show up here.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredNotices.map((n) => {
                const badgeColor = {
                  student: "bg-indigo-50 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900",
                  parent: "bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400 border border-teal-100 dark:border-teal-900",
                  teacher: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900",
                  all: "bg-emerald-50 text-emerald-750 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900"
                }[n.target_role || "all"];

                return (
                  <div 
                    key={n.id} 
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-755 bg-slate-50/20 dark:bg-slate-900/10 flex items-start gap-3.5 group hover:border-emerald-500/15 duration-200 text-xs"
                  >
                    
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-755 text-slate-500 shrink-0">
                      <Bell className="h-4 w-4" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                          {n.target_role}
                        </span>
                        
                        {isAdmin && (
                          <button
                            onClick={() => onClearNotification(n.id)}
                            className="p-1 text-slate-400 hover:text-rose-650 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer whitespace-nowrap"
                            title="Purge alert"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <h4 className="font-extrabold text-slate-800 dark:text-white tracking-tight text-xs leading-snug">
                        {n.title}
                      </h4>

                      <p className="text-[11px] text-slate-550 dark:text-slate-405 leading-relaxed">
                        {n.content}
                      </p>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
